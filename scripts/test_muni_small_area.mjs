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
        // cdArea=13224 (多摩市) のみでどう返ってくるか？
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${appId}&statsDataId=8003006724&cdArea=13224`;
        const res = await fetchJson(url);
        console.log('Status:', res.GET_STATS_DATA?.RESULT?.STATUS);
        const values = res.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
        console.log('Values count with cdArea=13224:', values.length);
        values.forEach(v => console.log(JSON.stringify(v)));
    } catch (e) {
        console.error(e);
    }
})();
