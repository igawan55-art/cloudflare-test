import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = '44a91c0c5f5d4b9e8b4bf5eac106249e';
const BASE_URL = 'https://www.reinfolib.mlit.go.jp/ex-api/external';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    { id: '46', name: '鹿児島県' }, { id: '47', name: '沖縄県' }
];

// 取得したい年を配列で指定（過去の分も一気に取得可能）
const TARGET_YEARS = ['2023'];

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'Ocp-Apim-Subscription-Key': API_KEY }
            });
            if (!res.ok) {
                // 404は国土交通省APIの仕様で「検索結果0件」を表すため、エラーではなく空データとして安全にスキップ
                if (res.status === 404) {
                    return { data: [] };
                }
                throw new Error(`HTTP ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            if (i === retries - 1) throw e;
            console.log(`Retrying... (${i + 1}/${retries})`);
            await delay(2000);
        }
    }
}

async function main() {
    console.log('国土交通省APIからMySQLへのデータ蓄積を開始します...');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'realestate_db'
    });

    let allCities = [];

    // 市区町村一覧の取得
    for (const pref of PREFECTURES) {
        console.log(`[XIT002] ${pref.name} の市区町村を取得中...`);
        const cityData = await fetchWithRetry(`${BASE_URL}/XIT002?area=${pref.id}`);
        if (cityData && cityData.data) {
            allCities.push(...cityData.data.map(c => ({ ...c, prefId: pref.id, prefName: pref.name })));
        }
        await delay(1000); // API制限対策の待機
    }

    // 【本番用】全国すべての市区町村を対象にする
    const targetCities = allCities; 
    
    // ----------------------------
    
    for (const city of targetCities) {
        for (const year of TARGET_YEARS) {
            console.log(`[XIT001] ${city.prefName} ${city.name} の取引データ（${year}年）を取得中...`);
            const txData = await fetchWithRetry(`${BASE_URL}/XIT001?year=${year}&city=${city.id}`);
        
        if (txData && txData.data) {
            console.log(`  -> ${txData.data.length}件のデータをMySQLに保存します...`);
            
            // トランザクションを開始して一括挿入
            await connection.beginTransaction();
            
            try {
                for (const item of txData.data) {
                    const query = `
                        INSERT INTO transactions (
                            \`Year\`, Type, Region, MunicipalityCode, Prefecture, Municipality,
                            DistrictName, TradePrice, PricePerUnit, FloorPlan,
                            Area, UnitPrice, LandShape, Frontage, TotalFloorArea,
                            BuildingYear, Structure, \`Use\`, Purpose, Direction,
                            Classification, Breadth, CityPlanning, CoverageRatio, FloorAreaRatio,
                            Period, Renovation, Remarks, PriceCategory, DistrictCode
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    const values = [
                        year,
                        item.Type || null,
                        item.Region || null,
                        item.MunicipalityCode || null,
                        item.Prefecture || null,
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
                        item.DistrictCode || null
                    ];
                    
                    await connection.execute(query, values);
                }
                await connection.commit();
            } catch (error) {
                await connection.rollback();
                console.error("  ❌ データベース挿入エラー:", error);
            }
        }
        
        await delay(1500); 
        } // year loop
    } // city loop

    console.log('✅ MySQLへのデータの取得・保存が完了しました！');
    await connection.end();
}

main().catch(console.error);
