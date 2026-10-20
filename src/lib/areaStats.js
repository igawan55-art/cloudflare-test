// src/lib/areaStats.js
// エリア（全国 / 市区町村 / 地区）単位で、物件種別ごとの相場サマリー・四半期推移・直近取引事例を集計する共通ヘルパー

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

/**
 * @param {import('mysql2/promise').Pool} db
 * @param {{ municipalityCode?: string, districtCode?: string, rowLimit?: number }} opts
 */
export async function getAreaStats(db, { municipalityCode = null, districtCode = null, rowLimit = 300 } = {}) {
    const cacheKey = `${municipalityCode}|${districtCode}|${rowLimit}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const where = [`Type IN (${Object.values(TYPE_MAP).map(() => '?').join(',')})`];
    const params = [...Object.values(TYPE_MAP)];
    if (municipalityCode) { where.push('MunicipalityCode = ?'); params.push(municipalityCode); }
    if (districtCode) { where.push('DistrictCode = ?'); params.push(districtCode); }
    const w = `WHERE ${where.join(' AND ')}`;

    const aggCols = `
        COUNT(*) AS cnt,
        AVG(CASE WHEN ${PRICE} > 0 THEN ${PRICE} END) AS avgPrice,
        AVG(CASE WHEN ${PRICE} > 0 AND ${AREA} > 0 THEN ${PRICE} / ${AREA} END) AS avgSqm,
        AVG(CASE WHEN ${AREA} > 0 THEN ${AREA} END) AS avgArea`;

    const [summaryRows] = await db.query(`SELECT Type, ${aggCols} FROM transactions ${w} GROUP BY Type`, params);
    const [quarterRows] = await db.query(`SELECT Type, Period, ${aggCols} FROM transactions ${w} GROUP BY Type, Period ORDER BY Period ASC`, params);

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

    // 直近の取引事例（種別ごと）
    for (const [key, typeName] of Object.entries(TYPE_MAP)) {
        const rowParams = [typeName];
        const rowWhere = ['Type = ?'];
        if (municipalityCode) { rowWhere.push('MunicipalityCode = ?'); rowParams.push(municipalityCode); }
        if (districtCode) { rowWhere.push('DistrictCode = ?'); rowParams.push(districtCode); }
        const [rows] = await db.query(`
            SELECT Prefecture, Municipality, MunicipalityCode, DistrictName, DistrictCode, Period,
                   TradePrice, Area, TotalFloorArea, BuildingYear, Structure, FloorPlan
            FROM transactions
            WHERE ${rowWhere.join(' AND ')}
            ORDER BY Period DESC, id DESC
            LIMIT ?
        `, [...rowParams, rowLimit]);

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
    }

    const result = { types };
    cache.set(cacheKey, result);
    return result;
}

/** 取引件数の多い市区町村（トップページのクイックリンク用） */
export async function getCityIndex(db) {
    if (cache.has('cityIndex')) return cache.get('cityIndex');
    const [rows] = await db.query(`
        SELECT MunicipalityCode, MAX(Prefecture) AS Prefecture, MAX(Municipality) AS Municipality, COUNT(*) AS cnt
        FROM transactions
        WHERE MunicipalityCode IS NOT NULL AND MunicipalityCode != ''
        GROUP BY MunicipalityCode
        ORDER BY MunicipalityCode ASC
    `);
    const cities = rows.map((r) => {
        const code = String(r.MunicipalityCode).padStart(5, '0');
        return { code, pref: `pref${code.slice(0, 2)}`, prefName: r.Prefecture, name: r.Municipality, count: Number(r.cnt) };
    });
    cache.set('cityIndex', cities);
    return cities;
}

/** 指定市区町村内の町名・地区一覧を取得 */
export async function getDistrictsByCity(db, municipalityCode) {
    const cacheKey = `districts:${municipalityCode}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const [rows] = await db.query(`
        SELECT DistrictCode, MAX(DistrictName) AS DistrictName, COUNT(*) AS cnt
        FROM transactions
        WHERE MunicipalityCode = ?
          AND DistrictName IS NOT NULL AND DistrictName != '-'
          AND DistrictCode IS NOT NULL AND DistrictCode != '0'
        GROUP BY DistrictCode
        ORDER BY DistrictCode ASC
    `, [municipalityCode]);
    const list = rows.map((r) => ({
        code: String(r.DistrictCode).padStart(9, '0'),
        name: r.DistrictName,
        count: Number(r.cnt),
    }));
    cache.set(cacheKey, list);
    return list;
}

