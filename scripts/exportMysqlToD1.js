// scripts/exportMysqlToD1.js
// ローカルMySQL (realestate_db) の660万件データを集計し、Cloudflare D1 (SQLite) 投入用の分割SQLファイルを d1_export/ に出力するスクリプト
// 使い方:
//   node scripts/exportMysqlToD1.js              (全国 または デフォルト対象を出力)
//   node scripts/exportMysqlToD1.js --pref=13    (特定都道府県のみ高速出力)
//   node scripts/exportMysqlToD1.js --all        (全国11.2万町字すべてを分割出力)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TSUBO = 3.30578;
const MAX_SQL_FILE_BYTES = 4 * 1024 * 1024; // Wrangler D1 の1ファイル推奨上限(5MB未満)に合わせ 4MB ごとに分割

const TYPE_MAP = {
    mansion: '中古マンション等',
    house: '宅地(土地と建物)',
    land: '宅地(土地)',
};
const TYPE_KEYS = Object.fromEntries(Object.entries(TYPE_MAP).map(([k, v]) => [v, k]));

const round1 = (v) => (v == null || !isFinite(v) ? null : Math.round(Number(v) * 10) / 10);
const roundInt = (v) => (v == null || !isFinite(v) ? null : Math.round(Number(v)));
const nfkc = (s) => (s ? String(s).normalize('NFKC') : '');
const periodLabel = (p) => {
    const m = /(\d{4})年第(\d)四半期/.exec(p || '');
    return m ? `${m[1]} Q${m[2]}` : (p || '-');
};

function sqlVal(v) {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
    return `'${String(v).replace(/'/g, "''")}'`;
}

class ChunkedSqlWriter {
    constructor(outDir, prefix) {
        this.outDir = outDir;
        this.prefix = prefix;
        this.part = 1;
        this.currentBytes = 0;
        this.buffer = [];
        this.files = [];
    }

    addStatement(stmt) {
        const line = stmt + '\n';
        const bytes = Buffer.byteLength(line, 'utf8');
        if (this.currentBytes + bytes > MAX_SQL_FILE_BYTES && this.buffer.length > 0) {
            this.flush();
        }
        this.buffer.push(line);
        this.currentBytes += bytes;
    }

    flush() {
        if (this.buffer.length === 0) return;
        const fileName = `${this.prefix}_part${String(this.part).padStart(3, '0')}.sql`;
        const filePath = path.join(this.outDir, fileName);
        fs.writeFileSync(filePath, this.buffer.join(''), 'utf8');
        this.files.push(fileName);
        this.part++;
        this.buffer = [];
        this.currentBytes = 0;
    }
}

/**
 * 1つの市区町村 (muniCode) について、市区町村全体の stats と 配下全町字の stats + districts_json を一括計算
 */
