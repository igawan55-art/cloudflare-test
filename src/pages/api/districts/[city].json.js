import { getDb } from '../../../lib/db.js';
import { getDistrictsByCity } from '../../../lib/areaStats.js';

export async function GET({ params }) {
    const db = getDb();
    const districts = await getDistrictsByCity(db, params.city);
    return new Response(JSON.stringify(districts), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    });
}
