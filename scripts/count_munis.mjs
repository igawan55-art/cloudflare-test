import { getDb } from '../src/lib/db.js';

async function check() {
    const db = getDb();
    const [rows] = await db.query('SELECT COUNT(DISTINCT MunicipalityCode) as cnt FROM transactions WHERE MunicipalityCode IS NOT NULL AND MunicipalityCode != ""');
    const [imported] = await db.query('SELECT COUNT(*) as cnt FROM estat_census');
    console.log('Total Municipalities in transactions:', rows[0].cnt);
    console.log('Currently imported in estat_census:', imported[0].cnt);
    process.exit(0);
}

check();
