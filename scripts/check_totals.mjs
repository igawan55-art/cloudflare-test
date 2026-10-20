import { getDb } from '../src/lib/db.js';

async function check() {
    const db = getDb();
    const [muni] = await db.query('SELECT COUNT(DISTINCT MunicipalityCode) as cnt FROM transactions WHERE MunicipalityCode IS NOT NULL AND MunicipalityCode != ""');
    const [dist] = await db.query(`
        SELECT COUNT(DISTINCT MunicipalityCode, DistrictCode) as cnt 
        FROM transactions 
        WHERE DistrictCode IS NOT NULL AND DistrictCode != '0' AND DistrictCode != '' AND DistrictName IS NOT NULL AND DistrictName != '-'
    `);
    console.log('Total Municipalities in transactions:', muni[0].cnt);
    console.log('Total Districts in transactions:', dist[0].cnt);
    process.exit(0);
}

check().catch(console.error);
