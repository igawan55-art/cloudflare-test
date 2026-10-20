// scripts/import_all_districts.mjs
import https from 'https';
import fs from 'fs';
import { getDb } from '../src/lib/db.js';

const APP_ID = 'b6e7b14f7f37ba3f4b2b2195565e1c7f1a30f016';

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error(`JSON parse error: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

// 文字列正規化（全角半角、ケ/ヶ、漢数字など）
function normalizeName(str) {
    if (!str) return '';
    return str
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/ヶ/g, 'ケ')
        .replace(/ノ/g, 'の')
        .replace(/\s+/g, '')
        .trim();
}

async function processPrefecture(db, prefInfo) {
    const { prefCode, prefName, popTableId, ageTableId, ownTableId, typeTableId } = prefInfo;
    console.log(`\n========================================`);
    console.log(`[Processing] ${prefName} (Code: ${prefCode})`);
    console.log(`========================================`);

    // 1. e-Statのエリアメタデータ（コード -> エリア名）の取得
    console.log(`[1/5] Fetching area metadata for ${prefName}...`);
    const metaUrl = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${APP_ID}&statsDataId=${popTableId}`;
    const metaRes = await fetchJson(metaUrl);
    const areaClass = metaRes.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ?.find(c => c['@id'] === 'area');
    const estatAreaList = areaClass?.CLASS || [];
    
    // estatAreaMap: code -> { code, name, cleanName, muniCode }
    const estatAreaMap = new Map();
    for (const a of estatAreaList) {
        const code = a['@code'] || '';
        const name = a['@name'] || '';
        const level = a['@level'];
        // level 3 (町丁字レベル) を主に対象とする
        if (level === '3' || (level === '2' && !code.endsWith('0000'))) {
            const muniCode = code.slice(0, 5);
            // 市区町村名を除去した町字名を抽出（例: "多摩市連光寺" -> "連光寺"）
            estatAreaMap.set(code, {
                code,
                rawName: name,
                muniCode
            });
        }
    }
    console.log(`Found ${estatAreaMap.size} district areas in e-Stat metadata.`);

    // 2. データベース（transactions）に存在する当都道府県の町字一覧を取得
    console.log(`[2/5] Loading site districts from database...`);
    const [dbDistricts] = await db.query(`
        SELECT DISTINCT MunicipalityCode, DistrictCode, Prefecture, Municipality, DistrictName 
        FROM transactions 
        WHERE MunicipalityCode LIKE CONCAT(?, '%')
          AND DistrictCode IS NOT NULL AND DistrictCode != '0' AND DistrictCode != ''
          AND DistrictName IS NOT NULL AND DistrictName != '-'
    `, [prefCode]);
    console.log(`Found ${dbDistricts.length} active districts in site database for ${prefName}.`);

    if (dbDistricts.length === 0) {
        console.log(`No active districts in database for ${prefName}. Skipping.`);
        return;
    }

    // 3. 4つの統計表からデータを一括取得 (lvArea=3&limit=100000)
    console.log(`[3/5] Bulk fetching statistics tables (4 tables)...`);
    const fetchTable = async (tId) => {
        if (!tId) return [];
        const u = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${APP_ID}&statsDataId=${tId}&lvArea=3&limit=100000`;
        const r = await fetchJson(u);
        return r.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    };

    const [popValues, ageValues, ownValues, typeValues] = await Promise.all([
        fetchTable(popTableId),
        fetchTable(ageTableId),
        fetchTable(ownTableId),
        fetchTable(typeTableId)
    ]);

    console.log(`Fetched values: Pop=${popValues.length}, Age=${ageValues.length}, Own=${ownValues.length}, Type=${typeValues.length}`);

    // 4. estatAreaCode ごとに集計
    console.log(`[4/5] Aggregating census values...`);
    const statsMap = new Map();
    const getOrCreate = (areaCode) => {
        if (!statsMap.has(areaCode)) {
            statsMap.set(areaCode, {
                totalPop: 0, malePop: 0, femalePop: 0, totalHouseholds: 0,
                under15: 0, working15to64: 0, over65: 0,
                ownedHouseholds: 0, rentedHouseholds: 0,
                detachedHouseholds: 0, apartmentHouseholds: 0
            });
        }
        return statsMap.get(areaCode);
    };

    for (const v of popValues) {
        const item = getOrCreate(v['@area']);
        const val = Number(v['$']) || 0;
        if (v['@cat01'] === '0010') item.totalPop = val;
        if (v['@cat01'] === '0020') item.malePop = val;
        if (v['@cat01'] === '0030') item.femalePop = val;
        if (v['@cat01'] === '0040') item.totalHouseholds = val;
    }

    for (const v of ageValues) {
        const item = getOrCreate(v['@area']);
        const val = Number(v['$']) || 0;
        if (v['@cat01'] === '0170') item.under15 = val;
        if (v['@cat01'] === '0180') item.working15to64 = val;
        if (v['@cat01'] === '0190') item.over65 = val;
    }

    for (const v of ownValues) {
        const item = getOrCreate(v['@area']);
        const val = Number(v['$']) || 0;
        if (v['@cat01'] === '0020') item.ownedHouseholds = val;
        if (v['@cat01'] === '0030') item.rentedHouseholds = val;
    }

    for (const v of typeValues) {
        const item = getOrCreate(v['@area']);
        const val = Number(v['$']) || 0;
        if (v['@cat01'] === '0020') item.detachedHouseholds = val;
        if (v['@cat01'] === '0040') item.apartmentHouseholds = val;
    }

    // 5. DBの町字（DistrictName）とe-Statエリア（rawName）をマッチングして保存
    console.log(`[5/5] Matching and saving to estat_census_district...`);
    const insertSql = `
        INSERT INTO estat_census_district (
            MunicipalityCode, DistrictCode, Prefecture, Municipality, DistrictName, EstatAreaCode,
            TotalPopulation, MalePopulation, FemalePopulation, TotalHouseholds, AvgHouseholdSize,
            PopulationUnder15, Population15To64, PopulationOver65, ChildRate, WorkingRate, AgingRate,
            OwnedHouseholds, RentedHouseholds, OwnedRate,
            DetachedHouseholds, ApartmentHouseholds, DetachedRate,
            UpdatedAt
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            NOW()
        )
        ON DUPLICATE KEY UPDATE
            Prefecture = VALUES(Prefecture),
            Municipality = VALUES(Municipality),
            DistrictName = VALUES(DistrictName),
            EstatAreaCode = VALUES(EstatAreaCode),
            TotalPopulation = VALUES(TotalPopulation),
            MalePopulation = VALUES(MalePopulation),
            FemalePopulation = VALUES(FemalePopulation),
            TotalHouseholds = VALUES(TotalHouseholds),
            AvgHouseholdSize = VALUES(AvgHouseholdSize),
            PopulationUnder15 = VALUES(PopulationUnder15),
            Population15To64 = VALUES(Population15To64),
            PopulationOver65 = VALUES(PopulationOver65),
            ChildRate = VALUES(ChildRate),
            WorkingRate = VALUES(WorkingRate),
            AgingRate = VALUES(AgingRate),
            OwnedHouseholds = VALUES(OwnedHouseholds),
            RentedHouseholds = VALUES(RentedHouseholds),
            OwnedRate = VALUES(OwnedRate),
            DetachedHouseholds = VALUES(DetachedHouseholds),
            ApartmentHouseholds = VALUES(ApartmentHouseholds),
            DetachedRate = VALUES(DetachedRate),
            UpdatedAt = NOW()
    `;

    // 自治体コードごとにe-Statエリアをグループ化
    const estatByMuni = new Map();
    for (const [code, info] of estatAreaMap.entries()) {
        if (!estatByMuni.has(info.muniCode)) {
            estatByMuni.set(info.muniCode, []);
        }
        estatByMuni.get(info.muniCode).push(info);
    }

    let matchCount = 0;
    for (const dist of dbDistricts) {
        const muniCode = String(dist.MunicipalityCode).padStart(5, '0');
        const distCode = String(dist.DistrictCode).padStart(9, '0');
        const dName = normalizeName(dist.DistrictName);
        const city = normalizeName(dist.Municipality);

        const candidates = estatByMuni.get(muniCode) || [];
        // マッチング候補を探す（町字名が後方に含まれるか一致するもの）
        let matched = candidates.find(c => {
            const raw = normalizeName(c.rawName);
            return raw === dName || raw === `${city}${dName}` || raw.endsWith(dName);
        });

        if (!matched) continue;

        const stat = statsMap.get(matched.code);
        if (!stat) continue;

        const avgSize = stat.totalHouseholds > 0 && stat.totalPop > 0 
            ? Number((stat.totalPop / stat.totalHouseholds).toFixed(2)) 
            : null;
        
        const childRate = stat.totalPop > 0 ? Number(((stat.under15 / stat.totalPop) * 100).toFixed(2)) : null;
        const workingRate = stat.totalPop > 0 ? Number(((stat.working15to64 / stat.totalPop) * 100).toFixed(2)) : null;
        const agingRate = stat.totalPop > 0 ? Number(((stat.over65 / stat.totalPop) * 100).toFixed(2)) : null;

        const totalHousing = stat.ownedHouseholds + stat.rentedHouseholds;
        const ownedRate = totalHousing > 0 ? Number(((stat.ownedHouseholds / totalHousing) * 100).toFixed(2)) : null;

        const totalBuilt = stat.detachedHouseholds + stat.apartmentHouseholds;
        const detachedRate = totalBuilt > 0 ? Number(((stat.detachedHouseholds / totalBuilt) * 100).toFixed(2)) : null;

        await db.query(insertSql, [
            muniCode, distCode, dist.Prefecture, dist.Municipality, dist.DistrictName, matched.code,
            stat.totalPop, stat.malePop, stat.femalePop, stat.totalHouseholds, avgSize,
            stat.under15, stat.working15to64, stat.over65, childRate, workingRate, agingRate,
            stat.ownedHouseholds, stat.rentedHouseholds, ownedRate,
            stat.detachedHouseholds, stat.apartmentHouseholds, detachedRate
        ]);

        matchCount++;
    }

    console.log(`✓ [${prefName}] Successfully matched and saved ${matchCount} districts!`);
}

async function main() {
    const db = getDb();
    const prefMap = JSON.parse(fs.readFileSync('./scripts/pref_table_map.json', 'utf-8'));

    // 引数で指定された都道府県コード（例: node import_all_districts.mjs 13）、未指定なら全47都道府県
    const targetArg = process.argv[2];
    const targetCodes = targetArg 
        ? [targetArg.padStart(2, '0')]
        : Object.keys(prefMap).sort();

    console.log(`Starting district census batch import for ${targetCodes.length} prefectures...`);

    for (let i = 0; i < targetCodes.length; i++) {
        const code = targetCodes[i];
        const prefInfo = prefMap[code];
        if (!prefInfo) continue;

        try {
            await processPrefecture(db, prefInfo);
            // 都道府県間のウェイト (1秒)
            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.error(`Error processing ${prefInfo.prefName}:`, err);
        }
    }

    console.log('\nAll targeted prefectures processed successfully!');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal batch error:', err);
    process.exit(1);
});
