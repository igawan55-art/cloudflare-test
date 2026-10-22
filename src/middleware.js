// src/middleware.js
// Cloudflare エッジ（SSR）リクエスト防御ミドルウェア
// 目的:
//   1. 悪質なスクレイパー、過剰なAIクローラー、SEO監査ボット、脆弱性スキャナをエッジで瞬時に 403 遮断
//   2. D1 データベースへの無駄なクエリ・行読み取り（無料枠の消費）を完全に防ぐ
//   3. 正規の検索エンジン（Google, Bing, Yahoo等）や一般ユーザーは通常通り通過

// 遮断対象の過剰スクレイピング・AI学習ボット・海外アグレッシブクローラー
const BLOCKED_BOT_REGEX = new RegExp(
    [
        'bytespider',       // ByteDance / TikTok 過剰スクレイパー
        'gptbot',           // OpenAI 学習クローラー
        'chatgpt-user',
        'ccbot',            // Common Crawl（超大量スクレイピング）
        'anthropic-ai',     // Anthropic
        'claudebot',
        'claude-web',
        'cohere-ai',
        'perplexitybot',
        'ahrefsbot',        // 商用SEOツール（短時間で大量アクセスし無料枠を枯渇させる）
        'semrushbot',
        'dotbot',
        'mj12bot',
        'petalbot',
        'dataforseobot',
        'baiduspider',      // 百度（海外からの不要な大量クロール）
        'yandex',           // Yandex
        'sogou',
        'exabot',
        'seekport',
        'megaindex',
        'censysinspect',    // ポート・脆弱性スキャナ
        'zgrab',
        'sqlmap',
        'nikto',
    ].join('|'),
    'i'
);

// よく狙われる攻撃・脆弱性スキャンパス（D1を叩く前に即座に遮断）
const SUSPICIOUS_PATHS = [
    '.php',
    'wp-admin',
    'wp-login',
    'xmlrpc.php',
    '.env',
    '.git',
    'cgi-bin',
    'setup.php',
    'phpmyadmin',
];

export async function onRequest(context, next) {
    const url = new URL(context.request.url);
    const pathname = url.pathname.toLowerCase();
    const ua = (context.request.headers.get('user-agent') || '').toLowerCase();

    // 1. 不審なスキャンパスへのアクセスを即時 404/403 遮断（DBアクセスなし）
    for (const badPath of SUSPICIOUS_PATHS) {
        if (pathname.includes(badPath)) {
            return new Response('Not Found', { status: 404 });
        }
    }

    // 2. 悪質・過剰なボット・スクレイパーを即時 403 遮断（DBアクセスなし）
    if (BLOCKED_BOT_REGEX.test(ua)) {
        return new Response('Access Denied: Automated scraping is blocked to preserve server resources.', {
            status: 403,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=86400',
            },
        });
    }

    // 3. User-Agent が完全に空のリクエスト（簡易攻撃スクリプト）を遮断
    if (!ua || ua.trim() === '') {
        return new Response('Forbidden: Missing User-Agent', { status: 403 });
    }

    // 4. 静的アセット（robots.txt, sitemap.xml, 画像, CSS, JS）はそのまま通過
    if (
        pathname.startsWith('/_astro/') ||
        pathname.startsWith('/assets/') ||
        pathname.startsWith('/sitemaps/') ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml' ||
        pathname === '/favicon.svg'
    ) {
        return next();
    }

    return next();
}
