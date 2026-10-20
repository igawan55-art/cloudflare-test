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
        // limit=100000 で東京都の全町字の人口・世帯総数を取得！
        console.log('Fetching all Tokyo districts with lvArea=3...');
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${appId}&statsDataId=8003006724&lvArea=3&limit=100000`;
        const res = await fetchJson(url);
        console.log('Status:', res.GET_STATS_DATA?.RESULT?.STATUS);
        const values = res.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
        console.log('Total values fetched in 1 request:', values.length);
        
        // 多摩市連光寺 (132240022) が含まれているか確認！
        const renkojiValues = values.filter(v => v['@area'] === '132240022');
        console.log('Renkoji values in response:', renkojiValues);
    } catch (e) {
        console.error(e);
    }
})();
