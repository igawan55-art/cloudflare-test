// scripts/generateSsrSnapshot.js
// ローカルMySQL (realestate_db) から Cloudflare SSR (無料プラン) 用の軽量エッジデータスナップショットを生成するスクリプト

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { getAreaStats, getCityDistrictSummaries } from '../src/lib/areaStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const round1 = (v) => (v == null || !isFinite(v) ? null : Math.round(Number(v) * 10) / 10);
const roundInt = (v) => (v == null || !isFinite(v) ? null : Math.round(Number(v)));
const nfkc = (s) => (s ? String(s).normalize('NFKC') : '');
const periodLabel = (p) => {
    const m = /(\d{4})年第(\d)四半期/.exec(p || '');
    return m ? `${m[1]} Q${m[2]}` : (p || '-');
};

const TYPE_MAP = {
    mansion: '中古マンション等',
    house: '宅地(土地と建物)',
    land: '宅地(土地)',
};
const TYPE_KEYS = Object.fromEntries(Object.entries(TYPE_MAP).map(([k, v]) => [v, k]));

function trimStats(statsObj, maxRows = 20, maxQuarters = 36) {
    const out = { types: {} };
    for (const [k, t] of Object.entries(statsObj.types)) {
        out.types[k] = {
            count: t.count,
            avgPrice: roundInt(t.avgPrice),
            avgSqm: roundInt(t.avgSqm),
            avgArea: round1(t.avgArea),
            quarters: (t.quarters || []).slice(-maxQuarters).map((q) => ({
                label: q.label,
                count: q.count,
                avgPrice: roundInt(q.avgPrice),
                avgSqm: roundInt(q.avgSqm),
            })),
            rows: (t.rows || []).slice(0, maxRows),
        };
    }
    if (statsObj.meta) out.meta = statsObj.meta;
    return out;
}

