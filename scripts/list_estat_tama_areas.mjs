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
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${appId}&statsDataId=8003006724`;
        const res = await fetchJson(url);
        const classObjs = res.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ || [];
        const areaObj = classObjs.find(c => c['@id'] === 'area');
        
        const tamaAreas = (areaObj?.CLASS || []).filter(a => {
            const code = a['@code'] || '';
            return code.startsWith('13224');
        });
        
        console.log('Tama all areas in e-Stat metadata:', tamaAreas.length);
        tamaAreas.forEach(a => {
            if (a['@level'] === '2' || a['@level'] === '3') {
                console.log(`code: ${a['@code']}, level: ${a['@level']}, name: ${a['@name']}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
})();
