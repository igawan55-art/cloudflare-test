import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = '44a91c0c5f5d4b9e8b4bf5eac106249e';
const BASE_URL = 'https://www.reinfolib.mlit.go.jp/ex-api/external';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PREFECTURES = [
    { id: '13', name: '東京都' },
    // デモ用として東京都のみ指定。本番では47都道府県の配列にします。
];

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'Ocp-Apim-Subscription-Key': API_KEY }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            if (i === retries - 1) throw e;
            console.log(`Retrying... (${i + 1}/${retries})`);
            await delay(2000);
        }
    }
}

async function main() {
    console.log('国土交通省APIからデータを取得します...');
    const dataDir = path.join(__dirname, '../src/data');
    await fs.mkdir(dataDir, { recursive: true });

    // 都道府県JSONの保存
    await fs.writeFile(path.join(dataDir, 'prefectures.json'), JSON.stringify(PREFECTURES, null, 2));

    let allCities = [];
    let allStations = {}; // cityCode -> stations[]

    // 市区町村一覧の取得 (XIT002)
    for (const pref of PREFECTURES) {
        console.log(`[XIT002] ${pref.name} の市区町村を取得中...`);
        const cityData = await fetchWithRetry(`${BASE_URL}/XIT002?area=${pref.id}`);
        if (cityData && cityData.data) {
            allCities.push(...cityData.data.map(c => ({ ...c, prefId: pref.id, prefName: pref.name })));
        }
        await delay(1000); // 連続リクエストによるRate Limitを避ける
    }

    await fs.writeFile(path.join(dataDir, 'cities.json'), JSON.stringify(allCities, null, 2));
    console.log(`  -> ${allCities.length}件の市区町村を保存しました。`);

    // 駅一覧の抽出と取引事例データの保存
    const targetCities = allCities.slice(0, 5); 
    let allTransactions = []; // 全取引データを格納
    
    for (const city of targetCities) {
        console.log(`[XIT001] ${city.name} の取引データを取得中...`);
        // 直近の1年分（2023年）を取得
        const txData = await fetchWithRetry(`${BASE_URL}/XIT001?year=2023&city=${city.id}`);
        
        const stations = new Set();
        if (txData && txData.data) {
            for (const item of txData.data) {
                // 駅名の抽出
                if (item.Station) {
                    stations.add(item.Station);
                } else if (item.DistrictName) {
                    stations.add(item.DistrictName);
                }
                
                // 取引事例リスト用データの加工（不要な重いデータを削る）
                allTransactions.push({
                    cityId: city.id,
                    type: item.Type || '-',
                    station: item.Station || item.DistrictName || '-',
                    price: item.TradePrice ? parseInt(item.TradePrice) : 0,
                    area: item.Area || '-',
                    floorPlan: item.FloorPlan || '-',
                    buildingYear: item.BuildingYear || '-',
                    period: item.Period || '-'
                });
            }
        }
        
        allStations[city.id] = Array.from(stations).map(name => ({ name }));
        await delay(1500);
    }

    await fs.writeFile(path.join(dataDir, 'stations.json'), JSON.stringify(allStations, null, 2));
    await fs.writeFile(path.join(dataDir, 'transactions.json'), JSON.stringify(allTransactions, null, 2));
    console.log(`  -> 対象${targetCities.length}区の駅名データと取引事例を保存しました。`);

    console.log('✅ データの取得・保存が完了しました！(src/data/)');
}

main().catch(console.error);
