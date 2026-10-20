import { getDb } from '../../../lib/db.js';
import { getCityIndex, getDistrictsByCity } from '../../../lib/areaStats.js';

export async function getStaticPaths() {
    const db = getDb();
    const cities = await getCityIndex(db);
    return cities.map((c) => ({
        params: { city: c.code },
    }));
}

export async function GET({ params }) {
    const db = getDb();
    const districts = await getDistrictsByCity(db, params.city);
    return new Response(JSON.stringify(districts), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
    });
}
