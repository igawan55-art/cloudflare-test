// scripts/importTransactions2005_2021.js
// 2005年〜2021年の不動産取引価格・成約価格情報（XIT001）を全国47都道府県単位で取得・高速バルクインサート
// 既に取得済みの (Year, 都道府県コード) は自動スキップして安全に再開可能

import mysql from 'mysql2/promise';

const API_KEY = '44a91c0c5f5d4b9e8b4bf5eac106249e';
const BASE_URL = 'https://www.reinfolib.mlit.go.jp/ex-api/external';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PREFECTURES = [
    { id: '01', name: '北海道' }, { id: '02', name: '青森県' }, { id: '03', name: '岩手県' },
    { id: '04', name: '宮城県' }, { id: '05', name: '秋田県' }, { id: '06', name: '山形県' },
    { id: '07', name: '福島県' }, { id: '08', name: '茨城県' }, { id: '09', name: '栃木県' },
    { id: '10', name: '群馬県' }, { id: '11', name: '埼玉県' }, { id: '12', name: '千葉県' },
    { id: '13', name: '東京都' }, { id: '14', name: '神奈川県' }, { id: '15', name: '新潟県' },
    { id: '16', name: '富山県' }, { id: '17', name: '石川県' }, { id: '18', name: '福井県' },
    { id: '19', name: '山梨県' }, { id: '20', name: '長野県' }, { id: '21', name: '岐阜県' },
    { id: '22', name: '静岡県' }, { id: '23', name: '愛知県' }, { id: '24', name: '三重県' },
    { id: '25', name: '滋賀県' }, { id: '26', name: '京都府' }, { id: '27', name: '大阪府' },
    { id: '28', name: '兵庫県' }, { id: '29', name: '奈良県' }, { id: '30', name: '和歌山県' },
    { id: '31', name: '鳥取県' }, { id: '32', name: '島根県' }, { id: '33', name: '岡山県' },
    { id: '34', name: '広島県' }, { id: '35', name: '山口県' }, { id: '36', name: '徳島県' },
    { id: '37', name: '香川県' }, { id: '38', name: '愛媛県' }, { id: '39', name: '高知県' },
    { id: '40', name: '福岡県' }, { id: '41', name: '佐賀県' }, { id: '42', name: '長崎県' },
    { id: '43', name: '熊本県' }, { id: '44', name: '大分県' }, { id: '45', name: '宮崎県' },
    { id: '46', name: '鹿児島県' }, { id: '47', name: '沖縄県' },
];

// 2005年〜2021年（直近の2021年から順に遡って取得）
const TARGET_YEARS = [];
for (let y = 2021; y >= 2005; y--) {
    TARGET_YEARS.push(String(y));
}

const CHUNK_SIZE = 1000;
const CONCURRENCY = 3;

async function fetchWithRetry(url, retries = 4) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
            });
            if (!res.ok) {
                if (res.status === 404) return { data: [] };
                throw new Error(`HTTP ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            if (i === retries - 1) throw e;
            const waitMs = 2000 * (i + 1);
            console.log(`  リトライ中 (${i + 1}/${retries}, ${waitMs}ms待機): ${e.message}`);
            await delay(waitMs);
        }
    }
}

async function bulkInsertTransactions(pool, rows) {
    if (!rows || rows.length === 0) return;

    const query = `
        INSERT INTO transactions (
            \`Year\`, Type, Region, MunicipalityCode, Prefecture, Municipality,
            DistrictName, TradePrice, PricePerUnit, FloorPlan,
            Area, UnitPrice, LandShape, Frontage, TotalFloorArea,
            BuildingYear, Structure, \`Use\`, Purpose, Direction,
            Classification, Breadth, CityPlanning, CoverageRatio, FloorAreaRatio,
            Period, Renovation, Remarks, PriceCategory, DistrictCode
        ) VALUES ?
    `;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        await pool.query(query, [chunk]);
    }
}

async function main() {
    console.log('=== 不動産取引価格・成約価格情報 (2005年〜2021年) インポート開始 ===');
    const startTime = Date.now();

    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'realestate_db',
        waitForConnections: true,
        connectionLimit: 6,
    });

    // 既に登録されている (Year, Prefecture) の件数を事前確認して重複登録を防止
    const [existingRows] = await pool.query(`
        SELECT \`Year\`, SUBSTRING(LPAD(MunicipalityCode, 5, '0'), 1, 2) AS prefId, COUNT(*) AS cnt
        FROM transactions
        WHERE \`Year\` BETWEEN '2005' AND '2021'
        GROUP BY \`Year\`, prefId
    `);
    const existingSet = new Set(
        existingRows.filter((r) => Number(r.cnt) > 0).map((r) => `${r.Year}:${r.prefId}`)
    );

    let totalInserted = 0;

    for (const year of TARGET_YEARS) {
        console.log(`\n================= ${year}年 データの取得開始 =================`);
        let yearInserted = 0;

        for (let i = 0; i < PREFECTURES.length; i += CONCURRENCY) {
            const batch = PREFECTURES.slice(i, i + CONCURRENCY);
            await Promise.all(
                batch.map(async (pref, bIdx) => {
                    const idx = i + bIdx;
                    const key = `${year}:${pref.id}`;
                    if (existingSet.has(key)) {
                        console.log(`[${idx + 1}/47] ${pref.name} (${year}年): 取得済みのためスキップ`);
                        return;
                    }

                    const url = `${BASE_URL}/XIT001?year=${year}&area=${pref.id}`;
                    try {
                        const data = await fetchWithRetry(url);
                        const items = data?.data || [];

                        if (items.length > 0) {
                            const rows = items.map((item) => [
                                year,
                                item.Type || null,
                                item.Region || null,
                                item.MunicipalityCode || null,
                                item.Prefecture || pref.name,
                                item.Municipality || null,
                                item.DistrictName || null,
                                item.TradePrice || null,
                                item.PricePerUnit || null,
                                item.FloorPlan || null,
                                item.Area || null,
                                item.UnitPrice || null,
                                item.LandShape || null,
                                item.Frontage || null,
                                item.TotalFloorArea || null,
                                item.BuildingYear || null,
                                item.Structure || null,
                                item.Use || null,
                                item.Purpose || null,
                                item.Direction || null,
                                item.Classification || null,
                                item.Breadth || null,
                                item.CityPlanning || null,
                                item.CoverageRatio || null,
                                item.FloorAreaRatio || null,
                                item.Period || null,
                                item.Renovation || null,
                                item.Remarks || null,
                                item.PriceCategory || null,
                                item.DistrictCode || null,
                            ]);

                            await bulkInsertTransactions(pool, rows);
                            totalInserted += rows.length;
                            yearInserted += rows.length;
                            console.log(
                                `[${idx + 1}/47] ${pref.name} (${year}年): ${rows.length.toLocaleString()} 件 保存完了 (累計: ${totalInserted.toLocaleString()} 件)`
                            );
                        } else {
                            console.log(`[${idx + 1}/47] ${pref.name} (${year}年): データなし (0件)`);
                        }
                    } catch (err) {
                        console.error(`❌ エラー [${pref.name} ${year}年]:`, err.message);
                    }
                })
            );
            await delay(250);
        }
        console.log(`--- ${year}年 完了: +${yearInserted.toLocaleString()} 件 ---`);
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ 2005年〜2021年 全日程完了！ 総インポート件数: ${totalInserted.toLocaleString()} 件 (所要時間: ${elapsed} 秒)`);

    await pool.end();
}

main().catch(console.error);
