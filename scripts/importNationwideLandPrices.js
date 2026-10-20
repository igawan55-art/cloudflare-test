import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { getDb } from '../src/lib/db.js';

const PREFECTURES = {
    '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県', '05': '秋田県',
    '06': '山形県', '07': '福島県', '08': '茨城県', '09': '栃木県', '10': '群馬県',
    '11': '埼玉県', '12': '千葉県', '13': '東京都', '14': '神奈川県', '15': '新潟県',
    '16': '富山県', '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
    '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県', '25': '滋賀県',
    '26': '京都府', '27': '大阪府', '28': '兵庫県', '29': '奈良県', '30': '和歌山県',
    '31': '鳥取県', '32': '島根県', '33': '岡山県', '34': '広島県', '35': '山口県',
    '36': '徳島県', '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
    '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県', '45': '宮崎県',
    '46': '鹿児島県', '47': '沖縄県'
};

const DIVISION_MAP = {
    '000': '住宅地',
    '001': '住宅地',
    '003': '宅地見込地',
    '005': '商業地',
    '009': '工業地',
    '013': '市街化調整区域内の宅地',
    '020': '林地'
};

function getPrefectureName(muniCode, address) {
    if (muniCode && muniCode.length >= 2) {
        const code = muniCode.slice(0, 2);
        if (PREFECTURES[code]) return PREFECTURES[code];
    }
    if (address) {
        for (const name of Object.values(PREFECTURES)) {
            if (address.startsWith(name)) return name;
        }
    }
    return '';
}

function cleanAddress(addr) {
    if (!addr) return '';
    return addr.replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();
}

function numOrNull(val) {
    if (val === null || val === undefined || val === '' || val === '_') return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
}

async function bulkInsert(db, rows) {
    if (!rows || rows.length === 0) return;
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
        const values = [];
        for (const r of chunk) {
            values.push(
                r.Year,
                r.Prefecture,
                r.MunicipalityCode,
                r.Division,
                r.SourceType,
                r.PricePerSqm,
                r.Address,
                r.Area,
                r.Shape,
                r.CurrentUse,
                r.BuildingCoverageRatio,
                r.FloorAreaRatio,
                r.OfficialPrice,
                r.FluctuationRate,
                r.Latitude,
                r.Longitude
            );
        }
        await db.query(`
            INSERT INTO appraisals (
                Year, Prefecture, MunicipalityCode, Division, SourceType,
                PricePerSqm, Address, Area, Shape, CurrentUse,
                BuildingCoverageRatio, FloorAreaRatio, OfficialPrice, FluctuationRate,
                Latitude, Longitude
            ) VALUES ${placeholders}
        `, values);
    }
}