async function processMunicipalityInMemory(db, muniCode) {
    const shortMuni = muniCode.startsWith('0') ? String(Number(muniCode)) : muniCode;
    const [allRows] = await db.query(
        `SELECT Prefecture, Municipality, MunicipalityCode, DistrictName, DistrictCode, Type, Period,
                TradePrice, Area, TotalFloorArea, BuildingYear, Structure, FloorPlan
         FROM transactions USE INDEX (idx_municipality)
         WHERE MunicipalityCode IN (?, ?)
           AND Type IN ('中古マンション等', '宅地(土地と建物)', '宅地(土地)')
         ORDER BY Period DESC, id DESC`,
        [muniCode, shortMuni]
    );

    if (!allRows || allRows.length === 0) return null;

    const prefName = allRows[0].Prefecture || '';
    const cityName = allRows[0].Municipality || '';

    const createBucket = () => {
        const types = {};
        const agg = {};
        for (const k of Object.keys(TYPE_MAP)) {
            types[k] = { count: 0, avgPrice: null, avgSqm: null, avgArea: null, quarters: [], rows: [] };
            agg[k] = { cnt: 0, pSum: 0, pCnt: 0, sSum: 0, sCnt: 0, aSum: 0, aCnt: 0, qMap: new Map() };
        }
        return { types, agg, totalCnt: 0 };
    };

    const cityBucket = createBucket();
    const distBuckets = new Map(); // distCode -> { name, bucket }

    const feedRow = (bucket, r, rowLimit) => {
        const key = TYPE_KEYS[r.Type];
        if (!key) return;
        bucket.totalCnt++;
        const a = bucket.agg[key];
        a.cnt++;

        const price = parseInt(r.TradePrice, 10);
        const area = parseFloat(r.Area);
        const validPrice = Number.isFinite(price) && price > 0;
        const validArea = Number.isFinite(area) && area > 0;

        if (validPrice) { a.pSum += price; a.pCnt++; }
        if (validArea) { a.aSum += area; a.aCnt++; }
        if (validPrice && validArea) { a.sSum += price / area; a.sCnt++; }

        const pKey = r.Period || '';
        let q = a.qMap.get(pKey);
        if (!q) {
            q = { period: pKey, cnt: 0, pSum: 0, pCnt: 0, sSum: 0, sCnt: 0 };
            a.qMap.set(pKey, q);
        }
        q.cnt++;
        if (validPrice) { q.pSum += price; q.pCnt++; }
        if (validPrice && validArea) { q.sSum += price / area; q.sCnt++; }

        if (bucket.types[key].rows.length < rowLimit) {
            const by = parseInt(r.BuildingYear, 10);
            bucket.types[key].rows.push({
                p: periodLabel(r.Period),
                pf: r.Prefecture,
                mu: r.Municipality,
                mc: muniCode,
                d: r.DistrictName && r.DistrictName !== '-' ? r.DistrictName : '',
                dc: r.DistrictCode && r.DistrictCode !== '0' ? String(r.DistrictCode).padStart(9, '0') : '',
                pr: validPrice ? price : 0,
                a: validArea ? area : null,
                fa: parseFloat(r.TotalFloorArea) || null,
                by: Number.isFinite(by) ? by : null,
                st: nfkc(r.Structure),
                fp: nfkc(r.FloorPlan),
            });
        }
    };

    for (const r of allRows) {
        feedRow(cityBucket, r, 40);

        if (r.DistrictName && r.DistrictName !== '-' && r.DistrictCode && r.DistrictCode !== '0') {
            const dCode = String(r.DistrictCode).padStart(9, '0');
            let dEntry = distBuckets.get(dCode);
            if (!dEntry) {
                dEntry = { code: dCode, name: r.DistrictName, bucket: createBucket() };
                distBuckets.set(dCode, dEntry);
            }
            feedRow(dEntry.bucket, r, 25);
        }
    }

    const finalizeBucket = (bucket, maxQuarters = 32) => {
        for (const key of Object.keys(TYPE_MAP)) {
            const a = bucket.agg[key];
            bucket.types[key].count = a.cnt;
            bucket.types[key].avgPrice = a.pCnt > 0 ? roundInt(a.pSum / a.pCnt) : null;
            bucket.types[key].avgSqm = a.sCnt > 0 ? roundInt(a.sSum / a.sCnt) : null;
            bucket.types[key].avgArea = a.aCnt > 0 ? round1(a.aSum / a.aCnt) : null;

            const sortedQ = [...a.qMap.values()].sort((x, y) => x.period.localeCompare(y.period)).slice(-maxQuarters);
            bucket.types[key].quarters = sortedQ.map((q) => ({
                label: periodLabel(q.period),
                count: q.cnt,
                avgPrice: q.pCnt > 0 ? roundInt(q.pSum / q.pCnt) : null,
                avgSqm: q.sCnt > 0 ? roundInt(q.sSum / q.sCnt) : null,
            }));
        }
        return { types: bucket.types };
    };

    const cityStats = finalizeBucket(cityBucket, 36);
    const districtsList = [];
    const districtStatsList = [];

    for (const dEntry of distBuckets.values()) {
        const dStats = finalizeBucket(dEntry.bucket, 24);
        const mAvg = dStats.types.mansion.avgPrice;
        const hAvg = dStats.types.house.avgPrice;
        const lSqm = dStats.types.land.avgSqm;

        districtsList.push({
            code: dEntry.code,
            name: dEntry.name,
            count: dEntry.bucket.totalCnt,
            mansion: mAvg ? round1(mAvg / 10000) : null,
            house: hAvg ? round1(hAvg / 10000) : null,
            landTsubo: lSqm ? round1((lSqm * TSUBO) / 10000) : null,
        });

        districtStatsList.push({
            areaKey: dEntry.code,
            muniCode,
            prefName,
            cityName,
            districtName: dEntry.name,
            stats: dStats,
        });
    }

    districtsList.sort((a, b) => b.count - a.count);

    return {
        muniCode,
        prefCode: muniCode.slice(0, 2),
        prefName,
        cityName,
        txCount: cityBucket.totalCnt,
        mansionAvg: cityStats.types.mansion.avgPrice,
        houseAvg: cityStats.types.house.avgPrice,
        landSqmAvg: cityStats.types.land.avgSqm,
        districtsList,
        cityStats,
        districtStatsList,
    };
}

