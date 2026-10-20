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
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${appId}&statsDataId=8003006792`;
    const res = await fetchJson(url);
    const cat01 = res.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ?.find(c => c['@id'] === 'cat01');
    cat01?.CLASS?.forEach(cl => console.log(`code: ${cl['@code']}, name: ${cl['@name']}`));
})();
