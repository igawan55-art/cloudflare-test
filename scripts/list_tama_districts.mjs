import { getDb } from '../src/lib/db.js';

async function main() {
    const db = getDb();
    const [rows] = await db.query(`
        SELECT DistrictCode, DistrictName, COUNT(*) as cnt 
        FROM transactions 
        WHERE MunicipalityCode = '13224' AND DistrictName IS NOT NULL AND DistrictName != '-' AND DistrictCode != '0'
        GROUP BY DistrictCode, DistrictName 
        ORDER BY cnt DESC
    `);
    console.log('Total Tama districts in transactions:', rows.length);
    rows.forEach(r => {
        console.log(`code: ${String(r.DistrictCode).padStart(9, '0')}, name: ${r.DistrictName}, cnt: ${r.cnt}`);
    });
    process.exit(0);
}

main().catch(console.error);
