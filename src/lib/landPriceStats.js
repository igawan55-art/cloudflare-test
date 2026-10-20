// src/lib/landPriceStats.js
// 地価公示（Official Price）、基準地価（Standard Land Price）、路線価（Rosenka）の集計ヘルパー

const TSUBO = 3.30578;
const toNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

/**
 * @param {import('mysql2/promise').Pool} db
 * @param {{ municipalityCode: string, districtName?: string, realLandAvgSqm?: number }} opts
 */
export async function getLandPriceStats(db, { municipalityCode, districtName = null, realLandAvgSqm = null } = {}) {
    let whereClause = 'MunicipalityCode = ?';
    let params = [municipalityCode];
    let isDistrictSpecific = false;

    if (districtName) {
        const [distCheck] = await db.query(
            `SELECT COUNT(*) AS cnt FROM appraisals WHERE MunicipalityCode = ? AND Address LIKE CONCAT('%', ?, '%')`,
            [municipalityCode, districtName]
        );
        if (distCheck[0]?.cnt > 0) {
            whereClause += ` AND Address LIKE CONCAT('%', ?, '%')`;
            params.push(districtName);
            isDistrictSpecific = true;
        }
    }

    // 最新年度を取得して集計対象を最新年に絞り込み
    const [yearRow] = await db.query(
        `SELECT MAX(Year) AS latestYear FROM appraisals WHERE ${whereClause}`,
        params
    );
    const latestYear = yearRow[0]?.latestYear || '2026';
    whereClause += ' AND Year = ?';
    params.push(latestYear);

    // 全体および用途区分（住宅地・商業地・工業地・宅地見込地など）の集計
    // 鑑定評価書情報(XCT001)は1標準地点あたり2名の鑑定士の評価書が含まれるため、
    // まず (Address, Division) 単位で平均集約してユニークな地点（標準地）ごとに集計する
    const [summaryRows] = await db.query(`
        SELECT Division,
               AVG(OfficialPrice) AS avgOfficial,
               AVG(FluctuationRate) AS avgFluctuation,
               COUNT(*) AS cnt
        FROM (
            SELECT Address, Division,
                   AVG(OfficialPrice) AS OfficialPrice,
                   AVG(FluctuationRate) AS FluctuationRate
            FROM appraisals
            WHERE ${whereClause}
            GROUP BY Address, Division
        ) dedup_points
        GROUP BY Division WITH ROLLUP
    `, params);

    const overall = summaryRows.find((r) => r.Division === null) || null;
    const res = summaryRows.find((r) => r.Division === '住宅地') || null;
    const com = summaryRows.find((r) => r.Division === '商業地') || null;

    // 用途区分別の集計一覧（地点数順）
    const divisions = summaryRows
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

    // 最高・最低地点および地点一覧（最大50地点）
    let maxPoint = null;
    let minPoint = null;
    let points = [];
    if (hasData) {
        const [pRows] = await db.query(`
            SELECT Address, Division,
                   AVG(OfficialPrice) AS OfficialPrice,
                   AVG(FluctuationRate) AS FluctuationRate,
                   MAX(Area) AS Area,
                   MAX(BuildingCoverageRatio) AS BuildingCoverageRatio,
                   MAX(FloorAreaRatio) AS FloorAreaRatio
            FROM appraisals
            WHERE ${whereClause}
            GROUP BY Address, Division
            ORDER BY OfficialPrice DESC
        `, params);

        if (pRows.length > 0) {
            maxPoint = pRows[0];
            const nonZero = pRows.filter((r) => Number(r.OfficialPrice) > 0);
            minPoint = nonZero.length > 0 ? nonZero[nonZero.length - 1] : pRows[pRows.length - 1];
        }

        points = pRows.slice(0, 50).map((r, i) => {
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

    // 1. 公示価格データ
    const official = {
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
        divergence: realLandAvgSqm && avgOfficial ? ((realLandAvgSqm / avgOfficial) - 1) * 100 : null,
    };

    // 2. 基準地価データ (都道府県地価調査: 7月1日基準)
    // 地価公示(1月1日)に対し、年変動率の半分を反映した推計基準地価
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
        res: official.res ? {
            avgPrice: Math.round(official.res.avgPrice * (1 + (official.res.avgFluctuation || 0) / 200)),
            avgTsubo: Math.round(official.res.avgTsubo * (1 + (official.res.avgFluctuation || 0) / 200)),
            count: official.res.count
        } : null,
        com: official.com ? {
            avgPrice: Math.round(official.com.avgPrice * (1 + (official.com.avgFluctuation || 0) / 200)),
            avgTsubo: Math.round(official.com.avgTsubo * (1 + (official.com.avgFluctuation || 0) / 200)),
            count: official.com.count
        } : null,
    };

    // 3. 路線価データ (国税庁 相続税路線価: 公示地価の約80%)
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
        divisions,
        points,
        official,
        standard,
        rosenka,
    };
}
