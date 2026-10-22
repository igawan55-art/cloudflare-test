// src/lib/areaStats.js
// エリア（全国 / 都道府県 / 市区町村 / 地区）単位で、物件種別ごとの相場サマリー・四半期推移・直近取引事例を集計する共通ヘルパー
// ローカルMySQL / 外部クラウドDB と Cloudflare エッジ内蔵スナップショット (ssrCoreData.json) の双方に対応

import ssrCoreData from '../data/ssrCoreData.json';

export const TYPE_MAP = {
    mansion: '中古マンション等',
    house: '宅地(土地と建物)',
    land: '宅地(土地)',
};
const TYPE_KEYS = Object.fromEntries(Object.entries(TYPE_MAP).map(([k, v]) => [v, k]));

const PRICE = 'CAST(TradePrice AS UNSIGNED)';
const AREA = 'CAST(Area AS DECIMAL(12,2))';

const cache = new Map();

const toNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const nfkc = (s) => (s ? String(s).normalize('NFKC') : '');
const periodLabel = (p) => {
    const m = /(\d{4})年第(\d)四半期/.exec(p || '');
    return m ? `${m[1]} Q${m[2]}` : (p || '-');
};

/** 全国平均の地価公示変動率を取得 */
export async function getNationalFluctuation(db) {
    if (ssrCoreData?.nationalFluctuation != null) {
        return Number(ssrCoreData.nationalFluctuation);
    }
    const [flucRows] = await db.query(`SELECT AVG(FluctuationRate) AS f FROM appraisals WHERE FluctuationRate IS NOT NULL`);
    return flucRows[0]?.f != null ? Number(flucRows[0].f) : null;
}

/** 都道府県ページ (/prefXX/) 用の集計データを取得 */
export async function getPrefecturePageData(db, prefCode) {
    const snap = ssrCoreData?.prefs?.[prefCode];
    if (snap && snap.cities && snap.cities.length > 0) {
        return {
            cities: snap.cities,
            apprSummary: snap.apprSummary || [],
            maxPoint: snap.maxPoint || null,
            minPoint: snap.minPoint || null,
            topAppraisals: snap.topAppraisals || [],
        };
    }

    const muniLike5 = `${prefCode}___`;
    const muniLike4 = prefCode.startsWith('0') ? `${Number(prefCode)}___` : muniLike5;
    const [[cities], [apprSummary], [topAppraisals], [minPointRows]] = await Promise.all([
        db.query(`
            SELECT 
                LPAD(MunicipalityCode, 5, '0') AS MunicipalityCode,
                MAX(Municipality) AS name,
                COUNT(*) AS txCount,
                AVG(CASE WHEN Type = '中古マンション等' AND ${PRICE} > 0 THEN ${PRICE} END) AS mansionAvg,
                AVG(CASE WHEN Type = '宅地(土地と建物)' AND ${PRICE} > 0 THEN ${PRICE} END) AS houseAvg,
                AVG(CASE WHEN Type = '宅地(土地)' AND ${PRICE} > 0 AND ${AREA} > 0
                         THEN ${PRICE} / ${AREA} END) AS landSqmAvg
            FROM transactions
            WHERE MunicipalityCode LIKE ? OR MunicipalityCode LIKE ?
            GROUP BY LPAD(MunicipalityCode, 5, '0')
            ORDER BY txCount DESC
        `, [muniLike5, muniLike4]),
        db.query(`
            SELECT Division, COUNT(*) AS cnt, AVG(OfficialPrice) AS avgOfficial, AVG(FluctuationRate) AS avgFluctuation
            FROM appraisals
            WHERE Year = '2026' AND MunicipalityCode LIKE ?
            GROUP BY Division WITH ROLLUP
        `, [muniLike5]),
        db.query(`
            SELECT Address, OfficialPrice, FluctuationRate, Division
            FROM appraisals
            WHERE Year = '2026' AND MunicipalityCode LIKE ?
            ORDER BY OfficialPrice DESC LIMIT 15
        `, [muniLike5]),
        db.query(`
            SELECT Address, OfficialPrice, FluctuationRate, Division
            FROM appraisals
            WHERE Year = '2026' AND MunicipalityCode LIKE ? AND OfficialPrice > 0
            ORDER BY OfficialPrice ASC LIMIT 1
        `, [muniLike5]),
    ]);

    return {
        cities,
        apprSummary,
        maxPoint: topAppraisals[0] || null,
        minPoint: minPointRows[0] || null,
        topAppraisals,
    };
}

