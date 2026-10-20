import fs from 'fs/promises';
import mysql from 'mysql2/promise';

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

const TARGET_YEARS = ['2022'];
const DIVISIONS = [
    { code: '00', name: '住宅地' },
    { code: '03', name: '宅地見込地' },
    { code: '05', name: '商業地' },
    { code: '07', name: '準工業地' },
    { code: '09', name: '工業地' },
    { code: '10', name: '調整区域内宅地' },
    { code: '13', name: '現況林地' },
    { code: '20', name: '林地（都道府県地価調査）' }
];

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'Ocp-Apim-Subscription-Key': API_KEY }
            });
            if (!res.ok) {
                if (res.status === 404) return { data: [] }; // データなし
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
    console.log('鑑定評価書情報API (XCT001) のデータ取得・蓄積を開始します...');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'realestate_db'
    });

    for (const pref of PREFECTURES) {
        for (const year of TARGET_YEARS) {
            for (const div of DIVISIONS) {
                console.log(`[XCT001] ${pref.name} - ${year}年 - ${div.name}の鑑定データを取得中...`);
                
                const url = `${BASE_URL}/XCT001?year=${year}&area=${pref.id}&division=${div.code}`;
                const data = await fetchWithRetry(url);
                
                if (data && data.data && data.data.length > 0) {
                    console.log(`  -> ${data.data.length}件のデータを保存します...`);
                    
                    await connection.beginTransaction();
                    try {
                        for (const item of data.data) {
                            const query = `
                                INSERT INTO appraisals (
                                    \`Year\`, Prefecture, MunicipalityCode, Division,
                                    PricePerSqm, Address, Area, Shape, CurrentUse,
                                    BuildingCoverageRatio, FloorAreaRatio, OfficialPrice,
                                    FluctuationRate, CapRate, NetIncome, Latitude, Longitude
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `;
                            
                            // 値のパース処理（空文字は null にする）
                            const parseNum = (val) => val === "" || val == null ? null : Number(val);
                            
                            const values = [
                                item['価格時点'] || year,
                                pref.name,
                                item['標準地番号 市区町村コード 市区町村コード'] ? `${pref.id}${item['標準地番号 市区町村コード 市区町村コード']}` : null,
                                div.name,
                                parseNum(item['1㎡当たりの価格']),
                                item['標準地 所在地 住居表示'] || item['標準地 所在地 所在地番'] || null,
                                parseNum(item['標準地 地積 地積']),
                                item['標準地 形状 形状'] || null,
                                item['標準地 土地利用の現況 現況'] || null,
                                parseNum(item['標準地 法令上の規制等 指定建ぺい率']),
                                parseNum(item['標準地 法令上の規制等 指定容積率']),
                                parseNum(item['公示価格']),
                                parseNum(item['変動率']),
                                parseNum(item['収益価格算定内訳還元利回り']),
                                parseNum(item['収益価格算定内訳純収益']),
                                parseNum(item['位置座標 緯度']),
                                parseNum(item['位置座標 経度'])
                            ];
                            
                            await connection.execute(query, values);
                        }
                        await connection.commit();
                    } catch (error) {
                        await connection.rollback();
                        console.error("  ❌ データベース挿入エラー:", error);
                    }
                } else {
                    console.log(`  -> データがありませんでした。`);
                }
                
                await delay(1500); // サーバー負荷対策
            }
        }
    }

    console.log('✅ 鑑定評価書データの取得・保存が完了しました！');
    await connection.end();
}

main().catch(console.error);