async function processYear(db, yearShort, yearFull) {
    console.log(`\n========================================`);
    console.log(`Starting processing for Year ${yearFull} (L01-${yearShort}, L02-${yearShort})`);
    console.log(`========================================`);

    // Use OS temp dir to prevent Astro/Vite watcher from locking or triggering EBUSY
    const workDir = path.join(os.tmpdir(), `ksj_import_${yearShort}`);
    if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, { recursive: true });
    }

    // 1. Download & Extract L01 (Kouji)
    const l01ZipUrl = `https://nlftp.mlit.go.jp/ksj/gml/data/L01/L01-${yearShort}/L01-${yearShort}_GML.zip`;
    const l01ZipPath = path.join(workDir, `L01-${yearShort}_GML.zip`);
    if (!fs.existsSync(l01ZipPath)) {
        console.log(`Downloading L01-${yearShort}...`);
        execSync(`curl.exe -s -L -o "${l01ZipPath}" "${l01ZipUrl}"`, { stdio: 'inherit' });
    }
    console.log(`Extracting L01-${yearShort}...`);
    execSync(`tar -xf "${l01ZipPath}" -C "${workDir}"`, { stdio: 'inherit' });

    // 2. Download & Extract L02 (Chousa)
    const l02ZipUrl = `https://nlftp.mlit.go.jp/ksj/gml/data/L02/L02-${yearShort}/L02-${yearShort}_GML.zip`;
    const l02ZipPath = path.join(workDir, `L02-${yearShort}_GML.zip`);
    if (!fs.existsSync(l02ZipPath)) {
        console.log(`Downloading L02-${yearShort}...`);
        execSync(`curl.exe -s -L -o "${l02ZipPath}" "${l02ZipUrl}"`, { stdio: 'inherit' });
    }
    console.log(`Extracting L02-${yearShort}...`);
    execSync(`tar -xf "${l02ZipPath}" -C "${workDir}"`, { stdio: 'inherit' });

    // Find GeoJSON files
    const findGeoJSON = (dir, prefix) => {
        const files = fs.readdirSync(dir, { recursive: true });
        for (const f of files) {
            const fStr = f.toString();
            if (fStr.endsWith('.geojson') && fStr.includes(prefix)) {
                return path.join(dir, fStr);
            }
        }
        return null;
    };

    const l01File = findGeoJSON(workDir, `L01-${yearShort}`);
    const l02File = findGeoJSON(workDir, `L02-${yearShort}`);

    console.log(`Found L01: ${l01File}`);
    console.log(`Found L02: ${l02File}`);

    // Parse L01 features
    const allRows = [];
    if (l01File && fs.existsSync(l01File)) {
        console.log(`Parsing L01-${yearShort} GeoJSON...`);
        const content = JSON.parse(fs.readFileSync(l01File, 'utf8'));
        let count = 0;
        const isLegacySchema = (yearFull <= 2023);

        for (const feature of content.features) {
            const p = feature.properties;
            const muniCode = String(
                isLegacySchema ? (p.L01_022 || p.L01_004 || '') : (p.L01_001 || p.L01_004 || '')
            );
            // Skip Setagaya (13112) to preserve previously established tuning and 150 points
            if (muniCode === '13112') continue;

            const divCode = isLegacySchema ? (p.L01_001 || p.L01_003 || '000') : (p.L01_002 || p.L01_005 || '000');
            const division = DIVISION_MAP[divCode] || 'その他';
            const addr = cleanAddress(
                isLegacySchema ? (p.L01_024 || p.L01_025 || '') : (p.L01_025 || p.L01_026 || '')
            );
            const pref = getPrefectureName(muniCode, addr);
            const price = Number(isLegacySchema ? p.L01_006 : p.L01_008) || 0;
            if (price <= 0) continue;

            const rate = numOrNull(isLegacySchema ? p.L01_007 : p.L01_009);
            const area = numOrNull(isLegacySchema ? p.L01_026 : p.L01_027);
            const rawShape = isLegacySchema ? p.L01_034 : p.L01_035;
            const shape = rawShape && rawShape !== '_' ? String(rawShape) : null;
            const rawUse = isLegacySchema ? p.L01_027 : p.L01_028;
            const use = rawUse && rawUse !== '_' ? String(rawUse) : null;
            const bcr = numOrNull(isLegacySchema ? p.L01_056 : p.L01_057);
            const far = numOrNull(isLegacySchema ? p.L01_057 : p.L01_058);
            const coords = feature.geometry?.coordinates;
            const lng = coords ? numOrNull(coords[0]) : null;
            const lat = coords ? numOrNull(coords[1]) : null;

            allRows.push({
                Year: String(yearFull),
                Prefecture: pref,
                MunicipalityCode: muniCode,
                Division: division,
                SourceType: 'kouji',
                PricePerSqm: price,
                Address: addr,
                Area: area,
                Shape: shape,
                CurrentUse: use,
                BuildingCoverageRatio: bcr,
                FloorAreaRatio: far,
                OfficialPrice: price,
                FluctuationRate: rate,
                Latitude: lat,
                Longitude: lng
            });
            count++;
        }
        console.log(`Prepared ${count} L01 rows.`);
    }

    // Parse L02 features
    if (l02File && fs.existsSync(l02File)) {
        console.log(`Parsing L02-${yearShort} GeoJSON...`);
        const content = JSON.parse(fs.readFileSync(l02File, 'utf8'));
        let count = 0;
        const isLegacySchema = (yearFull <= 2023);

        for (const feature of content.features) {
            const p = feature.properties;
            const muniCode = String(p.L02_020 || '');
            // Skip Setagaya (13112) to preserve previously established tuning and 150 points
            if (muniCode === '13112') continue;

            const divCode = p.L02_001 || p.L02_003 || '000';
            const division = DIVISION_MAP[divCode] || 'その他';
            const addr = cleanAddress(p.L02_022 || p.L02_023 || '');
            const pref = getPrefectureName(muniCode, addr);
            const price = Number(p.L02_006) || 0;
            if (price <= 0) continue;

            const rate = numOrNull(p.L02_007);
            const area = numOrNull(p.L02_024);
            const rawShape = p.L02_032;
            const shape = rawShape && rawShape !== '_' ? String(rawShape) : null;
            const rawUse = p.L02_025;
            const use = rawUse && rawUse !== '_' ? String(rawUse) : null;
            const bcr = numOrNull(isLegacySchema ? p.L02_050 : p.L02_051);
            const far = numOrNull(isLegacySchema ? p.L02_051 : p.L02_052);
            const coords = feature.geometry?.coordinates;
            const lng = coords ? numOrNull(coords[0]) : null;
            const lat = coords ? numOrNull(coords[1]) : null;

            allRows.push({
                Year: String(yearFull),
                Prefecture: pref,
                MunicipalityCode: muniCode,
                Division: division,
                SourceType: 'chousa',
                PricePerSqm: price,
                Address: addr,
                Area: area,
                Shape: shape,
                CurrentUse: use,
                BuildingCoverageRatio: bcr,
                FloorAreaRatio: far,
                OfficialPrice: price,
                FluctuationRate: rate,
                Latitude: lat,
                Longitude: lng
            });
            count++;
        }
        console.log(`Prepared ${count} L02 rows.`);
    }

    console.log(`Total rows to insert for ${yearFull} (excl. Setagaya): ${allRows.length}`);

    // Delete existing non-Setagaya data for this year to avoid duplicates if re-run
    console.log(`Clearing existing non-Setagaya records for Year = ${yearFull}...`);
    const [delRes] = await db.query('DELETE FROM appraisals WHERE Year = ? AND MunicipalityCode != ?', [String(yearFull), '13112']);
    console.log(`Deleted ${delRes.affectedRows} existing records.`);

    // Bulk insert
    console.log(`Inserting ${allRows.length} rows...`);
    const startTime = Date.now();
    await bulkInsert(db, allRows);
    console.log(`Inserted ${allRows.length} rows in ${((Date.now() - startTime) / 1000).toFixed(1)}s.`);

    // Clean up temporary extracted directory in OS temp
    try {
        fs.rmSync(workDir, { recursive: true, force: true });
        console.log(`Cleaned up ${workDir}`);
    } catch (e) {
        console.warn(`Could not clean ${workDir}:`, e.message);
    }
}

async function main() {
    const db = getDb();

    // Process all years 2022 through 2026
    const targets = [
        { short: '26', full: 2026 },
        { short: '25', full: 2025 },
        { short: '24', full: 2024 },
        { short: '23', full: 2023 },
        { short: '22', full: 2022 }
    ];

    for (const t of targets) {
        await processYear(db, t.short, t.full);
    }

    console.log(`\n========================================`);
    console.log(`Final Verification: Appraisals summary by Year & Division`);
    console.log(`========================================`);
    const [summary] = await db.query(`
        SELECT Year, Division, COUNT(*) as cnt
        FROM appraisals
        GROUP BY Year, Division
        ORDER BY Year, cnt DESC
    `);
    console.table(summary);

    const [prefSummary] = await db.query(`
        SELECT Year, COUNT(DISTINCT Prefecture) as pref_cnt, COUNT(*) as total_cnt
        FROM appraisals
        GROUP BY Year
        ORDER BY Year
    `);
    console.table(prefSummary);

    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal error in import:', err);
    process.exit(1);
});
