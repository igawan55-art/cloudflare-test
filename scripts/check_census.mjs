import { getDb } from '../src/lib/db.js';

async function check() {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM estat_census WHERE MunicipalityCode = ?', ['13224']);
    console.log('--- 多摩市（13224）の国勢調査データ ---');
    console.dir(rows[0], { depth: 4 });
    process.exit(0);
}

check();
