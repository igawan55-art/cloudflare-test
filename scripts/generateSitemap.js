// scripts/generateSitemap.js
// データベースから全市区町村・全町字・全種別URLを網羅した sitemap.xml（Sitemap Index）および
// 分割サイトマップ（sitemaps/sitemap-*.xml）を自動生成するジェネレータ

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { SITE_URL } from '../src/lib/siteConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = SITE_URL;
const CHUNK_SIZE = 40000; // Google仕様上限(50,000件・50MB)に余裕を持たせた40,000件/ファイル
const TYPES = ['mansion', 'house', 'land', 'rosenka', 'official', 'standard'];

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate_db',
};

class SitemapWriter {
    constructor(outputDir, baseUrl, today) {
        this.outputDir = outputDir;
        this.baseUrl = baseUrl;
        this.today = today;
        this.fileIndex = 1;
        this.currentCount = 0;
        this.totalUrls = 0;
        this.files = [];
        this.stream = null;
    }

    _openNewFile() {
        if (this.stream) {
            this.stream.write('</urlset>\n');
            this.stream.end();
        }
        const fileName = `sitemap-${this.fileIndex}.xml`;
        const filePath = path.join(this.outputDir, fileName);
        this.files.push(fileName);
        this.currentCount = 0;
        this.fileIndex++;

        this.stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
        this.stream.write('<?xml version="1.0" encoding="UTF-8"?>\n');
        this.stream.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
    }

    addUrl(pathname, priority = '0.5', changefreq = 'monthly') {
        if (!this.stream || this.currentCount >= CHUNK_SIZE) {
            this._openNewFile();
        }
        const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
        const loc = `${this.baseUrl}${cleanPath}`;
        this.stream.write(
            `  <url><loc>${loc}</loc><lastmod>${this.today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>\n`
        );
        this.currentCount++;
        this.totalUrls++;
    }

    async close() {
        if (this.stream) {
            this.stream.write('</urlset>\n');
            await new Promise((resolve) => this.stream.end(resolve));
        }
        return {
            totalUrls: this.totalUrls,
            files: this.files,
        };
    }
}

/**
 * サイトマップ一式を生成
 */