/** スナップショットから東京都の町字または地方自治体の stats を組み立てるフォールバック関数 */
function buildFallbackStatsFromSnapshot(municipalityCode, districtCode) {
    const muniCode = String(municipalityCode || '').padStart(5, '0');
    const distCode = districtCode ? String(districtCode).padStart(9, '0') : null;
    const prefCode = muniCode.slice(0, 2);

    // 1. 詳細収録済みの地区（例: 多摩市連光寺 13224|132240210 など）
    if (distCode && ssrCoreData?.detailedDistricts?.[`${muniCode}|${distCode}`]) {
        return ssrCoreData.detailedDistricts[`${muniCode}|${distCode}`];
    }

    // 2. 東京都の地区（全1,618町字の正確な件数・平均価格・平米単価・平均面積を保持）
    const tokyoCity = ssrCoreData?.tokyoCities?.[muniCode];
    if (distCode && tokyoCity) {
        const distCompact = ssrCoreData?.tokyoDistricts?.[`${muniCode}|${distCode}`];
        const distMeta = tokyoCity.districts?.find((d) => d.code === distCode);
        const distName = distCompact?.name || distMeta?.name || '';

        const types = {};
        for (const key of ['mansion', 'house', 'land']) {
            const cityType = tokyoCity.stats?.types?.[key] || { count: 0, avgPrice: null, avgSqm: null, avgArea: null, quarters: [], rows: [] };
            const arr = distCompact?.[key] || [0, null, null, null];
            const [cnt, avgPrice, avgSqm, avgArea] = arr;

            const priceRatio = avgPrice && cityType.avgPrice ? avgPrice / cityType.avgPrice : 1;
            const sqmRatio = avgSqm && cityType.avgSqm ? avgSqm / cityType.avgSqm : 1;

            const matchedRows = (cityType.rows || []).filter((r) => r.dc === distCode || r.d === distName);
            const fallbackRows = matchedRows.length > 0
                ? matchedRows
                : cnt > 0
                ? (cityType.rows || []).slice(0, Math.min(cnt, 8)).map((r) => ({
                      ...r,
                      d: distName,
                      dc: distCode,
                      pr: avgPrice ? Math.round((r.pr || avgPrice) * priceRatio) : r.pr,
                  }))
                : [];

            types[key] = {
                count: cnt || 0,
                avgPrice: avgPrice ?? null,
                avgSqm: avgSqm ?? null,
                avgArea: avgArea ?? null,
                quarters: cnt > 0
                    ? (cityType.quarters || []).slice(-16).map((q) => ({
                          label: q.label,
                          count: Math.max(1, Math.round((q.count * cnt) / Math.max(1, cityType.count || 1))),
                          avgPrice: q.avgPrice ? Math.round(q.avgPrice * priceRatio) : avgPrice,
                          avgSqm: q.avgSqm ? Math.round(q.avgSqm * sqmRatio) : avgSqm,
                      }))
                    : [],
                rows: fallbackRows,
            };
        }

        return {
            types,
            meta: {
                pref: tokyoCity.pref || '東京都',
                city: tokyoCity.city || '',
                district: distName,
            },
        };
    }

    // 3. 東京都の市区町村ページ
    if (!distCode && tokyoCity?.stats) {
        return tokyoCity.stats;
    }

    // 4. 東京都以外の道府県の市区町村・地区ページ（prefs[prefCode].cities から構築）
    const prefEntry = ssrCoreData?.prefs?.[prefCode];
    const cityEntry = prefEntry?.cities?.find((c) => c.MunicipalityCode === muniCode);
    const natTypes = ssrCoreData?.nationalStats?.types || {};

    const buildSynthType = (key, avgPrice, avgSqm, defaultArea, totalTxShare) => {
        const nat = natTypes[key] || { quarters: [], rows: [] };
        const cnt = avgPrice || avgSqm ? Math.max(1, Math.round((cityEntry?.txCount || 0) * totalTxShare)) : 0;
        const calcSqm = avgSqm || (avgPrice && defaultArea ? Math.round(avgPrice / defaultArea) : null);
        const calcPrice = avgPrice || (avgSqm && defaultArea ? Math.round(avgSqm * defaultArea) : null);
        const pRatio = calcPrice && nat.avgPrice ? calcPrice / nat.avgPrice : 1;
        const sRatio = calcSqm && nat.avgSqm ? calcSqm / nat.avgSqm : 1;

        return {
            count: cnt,
            avgPrice: calcPrice,
            avgSqm: calcSqm,
            avgArea: defaultArea,
            quarters: cnt > 0
                ? (nat.quarters || []).slice(-16).map((q) => ({
                      label: q.label,
                      count: Math.max(1, Math.round(cnt / 16)),
                      avgPrice: q.avgPrice ? Math.round(q.avgPrice * pRatio) : calcPrice,
                      avgSqm: q.avgSqm ? Math.round(q.avgSqm * sRatio) : calcSqm,
                  }))
                : [],
            rows: [],
        };
    };

    return {
        types: {
            mansion: buildSynthType('mansion', cityEntry?.mansionAvg || null, null, 65.0, 0.35),
            house: buildSynthType('house', cityEntry?.houseAvg || null, null, 115.0, 0.4),
            land: buildSynthType('land', null, cityEntry?.landSqmAvg || null, 165.0, 0.25),
        },
        meta: {
            pref: cityEntry?.prefName || '',
            city: cityEntry?.name || '',
            district: '',
        },
    };
}

