// scripts/fetch_tama_districts.mjs
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

// 多摩市（13224）の町字マスター（サイト側の DistrictCode と e-Stat エリアコードの対応表）
const TAMA_DISTRICT_MAP = [
    { districtCode: '132240210', districtName: '連光寺', estatCode: '132240022' },
    { districtCode: '132240110', districtName: '関戸', estatCode: '132240012' },
    { districtCode: '132240030', districtName: '落合', estatCode: '132240170' },
    { districtCode: '132240150', districtName: '永山', estatCode: '132240140' },
    { districtCode: '132240120', districtName: '鶴牧', estatCode: '132240180' },
    { districtCode: '132240050', districtName: '貝取', estatCode: '132240150' },
    { districtCode: '132240130', districtName: '豊ケ丘', estatCode: '132240160' },
    { districtCode: '132240100', districtName: '諏訪', estatCode: '132240130' },
    { districtCode: '132240080', districtName: '桜ケ丘', estatCode: '132240110' },
    { districtCode: '132240020', districtName: '一ノ宮', estatCode: '132240100' },
    { districtCode: '132240220', districtName: '和田', estatCode: '132240061' },
    { districtCode: '132240170', districtName: '聖ケ丘', estatCode: '132240120' },
    { districtCode: '132240010', districtName: '愛宕', estatCode: '132240220' },
    { districtCode: '132240180', districtName: '馬引沢', estatCode: '132240240' },
    { districtCode: '132240140', districtName: '中沢', estatCode: '132240260' },
    { districtCode: '132240070', districtName: '乞田', estatCode: '132240040' },
    { districtCode: '132240190', districtName: '南野', estatCode: '132240190' },
    { districtCode: '132240160', districtName: '東寺方', estatCode: '132240092' },
    { districtCode: '132240060', districtName: '唐木田', estatCode: '132240270' },
    { districtCode: '132240040', districtName: '落川', estatCode: '132240080' },
    { districtCode: '132240200', districtName: '百草', estatCode: '132240070' },
    { districtCode: '132240090', districtName: '山王下', estatCode: '132240250' }
];