export async function generateSitemaps(options = {}) {
    const startTime = Date.now();
    const baseUrl = (options.baseUrl || BASE_URL).replace(/\/+$/, '');
    const publicDir = options.publicDir || path.resolve(__dirname, '../public');
    const sitemapsDir = path.join(publicDir, 'sitemaps');
    const today = new Date().toISOString().split('T')[0];

    if (!fs.existsSync(sitemapsDir)) {
        fs.mkdirSync(sitemapsDir, { recursive: true });
    } else {
        // 既存の分割サイトマップをクリア
        for (const file of fs.readdirSync(sitemapsDir)) {
            if (file.endsWith('.xml')) {
                fs.unlinkSync(path.join(sitemapsDir, file));
            }
        }
    }

    console.log(`[Sitemap] Starting sitemap generation for ${baseUrl}...`);
    const writer = new SitemapWriter(sitemapsDir, baseUrl, today);

    // 1. 静的主要ページ & 47都道府県ページ
    writer.addUrl('/', '1.0', 'daily');
    writer.addUrl('/areas', '0.9', 'weekly');
    for (let i = 1; i <= 47; i++) {
        const prefId = String(i).padStart(2, '0');
        writer.addUrl(`/pref${prefId}/`, '0.9', 'weekly');
    }
    writer.addUrl('/terms', '0.3', 'yearly');
    writer.addUrl('/privacy', '0.3', 'yearly');

    const db = await mysql.createPool(DB_CONFIG);

    try {
        // 2. 市区町村ページ（各市区町村のデフォルト + 6種別タブ）
        console.log('[Sitemap] Querying municipalities...');
        const [muniRows] = await db.query(`
            SELECT DISTINCT MunicipalityCode
            FROM transactions
            WHERE MunicipalityCode IS NOT NULL
            ORDER BY MunicipalityCode ASC
        `);

        console.log(`[Sitemap] Found ${muniRows.length} municipalities. Adding URLs...`);
        for (const row of muniRows) {
            const muniCode = String(row.MunicipalityCode).padStart(5, '0');
            const prefSlug = `pref${muniCode.slice(0, 2)}`;

            // 市区町村トップ（デフォルト中古マンション）
            writer.addUrl(`/${prefSlug}/${muniCode}`, '0.8', 'weekly');

            // 市区町村 × 6種別
            for (const type of TYPES) {
                writer.addUrl(`/${prefSlug}/${muniCode}/${type}`, '0.8', 'weekly');
            }
        }

        // 3. 町字（地区）ページ（各地区のデフォルト + 6種別タブ）
        console.log('[Sitemap] Querying districts...');
        const [distRows] = await db.query(`
            SELECT DISTINCT MunicipalityCode, DistrictCode
            FROM transactions
            WHERE DistrictName IS NOT NULL AND DistrictName != '-'
              AND DistrictCode IS NOT NULL AND DistrictCode != '0'
            ORDER BY MunicipalityCode ASC, DistrictCode ASC
        `);

        console.log(`[Sitemap] Found ${distRows.length} districts. Adding URLs...`);
        for (const row of distRows) {
            const muniCode = String(row.MunicipalityCode).padStart(5, '0');
            const distCode = String(row.DistrictCode).padStart(9, '0');
            const prefSlug = `pref${muniCode.slice(0, 2)}`;

            // 町字トップ（デフォルト中古マンション）
            writer.addUrl(`/${prefSlug}/${muniCode}/${distCode}`, '0.6', 'monthly');

            // 町字 × 6種別（神田佐久間町の路線価など全末端ページ）
            for (const type of TYPES) {
                writer.addUrl(`/${prefSlug}/${muniCode}/${distCode}/${type}`, '0.6', 'monthly');
            }
        }

        const result = await writer.close();

        // 4. ルートの sitemap.xml（Sitemap Index）を生成
        const rootSitemapPath = path.join(publicDir, 'sitemap.xml');
        const indexXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...result.files.map((file) => `  <sitemap><loc>${baseUrl}/sitemaps/${file}</loc><lastmod>${today}</lastmod></sitemap>`),
            '</sitemapindex>',
            '',
        ].join('\n');

        fs.writeFileSync(rootSitemapPath, indexXml, 'utf8');

        // 5. robots.txt の確認・自動生成（主要検索エンジンのみ許可、不要なAIスクレイパー・SEOボットを明示的に拒否）
        const robotsPath = path.join(publicDir, 'robots.txt');
        const robotsTxt = [
            '# 許可する正規の検索エンジン',
            'User-agent: Googlebot',
            'Allow: /',
            '',
            'User-agent: Bingbot',
            'Allow: /',
            '',
            'User-agent: Slurp',
            'Allow: /',
            '',
            'User-agent: Applebot',
            'Allow: /',
            '',
            '# 過剰なリクエストを行うAIクローラー・商用SEOスクレイパーを拒否（無料枠保護）',
            'User-agent: GPTBot',
            'Disallow: /',
            '',
            'User-agent: ChatGPT-User',
            'Disallow: /',
            '',
            'User-agent: CCBot',
            'Disallow: /',
            '',
            'User-agent: anthropic-ai',
            'Disallow: /',
            '',
            'User-agent: ClaudeBot',
            'Disallow: /',
            '',
            'User-agent: Bytespider',
            'Disallow: /',
            '',
            'User-agent: AhrefsBot',
            'Disallow: /',
            '',
            'User-agent: SemrushBot',
            'Disallow: /',
            '',
            'User-agent: DotBot',
            'Disallow: /',
            '',
            'User-agent: MJ12bot',
            'Disallow: /',
            '',
            'User-agent: PetalBot',
            'Disallow: /',
            '',
            'User-agent: Baiduspider',
            'Disallow: /',
            '',
            'User-agent: Yandex',
            'Disallow: /',
            '',
            '# その他一般設定',
            'User-agent: *',
            'Allow: /',
            '',
            `Sitemap: ${baseUrl}/sitemap.xml`,
            '',
        ].join('\n');
        fs.writeFileSync(robotsPath, robotsTxt, 'utf8');

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[Sitemap] Generated ${result.totalUrls.toLocaleString()} URLs across ${result.files.length} sitemaps in ${duration}s!`);
        console.log(`[Sitemap] Root index: ${rootSitemapPath}`);
        console.log(`[Sitemap] robots.txt: ${robotsPath}`);

        return {
            success: true,
            totalUrls: result.totalUrls,
            sitemapsCount: result.files.length,
            durationSeconds: Number(duration),
            generatedAt: new Date().toISOString(),
        };
    } finally {
        await db.end();
    }
}

// CLIから直接実行された場合
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    generateSitemaps().catch((err) => {
        console.error('[Sitemap] Failed to generate sitemap:', err);
        process.exit(1);
    });
}
