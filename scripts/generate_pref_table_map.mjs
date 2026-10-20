import https from 'https';
import fs from 'fs';

const appId = 'b6e7b14f7f37ba3f4b2b2195565e1c7f1a30f016';

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

const PREF_NAMES = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

(async () => {
    try {
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=${appId}&searchKind=2&statsCode=00200521&surveyYears=2020&limit=1000`;
        const res = await fetchJson(url);
        const tables = res.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
        
        const prefMap = {};

        for (let i = 0; i < PREF_NAMES.length; i++) {
            const prefName = PREF_NAMES[i];
            const prefCode = String(i + 1).padStart(2, '0');

            const prefTables = tables.filter(t => (t.TITLE?.['$'] || '').includes(prefName));

            const popTable = prefTables.find(t => (t.TITLE?.['$'] || '').startsWith('男女別人口総数及び世帯総数'));
            const ageTable = prefTables.find(t => (t.TITLE?.['$'] || '').startsWith('年齢（５歳階級、４区分）別'));
            const ownTable = prefTables.find(t => (t.TITLE?.['$'] || '').startsWith('住宅の所有の関係別一般世帯数'));
            const typeTable = prefTables.find(t => (t.TITLE?.['$'] || '').startsWith('住宅の建て方別世帯数'));

            prefMap[prefCode] = {
                prefCode,
                prefName,
                popTableId: popTable ? popTable['@id'] : null,
                ageTableId: ageTable ? ageTable['@id'] : null,
                ownTableId: ownTable ? ownTable['@id'] : null,
                typeTableId: typeTable ? typeTable['@id'] : null
            };
        }

        fs.writeFileSync('./scripts/pref_table_map.json', JSON.stringify(prefMap, null, 2), 'utf-8');
        console.log('Successfully generated pref_table_map.json for 47 prefectures.');
        
        // 欠損がないかチェック
        let missing = 0;
        for (const [code, info] of Object.entries(prefMap)) {
            if (!info.popTableId || !info.ageTableId || !info.ownTableId || !info.typeTableId) {
                console.warn(`Missing table in ${info.prefName} (${code}):`, info);
                missing++;
            }
        }
        console.log(`Missing count: ${missing}`);
    } catch (e) {
        console.error(e);
    }
})();
