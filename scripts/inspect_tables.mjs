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
    // 1. 年齢表: 8003006792
    // 2. 住宅所有: 8003006918
    // 3. 建て方: 8003006978
    const tables = ['8003006792', '8003006918', '8003006978'];
    for (const tId of tables) {
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${appId}&statsDataId=${tId}&cdArea=132240022`;
        const res = await fetchJson(url);
        console.log(`\n=== Table: ${tId} ===`);
        console.log('Status:', res.GET_STATS_DATA?.RESULT?.STATUS);
        const classObj = res.GET_STATS_DATA?.STATISTICAL_DATA?.CLASS_INF?.CLASS_OBJ || [];
        classObj.forEach(c => {
            console.log(`Class ${c['@id']} (${c['@name']}):`);
            if (Array.isArray(c.CLASS)) {
                c.CLASS.slice(0, 10).forEach(cl => console.log(`  code: ${cl['@code']}, name: ${cl['@name']}`));
            }
        });
        const values = res.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
        console.log('Sample values:');
        values.slice(0, 6).forEach(v => console.log(JSON.stringify(v)));
    }
})();
