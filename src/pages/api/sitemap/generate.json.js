// src/pages/api/sitemap/generate.json.js
// サイトマップの再生成を実行するAPIエンドポイント（ローカルNode.js環境専用）

export async function GET({ request }) {
    try {
        const modPath = '../../../../scripts/' + 'generateSitemap.js';
        const { generateSitemaps } = await import(/* @vite-ignore */ modPath);
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
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Static sitemaps are pre-generated at /sitemap.xml',
                error: err.message,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
            }
        );
    }
}

export async function POST(context) {
    return GET(context);
}
