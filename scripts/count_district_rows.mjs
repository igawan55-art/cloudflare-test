import { getDb } from '../src/lib/db.js';

async function check() {
    const db = getDb();
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM estat_census_district');
    console.log('Total in estat_census_district:', rows[0].cnt);
    process.exit(0);
}

check();