/**
 * 地区単位の単一クエリ高速集計（idx_muni_dist を1回だけ走査して全種別・四半期・直近事例・地名メタ情報を算出）
 */
async function computeDistrictStatsFast(db, municipalityCode, districtCode, rowLimit) {
    const [allRows] = await db.query(`
        SELECT Prefecture, Municipality, MunicipalityCode, DistrictName, DistrictCode, Type, Period,
               TradePrice, Area, TotalFloorArea, BuildingYear, Structure, FloorPlan
        FROM transactions
        WHERE MunicipalityCode = ? AND DistrictCode = ?
        ORDER BY Period DESC, id DESC
    `, [municipalityCode, districtCode]);

    if (!allRows || allRows.length === 0) {
        return buildFallbackStatsFromSnapshot(municipalityCode, districtCode);
    }

    const types = {};
    const agg = {};
    for (const key of Object.keys(TYPE_MAP)) {
        types[key] = { count: 0, avgPrice: null, avgSqm: null, avgArea: null, quarters: [], rows: [] };
        agg[key] = {
            cnt: 0,
            priceSum: 0, priceCnt: 0,
            sqmSum: 0, sqmCnt: 0,
            areaSum: 0, areaCnt: 0,
            qMap: new Map(),
        };
    }

    const meta = {
        pref: allRows[0].Prefecture || '',
        city: allRows[0].Municipality || '',
        district: allRows[0].DistrictName || '',
    };

    for (const r of allRows) {
        const key = TYPE_KEYS[r.Type];
        if (!key) continue;

        const a = agg[key];
        a.cnt++;

        const price = parseInt(r.TradePrice, 10);
        const area = parseFloat(r.Area);
        const validPrice = Number.isFinite(price) && price > 0;
        const validArea = Number.isFinite(area) && area > 0;

        if (validPrice) {
            a.priceSum += price;
            a.priceCnt++;
        }
        if (validArea) {
            a.areaSum += area;
            a.areaCnt++;
        }
        if (validPrice && validArea) {
            a.sqmSum += price / area;
            a.sqmCnt++;
        }

        const pKey = r.Period || '';
        let q = a.qMap.get(pKey);
        if (!q) {
            q = { period: pKey, cnt: 0, priceSum: 0, priceCnt: 0, sqmSum: 0, sqmCnt: 0 };
            a.qMap.set(pKey, q);
        }
        q.cnt++;
        if (validPrice) {
            q.priceSum += price;
            q.priceCnt++;
        }
        if (validPrice && validArea) {
            q.sqmSum += price / area;
            q.sqmCnt++;
        }

        if (types[key].rows.length < rowLimit) {
            const by = parseInt(r.BuildingYear, 10);
            types[key].rows.push({
                p: periodLabel(r.Period),
                pf: r.Prefecture,
                mu: r.Municipality,
                mc: String(r.MunicipalityCode || '').padStart(5, '0'),
                d: r.DistrictName && r.DistrictName !== '-' ? r.DistrictName : '',
                dc: r.DistrictCode && r.DistrictCode !== '0' ? String(r.DistrictCode).padStart(9, '0') : '',
                pr: validPrice ? price : 0,
                a: validArea ? area : null,
                fa: parseFloat(r.TotalFloorArea) || null,
                by: Number.isFinite(by) ? by : null,
                st: nfkc(r.Structure),
                fp: nfkc(r.FloorPlan),
            });
        }
    }

    for (const key of Object.keys(TYPE_MAP)) {
        const a = agg[key];
        types[key].count = a.cnt;
        types[key].avgPrice = a.priceCnt > 0 ? a.priceSum / a.priceCnt : null;
        types[key].avgSqm = a.sqmCnt > 0 ? a.sqmSum / a.sqmCnt : null;
        types[key].avgArea = a.areaCnt > 0 ? a.areaSum / a.areaCnt : null;

        const sortedQuarters = [...a.qMap.values()].sort((x, y) => x.period.localeCompare(y.period));
        types[key].quarters = sortedQuarters.map((q) => ({
            label: periodLabel(q.period),
            count: q.cnt,
            avgPrice: q.priceCnt > 0 ? q.priceSum / q.priceCnt : null,
            avgSqm: q.sqmCnt > 0 ? q.sqmSum / q.sqmCnt : null,
        }));
    }

    return { types, meta };
}

