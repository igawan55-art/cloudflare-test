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
        // e-Stat APIの getStatsList で、小地域集計の統計表を探す
        // searchWord に「男女別人口」や「小地域」を指定
        // または、統計名「国勢調査」かつ「町丁」
        const query = encodeURIComponent('国勢調査 町丁 男女別人口 東京都');
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=${appId}&searchWord=${query}&limit=20`;
        const res = await fetchJson(url);
        console.log('Status:', res.GET_STATS_LIST?.RESULT?.STATUS);
        console.log('Number:', res.GET_STATS_LIST?.DATALIST_INF?.NUMBER);
        const tables = res.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF;
        if (Array.isArray(tables)) {
            tables.forEach(t => {
                console.log(`ID: ${t['@id']} | STAT: ${t.STAT_NAME?.['$']} | TITLE: ${t.TITLE?.['$']}`);
            });
        }
    } catch (e) {
        console.error(e);
    }
})();
