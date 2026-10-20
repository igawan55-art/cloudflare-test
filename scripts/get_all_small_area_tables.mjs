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
        // limit 1000
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=${appId}&searchKind=2&statsCode=00200521&surveyYears=2020&limit=1000`;
        const res = await fetchJson(url);
        const tables = res.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
        console.log('Total small area tables found:', tables.length);
        
        // 最初の10件
        tables.slice(0, 10).forEach(t => {
            console.log(`ID: ${t['@id']} | TITLE: ${t.TITLE?.['$']}`);
        });
    } catch (e) {
        console.error(e);
    }
})();
