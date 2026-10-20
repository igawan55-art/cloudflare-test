// scripts/import_all_municipalities.mjs
import https from 'https';
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

// 1. 年齢3区分人口
async function fetchAgeStats(muniCode) {
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${APP_ID}&statsDataId=0003448299&cdArea=${muniCode}`;
    const json = await fetchJson(url);
    if (json.GET_STATS_DATA?.RESULT?.STATUS !== 0) return null;

    const values = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    const stats = {};
    for (const v of values) {
        const cat1 = v['@cat01'];
        const cat2 = v['@cat02'];
        const unit = v['@unit'];
        const val = Number(v['$']);

        if (unit === '人') {
            if (cat1 === '100') {
                if (cat2 === '100') stats.totalPop = val;
                if (cat2 === '110') stats.malePop = val;
                if (cat2 === '120') stats.femalePop = val;
            } else if (cat1 === '110' && cat2 === '100') {
                stats.under15 = val;
            } else if (cat1 === '120' && cat2 === '100') {
                stats.working15to64 = val;
            } else if (cat1 === '130' && cat2 === '100') {
                stats.over65 = val;
            }
        } else if (unit === '%') {
            if (cat1 === '110' && cat2 === '100') stats.childRate = val;
            if (cat1 === '120' && cat2 === '100') stats.workingRate = val;
            if (cat1 === '130' && cat2 === '100') stats.agingRate = val;
        }
    }
    return stats;
}

// 2. 世帯数・世帯人員
async function fetchHouseholdStats(muniCode) {
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${APP_ID}&statsDataId=0003445098&cdArea=${muniCode}`;
    const json = await fetchJson(url);
    if (json.GET_STATS_DATA?.RESULT?.STATUS !== 0) return null;

    const values = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    const stats = {};
    for (const v of values) {
        const tab = v['@tab'];
        const cat1 = v['@cat01'];
        const val = Number(v['$']);

        if (cat1 === '1') {
            if (tab === '2020_13') stats.households = val;
            if (tab === '2020_22') stats.members = val;
        }
    }
    if (stats.households && stats.members) {
        stats.avgSize = Number((stats.members / stats.households).toFixed(2));
    }
    return stats;
}

// 3. 住宅の所有関係
async function fetchHousingStats(muniCode) {
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${APP_ID}&statsDataId=0003445123&cdArea=${muniCode}`;
    const json = await fetchJson(url);
    if (json.GET_STATS_DATA?.RESULT?.STATUS !== 0) return null;

    const values = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    const stats = {};
    for (const v of values) {
        const cat1 = v['@cat01'];
        const val = Number(v['$']);

        if (cat1 === '111') stats.owned = val;
        if (cat1 === '112') stats.publicRented = val;
        if (cat1 === '113') stats.privateRented = val;
    }
    stats.totalRented = (stats.publicRented || 0) + (stats.privateRented || 0);
    return stats;
}

async function main() {
    const db = getDb();

    // 未取り込みの市区町村を抽出（レジューム可能）
    const [targets] = await db.query(`
        SELECT DISTINCT t.MunicipalityCode, t.Prefecture, t.Municipality 
        FROM transactions t
        LEFT JOIN estat_census c ON t.MunicipalityCode COLLATE utf8mb4_unicode_ci = c.MunicipalityCode COLLATE utf8mb4_unicode_ci
        WHERE c.MunicipalityCode IS NULL
          AND t.MunicipalityCode IS NOT NULL 
          AND t.MunicipalityCode != ''
        ORDER BY t.MunicipalityCode
    `);

    console.log(`[Start] Remaining municipalities to import: ${targets.length}`);
    if (targets.length === 0) {
        console.log('All municipalities already imported!');
        process.exit(0);
    }

    const insertSql = `
        INSERT INTO estat_census (
            MunicipalityCode, Prefecture, Municipality,
            TotalPopulation, MalePopulation, FemalePopulation,
            PopulationUnder15, Population15To64, PopulationOver65,
            ChildRate, WorkingRate, AgingRate,
            TotalHouseholds, HouseholdMembers, AvgHouseholdSize,
            OwnedHouseholds, RentedHouseholds, PublicRentedHouseholds, PrivateRentedHouseholds,
            OwnedRate, UpdatedAt
        ) VALUES (
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, NOW()
        )
        ON DUPLICATE KEY UPDATE
            Prefecture = VALUES(Prefecture),
            Municipality = VALUES(Municipality),
            TotalPopulation = VALUES(TotalPopulation),
            MalePopulation = VALUES(MalePopulation),
            FemalePopulation = VALUES(FemalePopulation),
            PopulationUnder15 = VALUES(PopulationUnder15),
            Population15To64 = VALUES(Population15To64),
            PopulationOver65 = VALUES(PopulationOver65),
            ChildRate = VALUES(ChildRate),
            WorkingRate = VALUES(WorkingRate),
            AgingRate = VALUES(AgingRate),
            TotalHouseholds = VALUES(TotalHouseholds),
            HouseholdMembers = VALUES(HouseholdMembers),
            AvgHouseholdSize = VALUES(AvgHouseholdSize),
            OwnedHouseholds = VALUES(OwnedHouseholds),
            RentedHouseholds = VALUES(RentedHouseholds),
            PublicRentedHouseholds = VALUES(PublicRentedHouseholds),
            PrivateRentedHouseholds = VALUES(PrivateRentedHouseholds),
            OwnedRate = VALUES(OwnedRate),
            UpdatedAt = NOW()
    `;

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        const { MunicipalityCode: muniCode, Prefecture: pref, Municipality: city } = item;

        try {
            const [age, hh, housing] = await Promise.all([
                fetchAgeStats(muniCode),
                fetchHouseholdStats(muniCode),
                fetchHousingStats(muniCode)
            ]);

            if (!age && !hh) {
                skipCount++;
                // 郡部や合併前の旧コードなど該当なしの場合は空レコードまたはスキップ
                continue;
            }

            const totalHouseholds = hh?.households || 0;
            const owned = housing?.owned || 0;
            const ownedRate = totalHouseholds > 0 ? Number(((owned / totalHouseholds) * 100).toFixed(2)) : null;

            await db.query(insertSql, [
                muniCode, pref, city,
                age?.totalPop || 0, age?.malePop || 0, age?.femalePop || 0,
                age?.under15 || 0, age?.working15to64 || 0, age?.over65 || 0,
                age?.childRate ?? null, age?.workingRate ?? null, age?.agingRate ?? null,
                totalHouseholds, hh?.members || 0, hh?.avgSize || null,
                owned, housing?.totalRented || 0, housing?.publicRented || 0, housing?.privateRented || 0,
                ownedRate
            ]);

            successCount++;
            if (successCount % 10 === 0 || i === targets.length - 1) {
                console.log(`[Progress ${i + 1}/${targets.length}] Saved: ${pref} ${city} (${muniCode}) | Total Success: ${successCount}`);
            }

            // e-Stat APIの負荷軽減ウェイト (約500ms)
            await new Promise(r => setTimeout(r, 500));
        } catch (err) {
            console.error(`Error on ${muniCode} (${pref} ${city}):`, err.message);
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log(`\nFinished! Successfully imported: ${successCount}, Skipped: ${skipCount}`);
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal batch error:', err);
    process.exit(1);
});
