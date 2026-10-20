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
        // statsDataId=8003006724 (東京都小地域)
        // cdArea 指定なし、lvArea=3, limit=20 でどうなるか？
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${appId}&statsDataId=8003006724&lvArea=3&limit=20`;
        const res = await fetchJson(url);
        console.log('Status:', res.GET_STATS_DATA?.RESULT?.STATUS);
        console.log('Total number in table:', res.GET_STATS_DATA?.STATISTICAL_DATA?.TABLE_INF?.TOTAL_NUMBER);
        const values = res.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
        console.log('Values count with lvArea=3:', values.length);
        values.slice(0, 5).forEach(v => console.log(JSON.stringify(v)));
    } catch (e) {
        console.error(e);
    }
})();