async function main() {
    const args = process.argv.slice(2);
    const exportAllDistricts = args.includes('--all');
    const prefArg = args.find((a) => a.startsWith('--pref='))?.split('=')[1];

    const outDir = path.resolve(__dirname, '../d1_export');
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(outDir)) {
        if (f.endsWith('.sql')) fs.unlinkSync(path.join(outDir, f));
    }

    // 0. スキーマファイルをコピー
    const schemaPath = path.resolve(__dirname, './d1_schema.sql');
    fs.copyFileSync(schemaPath, path.join(outDir, '00_schema.sql'));
    console.log('[D1 Export] 00_schema.sql generated.');

    const db = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'realestate_db',
        waitForConnections: true,
        connectionLimit: 10,
    });

    const startTime = Date.now();

    try {
        // 1. 既存の ssrCoreData.json があれば全国統計・全自治体リストを高速再利用
        const snapPath = path.resolve(__dirname, '../src/data/ssrCoreData.json');
        const snap = fs.existsSync(snapPath) ? JSON.parse(fs.readFileSync(snapPath, 'utf8')) : null;

        // 2. appraisals_latest (2026年 全国の鑑定評価地点を重複排除して出力)
        console.log('[D1 Export] Exporting appraisals_latest...');
        const [apprRows] = await db.query(`
            SELECT 
                LPAD(MunicipalityCode, 5, '0') AS muniCode,
                Year,
                Address,
                Division,
                ROUND(AVG(OfficialPrice)) AS OfficialPrice,
                ROUND(AVG(FluctuationRate), 2) AS FluctuationRate,
                MAX(Area) AS Area,
                MAX(BuildingCoverageRatio) AS bcr,
                MAX(FloorAreaRatio) AS far,
                ROUND(AVG(CASE WHEN CapRate > 0 THEN CapRate END), 2) AS capRate
            FROM appraisals
            WHERE Year = '2026' AND MunicipalityCode IS NOT NULL
            GROUP BY LPAD(MunicipalityCode, 5, '0'), Year, Address, Division
        `);

        const apprWriter = new ChunkedSqlWriter(outDir, '02_appraisals_latest');
        for (const r of apprRows) {
            const mc = String(r.muniCode).padStart(5, '0');
            const pc = mc.slice(0, 2);
            apprWriter.addStatement(
                `INSERT INTO appraisals_latest (muni_code, pref_code, year, address, division, official_price, fluctuation_rate, area, bcr, far, cap_rate) VALUES (${sqlVal(mc)}, ${sqlVal(pc)}, ${sqlVal(r.Year)}, ${sqlVal(r.Address)}, ${sqlVal(r.Division)}, ${sqlVal(toNum(r.OfficialPrice))}, ${sqlVal(toNum(r.FluctuationRate))}, ${sqlVal(toNum(r.Area))}, ${sqlVal(toNum(r.bcr))}, ${sqlVal(toNum(r.far))}, ${sqlVal(toNum(r.capRate))});`
            );
        }
        apprWriter.flush();
        console.log(`[D1 Export] Exported ${apprRows.length.toLocaleString()} deduplicated appraisal points.`);

        // 3. area_descriptions (市場分析レポート)
        // 対象市区町村の決定を先に行い、都道府県フィルタがある場合は該当都道府県のレポートを出力（--all 時は全国すべて）
        let allMuniList = [];
        if (snap?.prefs) {
            for (const [pCode, pData] of Object.entries(snap.prefs)) {
                for (const c of pData.cities || []) {
                    allMuniList.push({ ...c, prefCode: pCode });
                }
            }
        } else {
            const [mRows] = await db.query(`
                SELECT DISTINCT LPAD(MunicipalityCode, 5, '0') AS MunicipalityCode, MAX(Prefecture) AS prefName
                FROM transactions WHERE MunicipalityCode IS NOT NULL AND MunicipalityCode != ''
                GROUP BY LPAD(MunicipalityCode, 5, '0')
                ORDER BY MunicipalityCode ASC
            `);
            allMuniList = mRows.map((r) => ({
                MunicipalityCode: String(r.MunicipalityCode).padStart(5, '0'),
                prefCode: String(r.MunicipalityCode).padStart(5, '0').slice(0, 2),
                prefName: r.prefName || '',
            }));
        }

        const targetDeepPrefs = prefArg ? [prefArg.padStart(2, '0')] : exportAllDistricts ? null : ['13'];
        const targetPrefNames = targetDeepPrefs
            ? [...new Set(allMuniList.filter((m) => targetDeepPrefs.includes(m.prefCode)).map((m) => m.prefName).filter(Boolean))]
            : null;

        console.log('[D1 Export] Exporting area_descriptions...');
        const [descRows] = targetPrefNames && targetPrefNames.length > 0
            ? await db.query(
                  `SELECT Prefecture, Municipality, DistrictName, Description, CharCount FROM district_descriptions WHERE Prefecture IN (${targetPrefNames.map(() => '?').join(',')})`,
                  targetPrefNames
              )
            : await db.query(`SELECT Prefecture, Municipality, DistrictName, Description, CharCount FROM district_descriptions`);
        const descWriter = new ChunkedSqlWriter(outDir, '03_area_descriptions');
        for (const r of descRows) {
            if (!r.Description) continue;
            const key = `${r.Prefecture}|${r.Municipality}|${r.DistrictName}`;
            descWriter.addStatement(
                `INSERT OR REPLACE INTO area_descriptions (area_key, description, char_count) VALUES (${sqlVal(key)}, ${sqlVal(r.Description)}, ${sqlVal(Number(r.CharCount || r.Description.length))});`
            );
        }
        descWriter.flush();
        console.log(`[D1 Export] Exported ${descRows.length.toLocaleString()} qualitative descriptions.`);

        // 4. cities_master & area_stats
        const citiesWriter = new ChunkedSqlWriter(outDir, '01_cities_master');
        const statsWriter = new ChunkedSqlWriter(outDir, '04_area_stats');

        // 全国トップ ('all') の stats を出力
        if (snap?.nationalStats) {
            statsWriter.addStatement(
                `INSERT OR REPLACE INTO area_stats (area_key, muni_code, pref_name, city_name, district_name, stats_json) VALUES ('all', NULL, '全国', '全国', '', ${sqlVal(JSON.stringify(snap.nationalStats))});`
            );
        }

        console.log(
            `[D1 Export] Processing ${allMuniList.length} municipalities (Deep district stats: ${
                targetDeepPrefs ? `pref ${targetDeepPrefs.join(',')}` : 'ALL 47 prefectures'
            })...`
        );

        // まず東京都以外（または高速対象）の cities_master を出力
        const deepMunis = [];
        for (const c of allMuniList) {
            if (!targetDeepPrefs || targetDeepPrefs.includes(c.prefCode)) {
                deepMunis.push(c.MunicipalityCode);
            } else {
                citiesWriter.addStatement(
                    `INSERT OR REPLACE INTO cities_master (muni_code, pref_code, pref_name, city_name, tx_count, mansion_avg, house_avg, land_sqm_avg, districts_json) VALUES (${sqlVal(c.MunicipalityCode)}, ${sqlVal(c.prefCode)}, ${sqlVal(c.prefName || '')}, ${sqlVal(c.name || '')}, ${sqlVal(c.txCount || 0)}, ${sqlVal(c.mansionAvg)}, ${sqlVal(c.houseAvg)}, ${sqlVal(c.landSqmAvg)}, '[]');`
                );
            }
        }

        // 詳細集計対象の市区町村を6並列で処理
        let processed = 0;
        let totalAreaStatsRows = 1;
        for (let i = 0; i < deepMunis.length; i += 6) {
            const batch = deepMunis.slice(i, i + 6);
            const results = await Promise.all(batch.map((mc) => processMunicipalityInMemory(db, mc)));

            for (const res of results) {
                if (!res) continue;
                processed++;

                citiesWriter.addStatement(
                    `INSERT OR REPLACE INTO cities_master (muni_code, pref_code, pref_name, city_name, tx_count, mansion_avg, house_avg, land_sqm_avg, districts_json) VALUES (${sqlVal(res.muniCode)}, ${sqlVal(res.prefCode)}, ${sqlVal(res.prefName)}, ${sqlVal(res.cityName)}, ${sqlVal(res.txCount)}, ${sqlVal(res.mansionAvg)}, ${sqlVal(res.houseAvg)}, ${sqlVal(res.landSqmAvg)}, ${sqlVal(JSON.stringify(res.districtsList))});`
                );

                // 市区町村の area_stats
                statsWriter.addStatement(
                    `INSERT OR REPLACE INTO area_stats (area_key, muni_code, pref_name, city_name, district_name, stats_json) VALUES (${sqlVal(res.muniCode)}, ${sqlVal(res.muniCode)}, ${sqlVal(res.prefName)}, ${sqlVal(res.cityName)}, '', ${sqlVal(JSON.stringify(res.cityStats))});`
                );
                totalAreaStatsRows++;

                // 配下すべての町字の area_stats
                for (const d of res.districtStatsList) {
                    statsWriter.addStatement(
                        `INSERT OR REPLACE INTO area_stats (area_key, muni_code, pref_name, city_name, district_name, stats_json) VALUES (${sqlVal(d.areaKey)}, ${sqlVal(d.muniCode)}, ${sqlVal(d.prefName)}, ${sqlVal(d.cityName)}, ${sqlVal(d.districtName)}, ${sqlVal(JSON.stringify(d.stats))});`
                    );
                    totalAreaStatsRows++;
                }
            }

            if (processed % 30 === 0 || i + 6 >= deepMunis.length) {
                console.log(`[D1 Export] Progress: ${processed}/${deepMunis.length} municipalities (${totalAreaStatsRows.toLocaleString()} area_stats rows)...`);
            }
        }

        citiesWriter.flush();
        statsWriter.flush();

        const allSqlFiles = fs.readdirSync(outDir).filter((f) => f.endsWith('.sql')).sort();
        let totalSize = 0;
        for (const f of allSqlFiles) {
            totalSize += fs.statSync(path.join(outDir, f)).size;
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
            `\n✅ [D1 Export] Completed in ${elapsed}s! Generated ${allSqlFiles.length} SQL files (${(totalSize / (1024 * 1024)).toFixed(2)} MB total) in ${outDir}`
        );
    } finally {
        await db.end();
    }
}

function toNum(v) {
    return v === null || v === undefined || v === '' ? null : Number(v);
}

main().catch((err) => {
    console.error('[D1 Export] Error:', err);
    process.exit(1);
});