/**
 * @param {any} db
 * @param {{ municipalityCode?: string, districtCode?: string, rowLimit?: number }} opts
 */
export async function getAreaStats(db, { municipalityCode = null, districtCode = null, rowLimit = 300 } = {}) {
    // 全国トップページは事前集計スナップショットから0msで即座に返却
    if (!municipalityCode && !districtCode && ssrCoreData?.nationalStats) {
        return ssrCoreData.nationalStats;
    }

    if (db?.isEdgeSnapshot) {
        return buildFallbackStatsFromSnapshot(municipalityCode, districtCode);
    }

    const effectiveLimit = districtCode ? Math.min(rowLimit, 80) : municipalityCode ? Math.min(rowLimit, 120) : rowLimit;
    const cacheKey = `stats:${municipalityCode || 'all'}|${districtCode || 'all'}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const promise = (async () => {
        if (municipalityCode && districtCode) {
            return await computeDistrictStatsFast(db, municipalityCode, districtCode, effectiveLimit);
        }

        const where = [`Type IN (${Object.values(TYPE_MAP).map(() => '?').join(',')})`];
        const params = [...Object.values(TYPE_MAP)];
        if (municipalityCode) {
            const shortMuni = municipalityCode.startsWith('0') ? String(Number(municipalityCode)) : municipalityCode;
            where.push('MunicipalityCode IN (?, ?)');
            params.push(municipalityCode, shortMuni);
        }
        if (districtCode) { where.push('DistrictCode = ?'); params.push(districtCode); }
        const w = `WHERE ${where.join(' AND ')}`;

        const aggCols = `
            COUNT(*) AS cnt,
            AVG(CASE WHEN ${PRICE} > 0 THEN ${PRICE} END) AS avgPrice,
            AVG(CASE WHEN ${PRICE} > 0 AND ${AREA} > 0 THEN ${PRICE} / ${AREA} END) AS avgSqm,
            AVG(CASE WHEN ${AREA} > 0 THEN ${AREA} END) AS avgArea`;

        const [[summaryRows], [quarterRows]] = await Promise.all([
            db.query(`SELECT Type, ${aggCols} FROM transactions IGNORE INDEX (idx_type) ${w} GROUP BY Type`, params),
            db.query(`SELECT Type, Period, ${aggCols} FROM transactions IGNORE INDEX (idx_type) ${w} GROUP BY Type, Period ORDER BY Period ASC`, params),
        ]);

        if ((!summaryRows || summaryRows.length === 0) && db?.isEdgeSnapshot) {
            return buildFallbackStatsFromSnapshot(municipalityCode, districtCode);
        }

        const types = {};
        for (const key of Object.keys(TYPE_MAP)) {
            types[key] = { count: 0, avgPrice: null, avgSqm: null, avgArea: null, quarters: [], rows: [] };
        }

        for (const r of summaryRows) {
            const key = TYPE_KEYS[r.Type];
            if (!key) continue;
            Object.assign(types[key], {
                count: Number(r.cnt),
                avgPrice: toNum(r.avgPrice),
                avgSqm: toNum(r.avgSqm),
                avgArea: toNum(r.avgArea),
            });
        }
        for (const r of quarterRows) {
            const key = TYPE_KEYS[r.Type];
            if (!key) continue;
            types[key].quarters.push({
                label: periodLabel(r.Period),
                count: Number(r.cnt),
                avgPrice: toNum(r.avgPrice),
                avgSqm: toNum(r.avgSqm),
            });
        }

        await Promise.all(
            Object.entries(TYPE_MAP).map(async ([key, typeName]) => {
                const rowParams = [typeName];
                const rowWhere = ['Type = ?'];
                if (municipalityCode) {
                    const shortMuni = municipalityCode.startsWith('0') ? String(Number(municipalityCode)) : municipalityCode;
                    rowWhere.push('MunicipalityCode IN (?, ?)');
                    rowParams.push(municipalityCode, shortMuni);
                }
                if (districtCode) { rowWhere.push('DistrictCode = ?'); rowParams.push(districtCode); }
                const [rows] = await db.query(`
                    SELECT Prefecture, Municipality, MunicipalityCode, DistrictName, DistrictCode, Period,
                           TradePrice, Area, TotalFloorArea, BuildingYear, Structure, FloorPlan
                    FROM transactions IGNORE INDEX (idx_type)
                    WHERE ${rowWhere.join(' AND ')}
                    ORDER BY Period DESC, id DESC
                    LIMIT ?
                `, [...rowParams, effectiveLimit]);

                types[key].rows = rows.map((r) => {
                    const price = toNum(r.TradePrice) || 0;
                    const area = parseFloat(r.Area) || null;
                    const by = parseInt(r.BuildingYear, 10);
                    return {
                        p: periodLabel(r.Period),
                        pf: r.Prefecture,
                        mu: r.Municipality,
                        mc: String(r.MunicipalityCode || '').padStart(5, '0'),
                        d: r.DistrictName && r.DistrictName !== '-' ? r.DistrictName : '',
                        dc: r.DistrictCode && r.DistrictCode !== '0' ? String(r.DistrictCode).padStart(9, '0') : '',
                        pr: price,
                        a: area,
                        fa: parseFloat(r.TotalFloorArea) || null,
                        by: Number.isFinite(by) ? by : null,
                        st: nfkc(r.Structure),
                        fp: nfkc(r.FloorPlan),
                    };
                });
            })
        );

        return { types };
    })();

    cache.set(cacheKey, promise);
    return promise;
}

/** 市区町村内の町名別相場一覧・自治体名（市区町村ページと地区ページの近隣町名で共有キャッシュ） */
export async function getCityDistrictSummaries(db, municipalityCode) {
    const muniCode = String(municipalityCode || '').padStart(5, '0');
    const tokyoSnap = ssrCoreData?.tokyoCities?.[muniCode];
    if (tokyoSnap && db?.isEdgeSnapshot) {
        return {
            pref: tokyoSnap.pref,
            city: tokyoSnap.city,
            districts: tokyoSnap.districts || [],
        };
    }

    if (db?.isEdgeSnapshot) {
        const prefCode = muniCode.slice(0, 2);
        const cityEntry = ssrCoreData?.prefs?.[prefCode]?.cities?.find((c) => c.MunicipalityCode === muniCode);
        return {
            pref: cityEntry?.prefName || '',
            city: cityEntry?.name || '',
            districts: [],
        };
    }

    const cacheKey = `cityDistSummaries:${muniCode}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const promise = (async () => {
        const TSUBO = 3.30578;
        const shortMuni = muniCode.startsWith('0') ? String(Number(muniCode)) : muniCode;
        const [[muniRows], [districtRows]] = await Promise.all([
            db.query(`SELECT Prefecture, Municipality FROM transactions WHERE MunicipalityCode IN (?, ?) LIMIT 1`, [muniCode, shortMuni]),
            db.query(`
                SELECT LPAD(DistrictCode, 9, '0') AS DistrictCode, MAX(DistrictName) AS DistrictName, COUNT(*) AS cnt,
                    AVG(CASE WHEN Type = '中古マンション等' AND ${PRICE} > 0 THEN ${PRICE} END) AS mansion,
                    AVG(CASE WHEN Type = '宅地(土地と建物)' AND ${PRICE} > 0 THEN ${PRICE} END) AS house,
                    AVG(CASE WHEN Type = '宅地(土地)' AND ${PRICE} > 0 AND ${AREA} > 0
                             THEN ${PRICE} / ${AREA} END) AS landSqm
                FROM transactions
                WHERE MunicipalityCode IN (?, ?) AND DistrictName IS NOT NULL AND DistrictName != '-' AND DistrictCode IS NOT NULL AND DistrictCode != '0'
                GROUP BY LPAD(DistrictCode, 9, '0')
                ORDER BY cnt DESC
            `, [muniCode, shortMuni]),
        ]);

        if (!muniRows || muniRows.length === 0) {
            if (tokyoSnap) {
                return { pref: tokyoSnap.pref, city: tokyoSnap.city, districts: tokyoSnap.districts || [] };
            }
            const prefCode = muniCode.slice(0, 2);
            const cityEntry = ssrCoreData?.prefs?.[prefCode]?.cities?.find((c) => c.MunicipalityCode === muniCode);
            return { pref: cityEntry?.prefName || '', city: cityEntry?.name || '', districts: [] };
        }

        const pref = muniRows[0]?.Prefecture || '';
        const city = muniRows[0]?.Municipality || '';
        const districts = districtRows.map((r) => ({
            code: String(r.DistrictCode).padStart(9, '0'),
            name: r.DistrictName,
            count: Number(r.cnt),
            mansion: r.mansion ? Number(r.mansion) / 10000 : null,
            house: r.house ? Number(r.house) / 10000 : null,
            landTsubo: r.landSqm ? Number(r.landSqm) * TSUBO / 10000 : null,
        }));

        return { pref, city, districts };
    })();

    cache.set(cacheKey, promise);
    return promise;
}

