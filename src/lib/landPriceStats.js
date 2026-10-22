// src/lib/landPriceStats.js
// 地価公示（Official Price）、基準地価（Standard Land Price）、路線価（Rosenka）の集計ヘルパー
// 市区町村単位のインメモリキャッシュおよび Cloudflare エッジスナップショットに対応

import ssrCoreData from '../data/ssrCoreData.json';

const TSUBO = 3.30578;
const toNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

const cityRawCache = new Map();
const computedBaseCache = new Map();

function computeAvgCapRate(rows) {
    let capSum = 0;
    let capCnt = 0;
    for (const r of rows) {
        const c = toNum(r.CapRate);
        if (c != null && c > 0) {
            capSum += c;
            capCnt++;
        }
    }
    return capCnt > 0 ? capSum / capCnt : null;
}

async function getCityAppraisalRows(db, municipalityCode) {
    const muniCode = String(municipalityCode || '').padStart(5, '0');
    if (cityRawCache.has(muniCode)) {
        return cityRawCache.get(muniCode);
    }

    const promise = (async () => {
        if (!db?.isEdgeSnapshot) {
            const [rows] = await db.query(
                `SELECT Year, Address, Division, OfficialPrice, FluctuationRate, Area, BuildingCoverageRatio, FloorAreaRatio, CapRate
                 FROM appraisals
                 WHERE MunicipalityCode = ?`,
                [muniCode]
            );
            if (rows && rows.length > 0) {
                return { rows, avgCapRate: computeAvgCapRate(rows) };
            }
        }

        // エッジスナップショットからのフォールバック（東京都全59市区町村は2026年全地点収録済み）
        const tokyoCity = ssrCoreData?.tokyoCities?.[muniCode];
        if (tokyoCity?.apprRows && tokyoCity.apprRows.length > 0) {
            return { rows: tokyoCity.apprRows, avgCapRate: computeAvgCapRate(tokyoCity.apprRows) };
        }

        const prefCode = muniCode.slice(0, 2);
        const prefSnap = ssrCoreData?.prefs?.[prefCode];
        const fallbackRows = (prefSnap?.topAppraisals || []).map((t) => ({
            Year: '2026',
            Address: t.Address,
            Division: t.Division || '住宅地',
            OfficialPrice: t.OfficialPrice,
            FluctuationRate: t.FluctuationRate,
            Area: null,
            BuildingCoverageRatio: null,
            FloorAreaRatio: null,
            CapRate: null,
        }));
        return { rows: fallbackRows, avgCapRate: null };
    })();

    cityRawCache.set(muniCode, promise);
    return promise;
}

