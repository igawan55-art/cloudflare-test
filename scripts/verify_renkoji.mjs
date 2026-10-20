import { getDb } from '../src/lib/db.js';

async function verify() {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM estat_census_district WHERE DistrictCode = ?', ['132240210']);
    console.log('--- 連光寺（132240210）の国勢調査データ ---');
    console.dir(rows[0], { depth: 4 });
    process.exit(0);
}

verify();