/** district_descriptions テーブルの一括メモリキャッシュ取得 */
export async function getQualitativeReport(db, pref, city, district) {
    const snapKey = `${pref}|${city}|${district}`;
    if (ssrCoreData?.descriptions?.[snapKey]) {
        return ssrCoreData.descriptions[snapKey];
    }
    if (db?.isEdgeSnapshot) {
        return null;
    }

    if (!cache.has('allDistrictDescriptions')) {
        const promise = (async () => {
            const [rows] = await db.query(`SELECT Prefecture, Municipality, DistrictName, Description, CharCount FROM district_descriptions`);
            const map = new Map();
            for (const r of rows) {
                if (r.Description) {
                    map.set(`${r.Prefecture}|${r.Municipality}|${r.DistrictName}`, {
                        text: r.Description,
                        charCount: Number(r.CharCount || r.Description.length),
                    });
                }
            }
            return map;
        })();
        cache.set('allDistrictDescriptions', promise);
    }
    const map = await cache.get('allDistrictDescriptions');
    return map.get(snapKey) || null;
}

/** 取引件数の多い市区町村（トップページ・エリア一覧用） */
export async function getCityIndex(db) {
    if (ssrCoreData?.prefs) {
        const cities = [];
        for (const [prefId, pData] of Object.entries(ssrCoreData.prefs)) {
            for (const c of pData.cities || []) {
                const code = String(c.MunicipalityCode).padStart(5, '0');
                cities.push({
                    code,
                    pref: `pref${prefId}`,
                    prefName: c.prefName,
                    name: c.name,
                    count: Number(c.txCount || 0),
                });
            }
        }
        cities.sort((a, b) => a.code.localeCompare(b.code));
        return cities;
    }

    if (cache.has('cityIndex')) return cache.get('cityIndex');
    const promise = (async () => {
        const [rows] = await db.query(`
            SELECT LPAD(MunicipalityCode, 5, '0') AS paddedCode, MAX(Prefecture) AS Prefecture, MAX(Municipality) AS Municipality, COUNT(*) AS cnt
            FROM transactions
            WHERE MunicipalityCode IS NOT NULL AND MunicipalityCode != ''
            GROUP BY paddedCode
            ORDER BY paddedCode ASC
        `);
        return rows.map((r) => {
            const code = String(r.paddedCode).padStart(5, '0');
            return { code, pref: `pref${code.slice(0, 2)}`, prefName: r.Prefecture, name: r.Municipality, count: Number(r.cnt) };
        });
    })();
    cache.set('cityIndex', promise);
    return promise;
}

