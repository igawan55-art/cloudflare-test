// scripts/importToD1.js
// d1_export/ 内の分割SQLファイルを順番に Cloudflare D1 (ローカルまたは本番リモート) に一括インポートするスクリプト
// 使い方:
//   npm run d1:import:local   (ローカルの Wrangler D1 エミュレータへ投入)
//   npm run d1:import:remote  (Cloudflare 本番の D1 データベースへ投入)

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const isRemote = args.includes('--remote');
const dbName = args.find((a) => a.startsWith('--db='))?.split('=')[1] || 'realestate-d1';
const modeFlag = isRemote ? '--remote' : '--local';

const exportDir = path.resolve(__dirname, '../d1_export');

if (!fs.existsSync(exportDir)) {
    console.error(`[D1 Import] Directory not found: ${exportDir}\n先に "npm run d1:export" を実行してください。`);
    process.exit(1);
}

const sqlFiles = fs
    .readdirSync(exportDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

if (sqlFiles.length === 0) {
    console.error(`[D1 Import] No .sql files found in ${exportDir}`);
    process.exit(1);
}

console.log(`[D1 Import] Starting import of ${sqlFiles.length} SQL files into "${dbName}" (${modeFlag})...`);

for (let i = 0; i < sqlFiles.length; i++) {
    const file = sqlFiles[i];
    const filePath = path.join(exportDir, file);
    const sizeKb = (fs.statSync(filePath).size / 1024).toFixed(1);
    console.log(`[${i + 1}/${sqlFiles.length}] Executing ${file} (${sizeKb} KB)...`);

    const cmd = `npx wrangler d1 execute ${dbName} ${modeFlag} --yes --file="${filePath}"`;
    execSync(cmd, {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'inherit'],
    });
}

console.log(`\n✅ [D1 Import] All ${sqlFiles.length} SQL files successfully imported into ${dbName} (${modeFlag})!`);
