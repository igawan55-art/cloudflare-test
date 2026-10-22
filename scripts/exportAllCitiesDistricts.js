// scripts/exportAllCitiesDistricts.js
// 全国の全市区町村（1,889自治体）配下の全町字（11.2万件）の地区リスト（districts_json）を抽出し、
// Cloudflare D1 の cities_master テーブルを全国対応に一括アップデートするスクリプト

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TSUBO = 3.30578;
const MAX_SQL_FILE_BYTES = 3.5 * 1024 * 1024; // 3.5MBごとに分割

const round1 = (v) => (v == null || !isFinite(v) ? null : Math.round(Number(v) * 10) / 10);

function sqlVal(v) {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
    return `'${String(v).replace(/'/g, "''")}'`;
}

class ChunkedSqlWriter {
    constructor(outDir, prefix) {
        this.outDir = outDir;
        this.prefix = prefix;
        this.part = 1;
        this.currentBytes = 0;
        this.buffer = [];
        this.files = [];
    }

    addStatement(stmt) {
        const line = stmt + '\n';
        const bytes = Buffer.byteLength(line, 'utf8');
        if (this.currentBytes + bytes > MAX_SQL_FILE_BYTES && this.buffer.length > 0) {
            this.flush();
        }
        this.buffer.push(line);
        this.currentBytes += bytes;
    }

    flush() {
        if (this.buffer.length === 0) return;
        const fileName = `${this.prefix}_part${String(this.part).padStart(3, '0')}.sql`;
        const filePath = path.join(this.outDir, fileName);
        fs.writeFileSync(filePath, this.buffer.join(''), 'utf8');
        this.files.push(fileName);
        this.part++;
        this.buffer = [];
        this.currentBytes = 0;
    }
}

async function main() {
    const startTime = Date.now();
    const outDir = path.resolve(__dirname, '../d1_districts_export');
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(outDir)) {
        if (f.endsWith('.sql')) fs.unlinkSync(path.join(outDir, f));
    }

    const db = await mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'realestate_db',
        waitForConnections: true,
        connectionLimit: 12,
    });

    try {
        console.log('[Districts Export] Fetching all municipalities...');
        const [muniRows] = await db.query(`
            SELECT DISTINCT LPAD(MunicipalityCode, 5, '0') AS muniCode
            FROM transactions
            WHERE MunicipalityCode IS NOT NULL AND MunicipalityCode != ''
            ORDER BY muniCode ASC
        `);

        console.log(`[Districts Export] Processing ${muniRows.length} municipalities across Japan...`);
        const writer = new ChunkedSqlWriter(outDir, '05_update_cities_districts');

        let totalDistricts = 0;
        const CONCURRENCY = 12;

        for (let i = 0; i < muniRows.length; i += CONCURRENCY) {
            const batch = muniRows.slice(i, i + CONCURRENCY);
            const results = await Promise.all(
                batch.map(async (row) => {
                    const muniCode = row.muniCode;
                    const shortMuni = muniCode.startsWith('0') ? String(Number(muniCode)) : muniCode;
                    const [distRows] = await db.query(
                        `SELECT LPAD(DistrictCode, 9, '0') AS code,
                                MAX(DistrictName) AS name,
                                COUNT(*) AS cnt,
                                AVG(CASE WHEN Type = '中古マンション等' AND CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) END) AS mansion,
                                AVG(CASE WHEN Type = '宅地(土地と建物)' AND CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) END) AS house,
                                AVG(CASE WHEN Type = '宅地(土地)' AND CAST(TradePrice AS UNSIGNED) > 0 AND CAST(Area AS DECIMAL(12,2)) > 0
                                         THEN CAST(TradePrice AS UNSIGNED) / CAST(Area AS DECIMAL(12,2)) END) AS landSqm
                         FROM transactions USE INDEX (idx_municipality)
                         WHERE MunicipalityCode IN (?, ?)
                           AND DistrictName IS NOT NULL AND DistrictName != '-'
                           AND DistrictCode IS NOT NULL AND DistrictCode != '0'
                         GROUP BY LPAD(DistrictCode, 9, '0')
                         ORDER BY cnt DESC`,
                        [muniCode, shortMuni]
                    );

                    const districts = distRows.map((d) => ({
                        code: d.code,
                        name: d.name,
                        count: Number(d.cnt),
                        mansion: d.mansion ? round1(d.mansion / 10000) : null,
                        house: d.house ? round1(d.house / 10000) : null,
                        landTsubo: d.landSqm ? round1((d.landSqm * TSUBO) / 10000) : null,
                    }));

                    return { muniCode, districts };
                })
            );

            for (const item of results) {
                totalDistricts += item.districts.length;
                if (item.districts.length > 0) {
                    writer.addStatement(
                        `UPDATE cities_master SET districts_json = ${sqlVal(JSON.stringify(item.districts))} WHERE muni_code = ${sqlVal(item.muniCode)};`
                    );
                }
            }

            if ((i + CONCURRENCY) % 120 === 0 || i + CONCURRENCY >= muniRows.length) {
                const progress = Math.min(i + CONCURRENCY, muniRows.length);
                console.log(`[Districts Export] Progress: ${progress}/${muniRows.length} municipalities (${totalDistricts.toLocaleString()} districts)...`);
            }
        }

        writer.flush();

        const allSqlFiles = fs.readdirSync(outDir).filter((f) => f.endsWith('.sql')).sort();
        let totalSize = 0;
        for (const f of allSqlFiles) {
            totalSize += fs.statSync(path.join(outDir, f)).size;
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
            `\n✅ [Districts Export] Completed in ${elapsed}s! Extracted ${totalDistricts.toLocaleString()} districts across ${muniRows.length} municipalities into ${allSqlFiles.length} SQL files (${(totalSize / 1024 / 1024).toFixed(2)} MB total) in ${outDir}`
        );
    } finally {
        await db.end();
    }
}

main().catch((err) => {
    console.error('[Districts Export] Error:', err);
    process.exit(1);
});
