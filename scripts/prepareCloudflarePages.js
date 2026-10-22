// scripts/prepareCloudflarePages.js
// @astrojs/cloudflare (v14) が生成する dist/client と dist/server を、
// Cloudflare Pages (dist/_worker.js + dist/_routes.json + dist直下の静的アセット) 互換構造に自動整形するスクリプト

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const clientDir = path.join(distDir, 'client');
const serverDir = path.join(distDir, 'server');
const workerDir = path.join(distDir, '_worker.js');

function copyRecursiveSync(src, dest, skipMaps = false) {
    if (!fs.existsSync(src)) return;
    if (skipMaps && src.endsWith('.map')) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
            copyRecursiveSync(path.join(src, item), path.join(dest, item), skipMaps);
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

function patchWorkerFiles(dir) {
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            patchWorkerFiles(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) {
            let code = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (code.includes('import "cloudflare:workers";')) {
                code = code.replace('import "cloudflare:workers";', '// cloudflare:workers shimmed');
                modified = true;
            }
            if (code.includes('import { env } from "cloudflare:workers";')) {
                code = code.replace(
                    'import { env } from "cloudflare:workers";',
                    'const env = globalThis.__CF_ENV__ || {};'
                );
                modified = true;
            }
            if (item === 'index.js' && code.includes('async function handle(request, env, context) {')) {
                code = code.replace(
                    'async function handle(request, env, context) {',
                    'async function handle(request, env, context) {\n\tglobalThis.__CF_ENV__ = env;\n\tif (env && typeof env === "object") { Object.assign(globalThis.process.env, env); }'
                );
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, code, 'utf8');
            }
        }
    }
}

function main() {
    if (!fs.existsSync(clientDir) || !fs.existsSync(serverDir)) {
        console.log('[CF Pages Prep] dist/client or dist/server not found, skipping.');
        return;
    }

    console.log('[CF Pages Prep] Preparing dist/ for Cloudflare Pages SSR (_worker.js)...');

    // 1. dist/client/* を dist/ 直下に展開
    for (const item of fs.readdirSync(clientDir)) {
        copyRecursiveSync(path.join(clientDir, item), path.join(distDir, item), true);
    }

    // 2. dist/_worker.js ディレクトリを作成し、dist/server/* を配置（ソースマップ除外）
    if (fs.existsSync(workerDir)) {
        fs.rmSync(workerDir, { recursive: true, force: true });
    }
    fs.mkdirSync(workerDir, { recursive: true });

    for (const item of fs.readdirSync(serverDir)) {
        if (item.endsWith('.map') || item === 'wrangler.json') continue;
        const srcPath = path.join(serverDir, item);
        const destName = item === 'entry.mjs' ? 'index.js' : item;
        copyRecursiveSync(srcPath, path.join(workerDir, destName), true);
    }

    // 3. Cloudflare Pages の互換性日付に関わらず動作するよう Worker コードをパッチ
    patchWorkerFiles(workerDir);

    // 4. dist/client と dist/server を削除（重複アップロード防止）
    fs.rmSync(clientDir, { recursive: true, force: true });
    fs.rmSync(serverDir, { recursive: true, force: true });

    // 5. dist/_routes.json を生成（静的ファイルはCDNから直接無料配信し、ページのみSSR Workerで動的生成）
    const routesJson = {
        version: 1,
        include: ['/*'],
        exclude: [
            '/_astro/*',
            '/assets/*',
            '/sitemaps/*',
            '/favicon.ico',
            '/favicon.png',
            '/favicon.svg',
            '/robots.txt',
            '/sitemap.xml',
        ],
    };
    fs.writeFileSync(path.join(distDir, '_routes.json'), JSON.stringify(routesJson, null, 2), 'utf8');

    // 6. Astro が生成する .wrangler/deploy/config.json を削除 (Wrangler Pages deploy の誤検知を防止)
    const wranglerDeployDir = path.resolve(__dirname, '../.wrangler/deploy');
    if (fs.existsSync(wranglerDeployDir)) {
        fs.rmSync(wranglerDeployDir, { recursive: true, force: true });
    }

    console.log('[CF Pages Prep] Successfully created dist/_worker.js/index.js and dist/_routes.json!');
}

main();