async function main() {
    console.log(`Starting census import for ${TAMA_DISTRICT_MAP.length} districts in Tama City...`);
    const db = getDb();
    const estatCodes = TAMA_DISTRICT_MAP.map(d => d.estatCode);
    const codeQuery = estatCodes.join(',');

    // 1. 人口総数・男女別・世帯総数 (8003006724)
    console.log('[1/4] Fetching Population and Households (8003006724)...');
    const popUrl = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${APP_ID}&statsDataId=8003006724&cdArea=${codeQuery}`;
    const popRes = await fetchJson(popUrl);
    const popValues = popRes.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];

    // 2. 年齢4区分人口 (8003006792)
    console.log('[2/4] Fetching Age Groups (8003006792)...');
    const ageUrl = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${APP_ID}&statsDataId=8003006792&cdArea=${codeQuery}`;
    const ageRes = await fetchJson(ageUrl);
    const ageValues = ageRes.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];

    // 3. 住宅の所有関係 (8003006918)
    console.log('[3/4] Fetching Housing Tenure (8003006918)...');
    const ownUrl = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${APP_ID}&statsDataId=8003006918&cdArea=${codeQuery}`;
    const ownRes = await fetchJson(ownUrl);
    const ownValues = ownRes.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];

    // 4. 住宅の建て方 (8003006978)
    console.log('[4/4] Fetching Housing Building Types (8003006978)...');
    const typeUrl = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${APP_ID}&statsDataId=8003006978&cdArea=${codeQuery}`;
    const typeRes = await fetchJson(typeUrl);
    const typeValues = typeRes.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];

    console.log('Aggregating data by district...');

    // マッピング集計
    const recordMap = new Map();
    for (const d of TAMA_DISTRICT_MAP) {
        recordMap.set(d.estatCode, {
            muniCode: '13224',
            districtCode: d.districtCode,
            pref: '東京都',
            city: '多摩市',
            districtName: d.districtName,
            estatCode: d.estatCode,
            totalPop: 0,
            malePop: 0,
            femalePop: 0,
            totalHouseholds: 0,
            under15: 0,
            working15to64: 0,
            over65: 0,
            ownedHouseholds: 0,
            rentedHouseholds: 0,
            detachedHouseholds: 0,
            apartmentHouseholds: 0
        });
    }

    // 1の反映
    for (const v of popValues) {
        const item = recordMap.get(v['@area']);
        if (!item) continue;
        const val = Number(v['$']) || 0;
        if (v['@cat01'] === '0010') item.totalPop = val;
        if (v['@cat01'] === '0020') item.malePop = val;
        if (v['@cat01'] === '0030') item.femalePop = val;
        if (v['@cat01'] === '0040') item.totalHouseholds = val;
    }

    // 2の反映 (年齢)
    for (const v of ageValues) {
        const item = recordMap.get(v['@area']);
        if (!item) continue;
        const val = Number(v['$']) || 0;
        if (v['@cat01'] === '0170') item.under15 = val;
        if (v['@cat01'] === '0180') item.working15to64 = val;
        if (v['@cat01'] === '0190') item.over65 = val;
    }

    // 3の反映 (持ち家)
    for (const v of ownValues) {
        const item = recordMap.get(v['@area']);
        if (!item) continue;
        const val = Number(v['$']) || 0;
        if (v['@cat01'] === '0020') item.ownedHouseholds = val;
        if (v['@cat01'] === '0030') item.rentedHouseholds = val;
    }

    // 4の反映 (建て方)
    for (const v of typeValues) {
        const item = recordMap.get(v['@area']);
        if (!item) continue;
        const val = Number(v['$']) || 0;
        if (v['@cat01'] === '0020') item.detachedHouseholds = val;
        if (v['@cat01'] === '0040') item.apartmentHouseholds = val;
    }

    // DBへの挿入
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

    console.log('Saving records to estat_census_district...');
    for (const r of recordMap.values()) {
        const avgSize = r.totalHouseholds > 0 && r.totalPop > 0 
            ? Number((r.totalPop / r.totalHouseholds).toFixed(2)) 
            : null;
        
        const childRate = r.totalPop > 0 ? Number(((r.under15 / r.totalPop) * 100).toFixed(2)) : null;
        const workingRate = r.totalPop > 0 ? Number(((r.working15to64 / r.totalPop) * 100).toFixed(2)) : null;
        const agingRate = r.totalPop > 0 ? Number(((r.over65 / r.totalPop) * 100).toFixed(2)) : null;

        const totalHousing = r.ownedHouseholds + r.rentedHouseholds;
        const ownedRate = totalHousing > 0 ? Number(((r.ownedHouseholds / totalHousing) * 100).toFixed(2)) : null;

        const totalBuilt = r.detachedHouseholds + r.apartmentHouseholds;
        const detachedRate = totalBuilt > 0 ? Number(((r.detachedHouseholds / totalBuilt) * 100).toFixed(2)) : null;

        await db.query(insertSql, [
            r.muniCode, r.districtCode, r.pref, r.city, r.districtName, r.estatCode,
            r.totalPop, r.malePop, r.femalePop, r.totalHouseholds, avgSize,
            r.under15, r.working15to64, r.over65, childRate, workingRate, agingRate,
            r.ownedHouseholds, r.rentedHouseholds, ownedRate,
            r.detachedHouseholds, r.apartmentHouseholds, detachedRate
        ]);

        console.log(`✓ [${r.districtCode}] ${r.districtName}: 人口=${r.totalPop.toLocaleString()}人, 世帯=${r.totalHouseholds.toLocaleString()}, 持家率=${ownedRate ?? '—'}%, 一戸建率=${detachedRate ?? '—'}%`);
    }

    console.log('\nAll 22 Tama City districts imported successfully!');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
