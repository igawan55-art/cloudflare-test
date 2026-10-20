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
        // getMetaInfo で statsDataId=8003006724 の area クラスを確認
        const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${appId}&statsDataId=8003006724`;
        const res = await fetchJson(url);
        const classObjs = res.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ || [];
        const areaObj = classObjs.find(c => c['@id'] === 'area');
        console.log('Total areas in metadata:', areaObj?.CLASS?.length);
        
        // 多摩市（13224）または連光寺を含むものを探す
        const renkojiAreas = (areaObj?.CLASS || []).filter(a => {
            const name = a['@name'] || '';
            const code = a['@code'] || '';
            return name.includes('連光寺') || code.startsWith('13224');
        });
        
        console.log('Renkoji / Tama areas count:', renkojiAreas.length);
        renkojiAreas.slice(0, 15).forEach(a => {
            console.log(`code: ${a['@code']}, level: ${a['@level']}, name: ${a['@name']}`);
        });
    } catch (e) {
        console.error(e);
    }
})();