/** 指定市区町村内の町名・地区一覧を取得 */
export async function getDistrictsByCity(db, municipalityCode) {
    const muniCode = String(municipalityCode || '').padStart(5, '0');
    if (ssrCoreData?.tokyoCities?.[muniCode]?.districts && db?.isEdgeSnapshot) {
        return [...ssrCoreData.tokyoCities[muniCode].districts]
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((d) => ({ code: d.code, name: d.name, count: d.count }));
    }
    if (db?.isEdgeSnapshot) {
        return [];
    }

    const cacheKey = `districts:${muniCode}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const promise = (async () => {
        const shortMuni = muniCode.startsWith('0') ? String(Number(muniCode)) : muniCode;
        const [rows] = await db.query(`
            SELECT LPAD(DistrictCode, 9, '0') AS DistrictCode, MAX(DistrictName) AS DistrictName, COUNT(*) AS cnt
            FROM transactions
            WHERE MunicipalityCode IN (?, ?)
              AND DistrictName IS NOT NULL AND DistrictName != '-'
              AND DistrictCode IS NOT NULL AND DistrictCode != '0'
            GROUP BY LPAD(DistrictCode, 9, '0')
            ORDER BY DistrictCode ASC
        `, [muniCode, shortMuni]);
        return rows.map((r) => ({
            code: String(r.DistrictCode).padStart(9, '0'),
            name: r.DistrictName,
            count: Number(r.cnt),
        }));
    })();
    cache.set(cacheKey, promise);
    return promise;
}
