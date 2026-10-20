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
        // statsDataId=8003006724 (男女別人口総数及び世帯総数 東京都)
        // cdArea=132240021 (多摩市連光寺)
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${appId}&statsDataId=8003006724&cdArea=132240021`;
        const res = await fetchJson(url);
        console.log('Status:', res.GET_STATS_DATA?.RESULT?.STATUS);
        const values = res.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
        const classObj = res.GET_STATS_DATA?.STATISTICAL_DATA?.CLASS_INF?.CLASS_OBJ || [];
        console.log('Values count:', values.length);
        values.forEach(v => {
            console.log(`cat01: ${v['@cat01']}, area: ${v['@area']}, unit: ${v['@unit']}, val: ${v['$']}`);
        });
        classObj.forEach(c => {
            console.log(`Class ${c['@id']} (${c['@name']}):`);
            if (Array.isArray(c.CLASS)) {
                c.CLASS.forEach(cl => console.log(`  code: ${cl['@code']}, name: ${cl['@name']}`));
            }
        });
    } catch (e) {
        console.error(e);
    }
})();