function buildBaseLandPriceStats(rawRows, avgCapRate, districtName) {
    let filtered = rawRows;
    let isDistrictSpecific = false;

    if (districtName) {
        const distMatches = rawRows.filter((r) => r.Address && String(r.Address).includes(districtName));
        if (distMatches.length > 0) {
            filtered = distMatches;
            isDistrictSpecific = true;
        }
    }

    let latestYear = '2026';
    if (filtered.length > 0) {
        let maxY = '';
        for (const r of filtered) {
            const y = String(r.Year || '');
            if (y > maxY) maxY = y;
        }
        if (maxY) latestYear = maxY;
    }

    const yearRows = filtered.filter((r) => String(r.Year || '') === latestYear);

    // 1標準地点あたり複数鑑定士の評価書が含まれるため、(Address, Division) 単位で平均集約
    const pointMap = new Map();
    for (const r of yearRows) {
        const addr = r.Address || '';
        const div = r.Division || '住宅地';
        const key = `${addr}|||${div}`;
        let p = pointMap.get(key);
        if (!p) {
            p = {
                Address: addr,
                Division: r.Division,
                priceSum: 0, priceCnt: 0,
                flucSum: 0, flucCnt: 0,
                Area: null,
                BuildingCoverageRatio: null,
                FloorAreaRatio: null,
            };
            pointMap.set(key, p);
        }
        const op = toNum(r.OfficialPrice);
        if (op != null) {
            p.priceSum += op;
            p.priceCnt++;
        }
        const fl = toNum(r.FluctuationRate);
        if (fl != null) {
            p.flucSum += fl;
            p.flucCnt++;
        }
        const ar = toNum(r.Area);
        if (ar != null && (p.Area == null || ar > p.Area)) p.Area = ar;
        const bcr = toNum(r.BuildingCoverageRatio);
        if (bcr != null && (p.BuildingCoverageRatio == null || bcr > p.BuildingCoverageRatio)) p.BuildingCoverageRatio = bcr;
        const far = toNum(r.FloorAreaRatio);
        if (far != null && (p.FloorAreaRatio == null || far > p.FloorAreaRatio)) p.FloorAreaRatio = far;
    }

    const dedupPoints = [];
    for (const p of pointMap.values()) {
        dedupPoints.push({
            Address: p.Address,
            Division: p.Division,
            OfficialPrice: p.priceCnt > 0 ? p.priceSum / p.priceCnt : null,
            FluctuationRate: p.flucCnt > 0 ? p.flucSum / p.flucCnt : null,
            Area: p.Area,
            BuildingCoverageRatio: p.BuildingCoverageRatio,
            FloorAreaRatio: p.FloorAreaRatio,
        });
    }

    // Division ごと & 全体の集計
    const divMap = new Map();
    let totalCnt = 0;
    let totalPriceSum = 0, totalPriceCnt = 0;
    let totalFlucSum = 0, totalFlucCnt = 0;

    for (const dp of dedupPoints) {
        totalCnt++;
        if (dp.OfficialPrice != null) {
            totalPriceSum += dp.OfficialPrice;
            totalPriceCnt++;
        }
        if (dp.FluctuationRate != null) {
            totalFlucSum += dp.FluctuationRate;
            totalFlucCnt++;
        }

        const divKey = dp.Division;
        if (divKey != null) {
            let d = divMap.get(divKey);
            if (!d) {
                d = { Division: divKey, cnt: 0, priceSum: 0, priceCnt: 0, flucSum: 0, flucCnt: 0 };
                divMap.set(divKey, d);
            }
            d.cnt++;
            if (dp.OfficialPrice != null) {
                d.priceSum += dp.OfficialPrice;
                d.priceCnt++;
            }
            if (dp.FluctuationRate != null) {
                d.flucSum += dp.FluctuationRate;
                d.flucCnt++;
            }
        }
    }

    const divSummaries = [...divMap.values()].map((d) => ({
        Division: d.Division,
        cnt: d.cnt,
        avgOfficial: d.priceCnt > 0 ? d.priceSum / d.priceCnt : null,
        avgFluctuation: d.flucCnt > 0 ? d.flucSum / d.flucCnt : null,
    }));

    const overall = totalCnt > 0 ? {
        cnt: totalCnt,
        avgOfficial: totalPriceCnt > 0 ? totalPriceSum / totalPriceCnt : null,
        avgFluctuation: totalFlucCnt > 0 ? totalFlucSum / totalFlucCnt : null,
    } : null;

    const res = divSummaries.find((r) => r.Division === '住宅地') || null;
    const com = divSummaries.find((r) => r.Division === '商業地') || null;

    const divisions = divSummaries
        .filter((r) => r.Division !== null && Number(r.cnt) > 0 && r.avgOfficial != null)
        .map((r) => {
            const offPrice = Math.round(Number(r.avgOfficial));
            const offTsubo = Math.round(offPrice * TSUBO);
            const fluc = toNum(r.avgFluctuation);
            const rosPrice = Math.round(offPrice * 0.8);
            const rosTsubo = Math.round(rosPrice * TSUBO);
            const stdPrice = Math.round(offPrice * (1 + (fluc || 0) / 200));
            const stdTsubo = Math.round(stdPrice * TSUBO);
            return {
                name: r.Division,
                count: Number(r.cnt),
                officialPrice: offPrice,
                officialTsubo: offTsubo,
                rosenkaPrice: rosPrice,
                rosenkaTsubo: rosTsubo,
                standardPrice: stdPrice,
                standardTsubo: stdTsubo,
                fluctuationRate: fluc,
                realMarketEstimateTsubo: Math.round((rosPrice / 0.8) * 1.15 * TSUBO),
            };
        })
        .sort((a, b) => b.count - a.count);

    const count = overall ? Number(overall.cnt) : 0;
    const hasData = count > 0 && overall.avgOfficial != null;
    const avgOfficial = hasData ? Number(overall.avgOfficial) : null;
    const avgFluctuation = hasData && overall.avgFluctuation != null ? Number(overall.avgFluctuation) : null;

    let maxPoint = null;
    let minPoint = null;
    let points = [];

    if (hasData) {
        const sortedPoints = [...dedupPoints].sort((a, b) => (Number(b.OfficialPrice) || 0) - (Number(a.OfficialPrice) || 0));
        if (sortedPoints.length > 0) {
            maxPoint = sortedPoints[0];
            const nonZero = sortedPoints.filter((r) => Number(r.OfficialPrice) > 0);
            minPoint = nonZero.length > 0 ? nonZero[nonZero.length - 1] : sortedPoints[sortedPoints.length - 1];
        }

        points = sortedPoints.slice(0, 50).map((r, i) => {
            const price = Number(r.OfficialPrice) || 0;
            const rosenka = Math.round(price * 0.8);
            const standard = Math.round(price * (1 + (toNum(r.FluctuationRate) || 0) / 200));
            return {
                rank: i + 1,
                address: r.Address,
                division: r.Division || '住宅地',
                officialPrice: price,
                officialTsubo: Math.round(price * TSUBO),
                rosenkaPrice: rosenka,
                rosenkaTsubo: Math.round(rosenka * TSUBO),
                standardPrice: standard,
                standardTsubo: Math.round(standard * TSUBO),
                fluctuationRate: toNum(r.FluctuationRate),
                area: toNum(r.Area),
                bcr: toNum(r.BuildingCoverageRatio),
                far: toNum(r.FloorAreaRatio),
            };
        });
    }

    const officialBase = {
        hasData,
        year: latestYear,
        count,
        avgPrice: avgOfficial,
        avgTsubo: avgOfficial ? Math.round(avgOfficial * TSUBO) : null,
        avgFluctuation,
        divisions: divisions.map((d) => ({
            name: d.name,
            count: d.count,
            avgPrice: d.officialPrice,
            avgTsubo: d.officialTsubo,
            fluctuationRate: d.fluctuationRate,
        })),
        res: res && res.avgOfficial ? {
            avgPrice: Number(res.avgOfficial),
            avgTsubo: Math.round(Number(res.avgOfficial) * TSUBO),
            avgFluctuation: toNum(res.avgFluctuation),
            count: Number(res.cnt),
        } : null,
        com: com && com.avgOfficial ? {
            avgPrice: Number(com.avgOfficial),
            avgTsubo: Math.round(Number(com.avgOfficial) * TSUBO),
            avgFluctuation: toNum(com.avgFluctuation),
            count: Number(com.cnt),
        } : null,
        maxPoint: maxPoint ? {
            address: maxPoint.Address,
            division: maxPoint.Division,
            price: Number(maxPoint.OfficialPrice),
            tsubo: Math.round(Number(maxPoint.OfficialPrice) * TSUBO),
            fluctuation: toNum(maxPoint.FluctuationRate)
        } : null,
        minPoint: minPoint ? {
            address: minPoint.Address,
            division: minPoint.Division,
            price: Number(minPoint.OfficialPrice),
            tsubo: Math.round(Number(minPoint.OfficialPrice) * TSUBO),
            fluctuation: toNum(minPoint.FluctuationRate)
        } : null,
    };

    const standardHalfRate = avgFluctuation != null ? avgFluctuation / 2 : 0;
    const avgStandard = avgOfficial ? Math.round(avgOfficial * (1 + standardHalfRate / 100)) : null;
    const standard = {
        hasData,
        year: latestYear,
        count,
        avgPrice: avgStandard,
        avgTsubo: avgStandard ? Math.round(avgStandard * TSUBO) : null,
        trendRate: avgFluctuation,
        divisions: divisions.map((d) => ({
            name: d.name,
            count: d.count,
            avgPrice: d.standardPrice,
            avgTsubo: d.standardTsubo,
            fluctuationRate: d.fluctuationRate,
        })),
        res: officialBase.res ? {
            avgPrice: Math.round(officialBase.res.avgPrice * (1 + (officialBase.res.avgFluctuation || 0) / 200)),
            avgTsubo: Math.round(officialBase.res.avgTsubo * (1 + (officialBase.res.avgFluctuation || 0) / 200)),
            count: officialBase.res.count
        } : null,
        com: officialBase.com ? {
            avgPrice: Math.round(officialBase.com.avgPrice * (1 + (officialBase.com.avgFluctuation || 0) / 200)),
            avgTsubo: Math.round(officialBase.com.avgTsubo * (1 + (officialBase.com.avgFluctuation || 0) / 200)),
            count: officialBase.com.count
        } : null,
    };

    const avgRosenka = avgOfficial ? Math.round(avgOfficial * 0.8) : null;
    const rosenka = {
        hasData,
        year: latestYear,
        count,
        avgPrice: avgRosenka,
        avgTsubo: avgRosenka ? Math.round(avgRosenka * TSUBO) : null,
        ratio: 80,
        realMarketEstimateSqm: avgRosenka ? Math.round((avgRosenka / 0.8) * 1.15) : null,
        realMarketEstimateTsubo: avgRosenka ? Math.round((avgRosenka / 0.8) * 1.15 * TSUBO) : null,
        divisions: divisions.map((d) => ({
            name: d.name,
            count: d.count,
            avgPrice: d.rosenkaPrice,
            avgTsubo: d.rosenkaTsubo,
            officialPrice: d.officialPrice,
            fluctuationRate: d.fluctuationRate,
            realMarketEstimateTsubo: d.realMarketEstimateTsubo,
        })),
        res: res && res.avgOfficial ? {
            avgPrice: Math.round(Number(res.avgOfficial) * 0.8),
            avgTsubo: Math.round(Number(res.avgOfficial) * 0.8 * TSUBO),
            count: Number(res.cnt),
        } : null,
        com: com && com.avgOfficial ? {
            avgPrice: Math.round(Number(com.avgOfficial) * 0.8),
            avgTsubo: Math.round(Number(com.avgOfficial) * 0.8 * TSUBO),
            count: Number(com.cnt),
        } : null,
        simulations: avgRosenka ? [
            { label: '約30坪（100㎡）', area: 100, tsubo: 30.2, price: Math.round(avgRosenka * 100) },
            { label: '約50坪（165㎡）', area: 165, tsubo: 49.9, price: Math.round(avgRosenka * 165) },
            { label: '約70坪（230㎡）', area: 230, tsubo: 69.6, price: Math.round(avgRosenka * 230) },
        ] : [],
    };

    return {
        year: latestYear,
        isDistrictSpecific,
        avgCapRate,
        divisions,
        points,
        officialBase,
        standard,
        rosenka,
    };
}

/**
 * @param {import('mysql2/promise').Pool} db
 * @param {{ municipalityCode: string, districtName?: string, realLandAvgSqm?: number }} opts
 */
export async function getLandPriceStats(db, { municipalityCode, districtName = null, realLandAvgSqm = null } = {}) {
    const baseKey = `${municipalityCode}|${districtName || ''}`;
    let base = computedBaseCache.get(baseKey);
    if (!base) {
        const { rows, avgCapRate } = await getCityAppraisalRows(db, municipalityCode);
        base = buildBaseLandPriceStats(rows, avgCapRate, districtName);
        computedBaseCache.set(baseKey, base);
    }

    const avgOfficial = base.officialBase.avgPrice;
    const divergence = realLandAvgSqm && avgOfficial ? ((realLandAvgSqm / avgOfficial) - 1) * 100 : null;

    return {
        year: base.year,
        isDistrictSpecific: base.isDistrictSpecific,
        avgCapRate: base.avgCapRate,
        divisions: base.divisions,
        points: base.points,
        official: {
            ...base.officialBase,
            divergence,
        },
        standard: base.standard,
        rosenka: base.rosenka,
    };
}
