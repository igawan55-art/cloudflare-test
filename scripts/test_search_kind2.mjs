import https from 'https';

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

(async () => {
    try {
        // searchKind=2 で小地域データを検索！
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=${appId}&searchKind=2&statsCode=00200521&surveyYears=2020&searchWord=${encodeURIComponent('東京都')}&limit=10`;
        const res = await fetchJson(url);
        console.log('Status:', res.GET_STATS_LIST?.RESULT?.STATUS);
        console.log('Number:', res.GET_STATS_LIST?.DATALIST_INF?.NUMBER);
        const tables = res.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF;
        if (Array.isArray(tables)) {
            tables.forEach(t => {
                console.log(`ID: ${t['@id']} | TITLE: ${t.TITLE?.['$']}`);
            });
        }
    } catch (e) {
        console.error(e);
    }
})();
