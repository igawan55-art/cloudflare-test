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
        // 多摩市連光寺の各丁目（132240022, 13224002201...）のデータを取得
        const codes = ['132240022', '13224002201', '13224002202', '13224002203', '13224002204', '13224002205', '13224002206'];
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${appId}&statsDataId=8003006724&cdArea=${codes.join(',')}`;
        const res = await fetchJson(url);
        console.log('Status:', res.GET_STATS_DATA?.RESULT?.STATUS);
        const values = res.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
        console.log('Values count:', values.length);
        values.forEach(v => {
            if (v['@cat01'] === '0010' || v['@cat01'] === '0040') {
                console.log(`area: ${v['@area']}, ${v['@cat01'] === '0010' ? '人口' : '世帯'}: ${v['$']} ${v['@unit']}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
})();
