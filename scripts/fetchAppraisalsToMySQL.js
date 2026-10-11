import fs from 'fs/promises';
import mysql from 'mysql2/promise';

const API_KEY = '44a91c0c5f5d4b9e8b4bf5eac106249e';
const BASE_URL = 'https://www.reinfolib.mlit.go.jp/ex-api/external';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PREFECTURES = [
    { id: '13', name: '東京都' }
    // 本番稼働時は全47都道府県を追加
];

const TARGET_YEARS = ['2023'];
const DIVISIONS = [
    { code: '00', name: '住宅地' },
    { code: '05', name: '商業地' }
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