async function main() {
    console.log('[SSR Snapshot] Connecting to local MySQL...');
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
        // 1. 全国変動率 & 全国四半期・全体集計（単一クエリで高速集計）
        console.log('[SSR Snapshot] 1/5 Fetching national stats...');
        const [[flucRows], [qRows]] = await Promise.all([
            db.query(`SELECT AVG(FluctuationRate) AS f FROM appraisals WHERE FluctuationRate IS NOT NULL`),
            db.query(`
                SELECT Type, Period,
                    COUNT(*) AS cnt,
                    SUM(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) ELSE 0 END) AS priceSum,
                    SUM(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 THEN 1 ELSE 0 END) AS priceCnt,
                    SUM(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 AND CAST(Area AS DECIMAL(12,2)) > 0
                             THEN CAST(TradePrice AS UNSIGNED) / CAST(Area AS DECIMAL(12,2)) ELSE 0 END) AS sqmSum,
                    SUM(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 AND CAST(Area AS DECIMAL(12,2)) > 0 THEN 1 ELSE 0 END) AS sqmCnt,
                    SUM(CASE WHEN CAST(Area AS DECIMAL(12,2)) > 0 THEN CAST(Area AS DECIMAL(12,2)) ELSE 0 END) AS areaSum,
                    SUM(CASE WHEN CAST(Area AS DECIMAL(12,2)) > 0 THEN 1 ELSE 0 END) AS areaCnt
                FROM transactions IGNORE INDEX (idx_type, idx_period)
                WHERE Type IN ('中古マンション等', '宅地(土地と建物)', '宅地(土地)')
                GROUP BY Type, Period
                ORDER BY Period ASC
            `),
        ]);
        const nationalFluctuation = flucRows[0]?.f != null ? round1(flucRows[0].f) : null;

        const natTypes = {};
        const natTotals = {};
        for (const key of Object.keys(TYPE_MAP)) {
            natTypes[key] = { count: 0, avgPrice: null, avgSqm: null, avgArea: null, quarters: [], rows: [] };
            natTotals[key] = { cnt: 0, priceSum: 0, priceCnt: 0, sqmSum: 0, sqmCnt: 0, areaSum: 0, areaCnt: 0 };
        }

        for (const r of qRows) {
            const key = TYPE_KEYS[r.Type];
            if (!key) continue;
            const tot = natTotals[key];
            const cnt = Number(r.cnt || 0);
            const pSum = Number(r.priceSum || 0);
            const pCnt = Number(r.priceCnt || 0);
            const sSum = Number(r.sqmSum || 0);
            const sCnt = Number(r.sqmCnt || 0);
            const aSum = Number(r.areaSum || 0);
            const aCnt = Number(r.areaCnt || 0);

            tot.cnt += cnt;
            tot.priceSum += pSum;
            tot.priceCnt += pCnt;
            tot.sqmSum += sSum;
            tot.sqmCnt += sCnt;
            tot.areaSum += aSum;
            tot.areaCnt += aCnt;

            if (r.Period) {
                natTypes[key].quarters.push({
                    label: periodLabel(r.Period),
                    count: cnt,
                    avgPrice: pCnt > 0 ? roundInt(pSum / pCnt) : null,
                    avgSqm: sCnt > 0 ? roundInt(sSum / sCnt) : null,
                });
            }
        }

        for (const [key, typeName] of Object.entries(TYPE_MAP)) {
            const tot = natTotals[key];
            natTypes[key].count = tot.cnt;
            natTypes[key].avgPrice = tot.priceCnt > 0 ? roundInt(tot.priceSum / tot.priceCnt) : null;
            natTypes[key].avgSqm = tot.sqmCnt > 0 ? roundInt(tot.sqmSum / tot.sqmCnt) : null;
            natTypes[key].avgArea = tot.areaCnt > 0 ? round1(tot.areaSum / tot.areaCnt) : null;
            natTypes[key].quarters = natTypes[key].quarters.slice(-40);

            // 最新期の取引事例30件（idx_period を活用）
            const [recentRows] = await db.query(`
                SELECT Prefecture, Municipality, MunicipalityCode, DistrictName, DistrictCode, Period,
                       TradePrice, Area, TotalFloorArea, BuildingYear, Structure, FloorPlan
                FROM transactions USE INDEX (idx_period)
                WHERE Period = '2025年第3四半期' AND Type = ?
                ORDER BY id DESC
                LIMIT 30
            `, [typeName]);

            natTypes[key].rows = recentRows.map((r) => {
                const price = parseInt(r.TradePrice, 10) || 0;
                const area = parseFloat(r.Area) || null;
                const by = parseInt(r.BuildingYear, 10);
                return {
                    p: periodLabel(r.Period),
                    pf: r.Prefecture,
                    mu: r.Municipality,
                    mc: String(r.MunicipalityCode || '').padStart(5, '0'),
                    d: r.DistrictName && r.DistrictName !== '-' ? r.DistrictName : '',
                    dc: r.DistrictCode && r.DistrictCode !== '0' ? String(r.DistrictCode).padStart(9, '0') : '',
                    pr: price,
                    a: area,
                    fa: parseFloat(r.TotalFloorArea) || null,
                    by: Number.isFinite(by) ? by : null,
                    st: nfkc(r.Structure),
                    fp: nfkc(r.FloorPlan),
                };
            });
        }

        const nationalStats = { types: natTypes };

        // 2. 全47都道府県の市区町村一覧 & 鑑定評価サマリー
        console.log('[SSR Snapshot] 2/5 Fetching all 47 prefectures & 1,892 municipalities...');
        const [allCitiesRows] = await db.query(`
            SELECT 
                LPAD(MunicipalityCode, 5, '0') AS code,
                MAX(Prefecture) AS prefName,
                MAX(Municipality) AS name,
                COUNT(*) AS txCount,
                AVG(CASE WHEN Type = '中古マンション等' AND CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) END) AS mansionAvg,
                AVG(CASE WHEN Type = '宅地(土地と建物)' AND CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) END) AS houseAvg,
                AVG(CASE WHEN Type = '宅地(土地)' AND CAST(TradePrice AS UNSIGNED) > 0 AND CAST(Area AS DECIMAL(12,2)) > 0
                         THEN CAST(TradePrice AS UNSIGNED) / CAST(Area AS DECIMAL(12,2)) END) AS landSqmAvg
            FROM transactions IGNORE INDEX (idx_type, idx_period, idx_municipality, idx_muni_dist)
            WHERE MunicipalityCode IS NOT NULL AND MunicipalityCode != ''
            GROUP BY LPAD(MunicipalityCode, 5, '0')
            ORDER BY txCount DESC
        `);

        const prefs = {};
        for (let i = 1; i <= 47; i++) {
            const prefCode = String(i).padStart(2, '0');
            prefs[prefCode] = {
                cities: [],
                apprSummary: [],
                maxPoint: null,
                minPoint: null,
                topAppraisals: [],
            };
        }

        for (const r of allCitiesRows) {
            const code = String(r.code).padStart(5, '0');
            const prefCode = code.slice(0, 2);
            if (!prefs[prefCode]) continue;
            prefs[prefCode].cities.push({
                MunicipalityCode: code,
                prefName: r.prefName || '',
                name: r.name || '',
                txCount: Number(r.txCount || 0),
                mansionAvg: roundInt(r.mansionAvg),
                houseAvg: roundInt(r.houseAvg),
                landSqmAvg: roundInt(r.landSqmAvg),
            });
        }

        for (let i = 1; i <= 47; i++) {
            const prefCode = String(i).padStart(2, '0');
            const likePat = `${prefCode}___`;
            const [[apprSummary], [topRows], [minRows]] = await Promise.all([
                db.query(`
                    SELECT Division, COUNT(*) AS cnt, AVG(OfficialPrice) AS avgOfficial, AVG(FluctuationRate) AS avgFluctuation
                    FROM appraisals
                    WHERE Year = '2026' AND MunicipalityCode LIKE ?
                    GROUP BY Division WITH ROLLUP
                `, [likePat]),
                db.query(`
                    SELECT Address, OfficialPrice, FluctuationRate, Division
                    FROM appraisals
                    WHERE Year = '2026' AND MunicipalityCode LIKE ?
                    ORDER BY OfficialPrice DESC LIMIT 15
                `, [likePat]),
                db.query(`
                    SELECT Address, OfficialPrice, FluctuationRate, Division
                    FROM appraisals
                    WHERE Year = '2026' AND MunicipalityCode LIKE ? AND OfficialPrice > 0
                    ORDER BY OfficialPrice ASC LIMIT 1
                `, [likePat]),
            ]);

            prefs[prefCode].apprSummary = apprSummary.map((a) => ({
                Division: a.Division,
                cnt: Number(a.cnt),
                avgOfficial: roundInt(a.avgOfficial),
                avgFluctuation: round1(a.avgFluctuation),
            }));
            prefs[prefCode].topAppraisals = topRows.map((t) => ({
                Address: t.Address,
                OfficialPrice: roundInt(t.OfficialPrice),
                FluctuationRate: round1(t.FluctuationRate),
                Division: t.Division,
            }));
            prefs[prefCode].maxPoint = prefs[prefCode].topAppraisals[0] || null;
            prefs[prefCode].minPoint = minRows[0]
                ? {
                      Address: minRows[0].Address,
                      OfficialPrice: roundInt(minRows[0].OfficialPrice),
                      FluctuationRate: round1(minRows[0].FluctuationRate),
                      Division: minRows[0].Division,
                  }
                : null;
        }

        // 3. 東京都の全59市区町村の詳細データ（8並列で高速取得）
        console.log('[SSR Snapshot] 3/5 Fetching all Tokyo municipalities (59 cities)...');
        const tokyoCityCodes = (prefs['13']?.cities || []).map((c) => c.MunicipalityCode);
        const tokyoCities = {};

        for (let i = 0; i < tokyoCityCodes.length; i += 6) {
            const batch = tokyoCityCodes.slice(i, i + 6);
            await Promise.all(
                batch.map(async (muniCode) => {
                    const [distInfo, [apprRows], [qRowsMuni], [recentMuniRows]] = await Promise.all([
                        getCityDistrictSummaries(db, muniCode),
                        db.query(
                            `SELECT Year, Address, Division, OfficialPrice, FluctuationRate, Area, BuildingCoverageRatio, FloorAreaRatio, CapRate
                             FROM appraisals
                             WHERE MunicipalityCode = ? AND Year = '2026'`,
                            [muniCode]
                        ),
                        db.query(`
                            SELECT Type, Period,
                                COUNT(*) AS cnt,
                                SUM(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) ELSE 0 END) AS priceSum,
                                SUM(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 THEN 1 ELSE 0 END) AS priceCnt,
                                SUM(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 AND CAST(Area AS DECIMAL(12,2)) > 0
                                         THEN CAST(TradePrice AS UNSIGNED) / CAST(Area AS DECIMAL(12,2)) ELSE 0 END) AS sqmSum,
                                SUM(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 AND CAST(Area AS DECIMAL(12,2)) > 0 THEN 1 ELSE 0 END) AS sqmCnt,
                                SUM(CASE WHEN CAST(Area AS DECIMAL(12,2)) > 0 THEN CAST(Area AS DECIMAL(12,2)) ELSE 0 END) AS areaSum,
                                SUM(CASE WHEN CAST(Area AS DECIMAL(12,2)) > 0 THEN 1 ELSE 0 END) AS areaCnt
                            FROM transactions USE INDEX (idx_municipality)
                            WHERE MunicipalityCode = ? AND Type IN ('中古マンション等', '宅地(土地と建物)', '宅地(土地)')
                            GROUP BY Type, Period
                            ORDER BY Period ASC
                        `, [muniCode]),
                        db.query(`
                            SELECT Type, Prefecture, Municipality, MunicipalityCode, DistrictName, DistrictCode, Period,
                                   TradePrice, Area, TotalFloorArea, BuildingYear, Structure, FloorPlan
                            FROM transactions USE INDEX (idx_municipality)
                            WHERE MunicipalityCode = ? AND Period >= '2024年第1四半期'
                              AND Type IN ('中古マンション等', '宅地(土地と建物)', '宅地(土地)')
                            ORDER BY Period DESC, id DESC
                            LIMIT 120
                        `, [muniCode]),
                    ]);

                    const mTypes = {};
                    const mTotals = {};
                    for (const key of Object.keys(TYPE_MAP)) {
                        mTypes[key] = { count: 0, avgPrice: null, avgSqm: null, avgArea: null, quarters: [], rows: [] };
                        mTotals[key] = { cnt: 0, priceSum: 0, priceCnt: 0, sqmSum: 0, sqmCnt: 0, areaSum: 0, areaCnt: 0 };
                    }

                    for (const r of qRowsMuni) {
                        const key = TYPE_KEYS[r.Type];
                        if (!key) continue;
                        const tot = mTotals[key];
                        const cnt = Number(r.cnt || 0);
                        const pSum = Number(r.priceSum || 0);
                        const pCnt = Number(r.priceCnt || 0);
                        const sSum = Number(r.sqmSum || 0);
                        const sCnt = Number(r.sqmCnt || 0);
                        const aSum = Number(r.areaSum || 0);
                        const aCnt = Number(r.areaCnt || 0);

                        tot.cnt += cnt;
                        tot.priceSum += pSum;
                        tot.priceCnt += pCnt;
                        tot.sqmSum += sSum;
                        tot.sqmCnt += sCnt;
                        tot.areaSum += aSum;
                        tot.areaCnt += aCnt;

                        if (r.Period) {
                            mTypes[key].quarters.push({
                                label: periodLabel(r.Period),
                                count: cnt,
                                avgPrice: pCnt > 0 ? roundInt(pSum / pCnt) : null,
                                avgSqm: sCnt > 0 ? roundInt(sSum / sCnt) : null,
                            });
                        }
                    }

                    for (const key of Object.keys(TYPE_MAP)) {
                        const tot = mTotals[key];
                        mTypes[key].count = tot.cnt;
                        mTypes[key].avgPrice = tot.priceCnt > 0 ? roundInt(tot.priceSum / tot.priceCnt) : null;
                        mTypes[key].avgSqm = tot.sqmCnt > 0 ? roundInt(tot.sqmSum / tot.sqmCnt) : null;
                        mTypes[key].avgArea = tot.areaCnt > 0 ? round1(tot.areaSum / tot.areaCnt) : null;
                        mTypes[key].quarters = mTypes[key].quarters.slice(-24);
                    }

                    for (const r of recentMuniRows) {
                        const key = TYPE_KEYS[r.Type];
                        if (!key || mTypes[key].rows.length >= 12) continue;
                        const price = parseInt(r.TradePrice, 10) || 0;
                        const area = parseFloat(r.Area) || null;
                        const by = parseInt(r.BuildingYear, 10);
                        mTypes[key].rows.push({
                            p: periodLabel(r.Period),
                            pf: r.Prefecture,
                            mu: r.Municipality,
                            mc: String(r.MunicipalityCode || '').padStart(5, '0'),
                            d: r.DistrictName && r.DistrictName !== '-' ? r.DistrictName : '',
                            dc: r.DistrictCode && r.DistrictCode !== '0' ? String(r.DistrictCode).padStart(9, '0') : '',
                            pr: price,
                            a: area,
                            fa: parseFloat(r.TotalFloorArea) || null,
                            by: Number.isFinite(by) ? by : null,
                            st: nfkc(r.Structure),
                            fp: nfkc(r.FloorPlan),
                        });
                    }

                    tokyoCities[muniCode] = {
                        pref: distInfo.pref,
                        city: distInfo.city,
                        districts: distInfo.districts.map((d) => ({
                            code: d.code,
                            name: d.name,
                            count: d.count,
                            mansion: round1(d.mansion),
                            house: round1(d.house),
                            landTsubo: round1(d.landTsubo),
                        })),
                        stats: { types: mTypes },
                        apprRows: apprRows.map((r) => ({
                            Year: r.Year,
                            Address: r.Address,
                            Division: r.Division,
                            OfficialPrice: roundInt(r.OfficialPrice),
                            FluctuationRate: round1(r.FluctuationRate),
                            Area: round1(r.Area),
                            BuildingCoverageRatio: round1(r.BuildingCoverageRatio),
                            FloorAreaRatio: round1(r.FloorAreaRatio),
                            CapRate: round1(r.CapRate),
                        })),
                    };
                })
            );
        }

        // 4. 東京都の全町字（1,618地区）の種別ごと集計 & 多摩市(13224)の全町字詳細データ
        console.log('[SSR Snapshot] 4/5 Fetching all Tokyo districts (1,618 districts)...');
        const [tokyoDistAggRows] = await db.query(`
            SELECT 
                MunicipalityCode,
                LPAD(DistrictCode, 9, '0') AS distCode,
                MAX(DistrictName) AS distName,
                Type,
                COUNT(*) AS cnt,
                AVG(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) END) AS avgPrice,
                AVG(CASE WHEN CAST(TradePrice AS UNSIGNED) > 0 AND CAST(Area AS DECIMAL(12,2)) > 0
                         THEN CAST(TradePrice AS UNSIGNED) / CAST(Area AS DECIMAL(12,2)) END) AS avgSqm,
                AVG(CASE WHEN CAST(Area AS DECIMAL(12,2)) > 0 THEN CAST(Area AS DECIMAL(12,2)) END) AS avgArea
            FROM transactions USE INDEX (idx_municipality)
            WHERE MunicipalityCode LIKE '13___'
              AND DistrictName IS NOT NULL AND DistrictName != '-'
              AND DistrictCode IS NOT NULL AND DistrictCode != '0'
              AND Type IN ('中古マンション等', '宅地(土地と建物)', '宅地(土地)')
            GROUP BY MunicipalityCode, LPAD(DistrictCode, 9, '0'), Type
        `);

        const tokyoDistricts = {};
        for (const r of tokyoDistAggRows) {
            const key = `${r.MunicipalityCode}|${r.distCode}`;
            if (!tokyoDistricts[key]) {
                tokyoDistricts[key] = {
                    name: r.distName,
                    mansion: [0, null, null, null],
                    house: [0, null, null, null],
                    land: [0, null, null, null],
                };
            }
            const tKey = TYPE_KEYS[r.Type];
            if (tKey) {
                tokyoDistricts[key][tKey] = [
                    Number(r.cnt),
                    roundInt(r.avgPrice),
                    roundInt(r.avgSqm),
                    round1(r.avgArea),
                ];
            }
        }

        const detailedDistCities = ['13224'];
        const detailedDistricts = {};
        for (const cCode of detailedDistCities) {
            const distList = tokyoCities[cCode]?.districts || [];
            for (const d of distList) {
                const dStats = await getAreaStats(db, { municipalityCode: cCode, districtCode: d.code, rowLimit: 20 });
                detailedDistricts[`${cCode}|${d.code}`] = trimStats(dStats, 20, 32);
            }
        }

        // 5. 東京都内の定性市場分析レポート (district_descriptions)
        console.log('[SSR Snapshot] 5/5 Fetching qualitative district descriptions...');
        const [descRows] = await db.query(
            `SELECT Prefecture, Municipality, DistrictName, Description, CharCount
             FROM district_descriptions
             WHERE Prefecture = '東京都'`
        );
        const descriptions = {};
        for (const r of descRows) {
            if (r.Description) {
                descriptions[`${r.Prefecture}|${r.Municipality}|${r.DistrictName}`] = {
                    text: r.Description,
                    charCount: Number(r.CharCount || r.Description.length),
                };
            }
        }

        const snapshot = {
            generatedAt: new Date().toISOString(),
            nationalFluctuation,
            nationalStats,
            prefs,
            tokyoCities,
            tokyoDistricts,
            detailedDistricts,
            descriptions,
        };

        const outPath = path.resolve(__dirname, '../src/data/ssrCoreData.json');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        const jsonStr = JSON.stringify(snapshot);
        fs.writeFileSync(outPath, jsonStr, 'utf8');

        const sizeMb = (Buffer.byteLength(jsonStr, 'utf8') / (1024 * 1024)).toFixed(2);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[SSR Snapshot] Done in ${elapsed}s! Saved to ${outPath} (${sizeMb} MB)`);
    } finally {
        await db.end();
    }
}

main().catch((err) => {
    console.error('[SSR Snapshot] Error:', err);
    process.exit(1);
});
