// scripts/fetch_census_data.mjs
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
                    const json = JSON.parse(body);
                    resolve(json);
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
        const cat1 = v['@cat01']; // 100:総数, 110:15歳未満, 120:15-64, 130:65以上
        const cat2 = v['@cat02']; // 100:男女計, 110:男, 120:女
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
        const tab = v['@tab'];   // 2020_13:世帯数, 2020_22:世帯人員
        const cat1 = v['@cat01']; // 1:一般世帯
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

        if (cat1 === '111') stats.owned = val;          // 持ち家
        if (cat1 === '112') stats.publicRented = val;   // 公営・UR等借家
        if (cat1 === '113') stats.privateRented = val;  // 民営借家
    }
    stats.totalRented = (stats.publicRented || 0) + (stats.privateRented || 0);
    return stats;
}

// 指定自治体のデータを取り込んでDBに保存
export async function importCensusForMunicipality(db, muniCode, prefName, cityName) {
    console.log(`[Import] Fetching census for ${muniCode} (${prefName} ${cityName})...`);

    const [age, hh, housing] = await Promise.all([
        fetchAgeStats(muniCode),
        fetchHouseholdStats(muniCode),
        fetchHousingStats(muniCode)
    ]);

    if (!age || !hh) {
        console.warn(`[Import] Skipping ${muniCode}: missing data.`);
        return false;
    }

    const totalHouseholds = hh.households || 0;
    const owned = housing?.owned || 0;
    const ownedRate = totalHouseholds > 0 ? Number(((owned / totalHouseholds) * 100).toFixed(2)) : null;

    const row = {
        muniCode,
        prefName,
        cityName,
        totalPop: age.totalPop || 0,
        malePop: age.malePop || 0,
        femalePop: age.femalePop || 0,
        under15: age.under15 || 0,
        working15to64: age.working15to64 || 0,
        over65: age.over65 || 0,
        childRate: age.childRate ?? (age.totalPop ? Number(((age.under15 / age.totalPop) * 100).toFixed(2)) : null),
        workingRate: age.workingRate ?? (age.totalPop ? Number(((age.working15to64 / age.totalPop) * 100).toFixed(2)) : null),
        agingRate: age.agingRate ?? (age.totalPop ? Number(((age.over65 / age.totalPop) * 100).toFixed(2)) : null),
        households: totalHouseholds,
        members: hh.members || 0,
        avgSize: hh.avgSize || null,
        ownedHouseholds: owned,
        rentedHouseholds: housing?.totalRented || 0,
        publicRented: housing?.publicRented || 0,
        privateRented: housing?.privateRented || 0,
        ownedRate
    };

    const sql = `
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

    await db.query(sql, [
        row.muniCode, row.prefName, row.cityName,
        row.totalPop, row.malePop, row.femalePop,
        row.under15, row.working15to64, row.over65,
        row.childRate, row.workingRate, row.agingRate,
        row.households, row.members, row.avgSize,
        row.ownedHouseholds, row.rentedHouseholds, row.publicRented, row.privateRented,
        row.ownedRate
    ]);

    console.log(`[Import] Successfully saved ${cityName} (${muniCode}): Population=${row.totalPop.toLocaleString()}人, OwnedRate=${row.ownedRate}%`);
    return true;
}

// 実行エントリーポイント
async function main() {
    const db = getDb();
    
    // 対象自治体（多摩市 13224、および東京都の主要市区町村）
    const targetMunis = [
        { code: '13224', pref: '東京都', city: '多摩市' },
        { code: '13201', pref: '東京都', city: '八王子市' },
        { code: '13202', pref: '東京都', city: '立川市' },
        { code: '13203', pref: '東京都', city: '武蔵野市' },
        { code: '13206', pref: '東京都', city: '府中市' },
        { code: '13208', pref: '東京都', city: '調布市' },
        { code: '13209', pref: '東京都', city: '町田市' },
        { code: '13214', pref: '東京都', city: '国分寺市' },
        { code: '13101', pref: '東京都', city: '千代田区' },
        { code: '13102', pref: '東京都', city: '中央区' },
        { code: '13103', pref: '東京都', city: '港区' },
        { code: '13104', pref: '東京都', city: '新宿区' },
        { code: '13112', pref: '東京都', city: '世田谷区' },
        { code: '13113', pref: '東京都', city: '渋谷区' },
    ];

    console.log(`Starting census data import for ${targetMunis.length} municipalities...`);
    for (const m of targetMunis) {
        try {
            await importCensusForMunicipality(db, m.code, m.pref, m.city);
            // APIへの負荷軽減のため少し待つ
            await new Promise(r => setTimeout(r, 600));
        } catch (err) {
            console.error(`Failed to import ${m.city} (${m.code}):`, err.message);
        }
    }
    console.log('Import finished.');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
