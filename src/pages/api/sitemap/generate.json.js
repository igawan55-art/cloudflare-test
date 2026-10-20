// src/pages/api/sitemap/generate.json.js
// サイトマップの再生成を実行するAPIエンドポイント
import { generateSitemaps } from '../../../../scripts/generateSitemap.js';

export async function GET({ request }) {
    try {
        const url = new URL(request.url);
        const baseUrl = url.origin && !url.origin.includes('localhost') ? url.origin : undefined;
        const result = await generateSitemaps({ baseUrl });
        return new Response(JSON.stringify(result, null, 2), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store, no-cache',
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
        });
    }
}

export async function POST(context) {
    return GET(context);
}
