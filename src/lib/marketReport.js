// src/lib/marketReport.js
// 市区町村ページ (/prefXX/XXXXX/[type]) および 町字ページ (/prefXX/XXXXX/XXXXXXXXX/[type]) 向けに、
// 2026年最新の地価データと実勢取引データから、各ページ種別（mansion / house / land / rosenka / official / standard）に
// 完全特化したSEO用の市場分析レポート（約600文字・3段落構成）を動的生成するモジュール

import {
    formatEraYear,
    formatJpYen,
    formatMan1,
    formatManInt,
    formatPct,
    describeFluctuationTrend,
    formatShortAddress,
} from './areaSummary.js';

const TSUBO = 3.30578;

/**
 * 取引事例配列 (rows) から築年数・面積・価格レンジ・構造・間取りの傾向を集計
 */
function analyzeTxRows(rows = [], currentYear = 2026) {
    if (!rows || rows.length === 0) {
        return {
            sampleCount: 0,
            avgAge: null,
            newRatio: 0,
            minPriceMan: null,
            maxPriceMan: null,
            topFloorPlan: null,
            topStructure: null,
            avgFloorArea: null,
        };
    }

    const prices = rows.map((r) => Number(r.pr)).filter((v) => v > 0).sort((a, b) => a - b);
    // 外れ値を除いた10%〜90%タイル（または最小・最大）
    const p10 = prices.length >= 5 ? prices[Math.floor(prices.length * 0.1)] : prices[0];
    const p90 = prices.length >= 5 ? prices[Math.floor(prices.length * 0.9)] : prices[prices.length - 1];

    const ages = rows
        .map((r) => (r.by && r.by > 1950 && r.by <= currentYear ? currentYear - r.by : null))
        .filter((v) => v !== null);
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((s, v) => s + v, 0) / ages.length) : null;
    const newCount = ages.filter((a) => a <= 5).length;
    const newRatio = ages.length > 0 ? Math.round((newCount / ages.length) * 100) : 0;

    const floorAreas = rows.map((r) => Number(r.fa)).filter((v) => v > 0);
    const avgFloorArea =
        floorAreas.length > 0 ? Math.round(floorAreas.reduce((s, v) => s + v, 0) / floorAreas.length) : null;

    // 最頻出の間取り・構造
    const countMap = (arr) => {
        const m = new Map();
        for (const item of arr) {
            if (!item) continue;
            m.set(item, (m.get(item) || 0) + 1);
        }
        let best = null;
        let max = 0;
        for (const [k, v] of m.entries()) {
            if (v > max) {
                max = v;
                best = k;
            }
        }
        return best;
    };

    const topFloorPlan = countMap(rows.map((r) => r.fp));
    const topStructure = countMap(rows.map((r) => r.st));

    return {
        sampleCount: rows.length,
        avgAge,
        newRatio,
        minPriceMan: p10 ? Math.round(p10 / 10000) : null,
        maxPriceMan: p90 ? Math.round(p90 / 10000) : null,
        topFloorPlan,
        topStructure,
        avgFloorArea,
    };
}

/**
 * 四半期推移 (quarters) から直近と過去の価格変化率を算出
 */
function analyzeQuarterTrend(quarters = []) {
    const valid = (quarters || []).filter((q) => q.avgSqm && q.avgSqm > 0);
    if (valid.length < 4) return null;
    const recentSlice = valid.slice(-2);
    const oldSlice = valid.slice(0, 2);
    const recentAvg = recentSlice.reduce((s, q) => s + q.avgSqm, 0) / recentSlice.length;
    const oldAvg = oldSlice.reduce((s, q) => s + q.avgSqm, 0) / oldSlice.length;
    if (!oldAvg) return null;
    return {
        firstLabel: valid[0].label,
        latestLabel: valid[valid.length - 1].label,
        changePct: ((recentAvg / oldAvg - 1) * 100),
    };
}

/**
 * 種別特化型の市場分析レポート（約600文字）を生成
 * @param {{
 *   pref: string,
 *   city: string,
 *   district?: string,
 *   currentType: 'mansion' | 'house' | 'land' | 'rosenka' | 'official' | 'standard',
 *   stats: any,
 *   landPrices: any,
 *   fluctuation?: number | null
 * }} opts
 */
export function generateMarketReport({
    pref = '',
    city = '',
    district = '',
    currentType = 'mansion',
    stats = null,
    landPrices = null,
    fluctuation = null,
}) {
    const areaName = district || city;
    const fullAreaName = `${pref}${city}${district}`;
    const lp = landPrices || {};
    const off = lp.official || {};
    const std = lp.standard || {};
    const ros = lp.rosenka || {};
    const points = lp.points || [];
    const yearNum = Number(lp.year || ros.year || off.year || 2026);
    const yearStr = formatEraYear(yearNum);
    const isDistrictFallback = Boolean(district && lp.isDistrictSpecific === false);
    const scopeLabel = isDistrictFallback ? `${fullAreaName}（${city}基準）` : fullAreaName;

    const maxPt = points.length > 0 ? points[0] : null;
    const minPt = points.length > 1 ? points[points.length - 1] : maxPt;
    const shortMaxAddr = maxPt ? formatShortAddress(maxPt.address, pref, city) : '';
    const shortMinAddr = minPt ? formatShortAddress(minPt.address, pref, city) : '';

    const txTypes = stats?.types || {};
    const mansion = txTypes.mansion || { count: 0, rows: [], quarters: [] };
    const house = txTypes.house || { count: 0, rows: [], quarters: [] };
    const land = txTypes.land || { count: 0, rows: [], quarters: [] };

    let title = '';
    const paragraphs = [];

    // =========================================================================
    // 1. 路線価ページ (/rosenka) 専用レポート
    // =========================================================================
    if (currentType === 'rosenka') {
        title = `${areaName}の路線価・相続税評価 市場分析レポート（${yearNum}年最新）`;
        if (ros.hasData && ros.avgPrice) {
            const fluc = off.avgFluctuation ?? fluctuation;
            const divSummary = (ros.divisions || [])
                .map((d) => `${d.name}が平均${formatJpYen(d.avgPrice)}/㎡（坪単価約${formatMan1(d.avgTsubo)}・${d.count}地点）`)
                .join('、');

            paragraphs.push(
                `${yearStr}の最新公的データに基づく${scopeLabel}の推定平均路線価（公示地価の80%基準）は、1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）となっています。元となる地価公示価格の前年比変動率は${formatPct(fluc)}と${describeFluctuationTrend(fluc)}。用途区分別の内訳を見ると、${divSummary || `全${ros.count}地点で安定した評価水準`}となっており、国税庁が定める相続税・贈与税の財産評価基準として重要な指標となります。`
            );

            if (maxPt) {
                const minPart =
                    minPt && minPt.address !== maxPt.address
                        ? `一方、エリア内で最も抑えられた地点は『${shortMinAddr}』（${minPt.division}）の推定路線価${formatJpYen(minPt.rosenkaPrice)}/㎡（坪単価 約${formatMan1(minPt.rosenkaTsubo)}）であり、立地や前面道路の条件によって約${Math.max(1.1, (maxPt.rosenkaPrice / Math.max(1, minPt.rosenkaPrice))).toFixed(1)}倍の価格差が見られます。`
                        : `標準地の建蔽率は${maxPt.bcr || 60}%・容積率は${maxPt.far || 200}%が基準となっており、住環境と利便性を兼ね備えた評価水準です。`;

                paragraphs.push(
                    `対象エリア内の最高路線価地点は『${shortMaxAddr}』（${maxPt.division}）で、推定路線価は1㎡あたり${formatJpYen(maxPt.rosenkaPrice)}（坪単価 約${formatMan1(maxPt.rosenkaTsubo)}・元公示地価${formatJpYen(maxPt.officialPrice)}/㎡）を記録しています。${minPart}`
                );
            }

            const eval150Man = Math.round((ros.avgPrice * 150) / 10000);
            const reduced150Man = Math.round(eval150Man * 0.2);
            const realLandNote =
                land.count > 0 && land.avgSqm
                    ? `なお、${fullAreaName}における実際の土地成約データ（${land.count}件）の実勢平均は坪単価約${formatMan1(land.avgSqm * TSUBO)}であり、路線価からの理論換算値（坪単価約${formatMan1(ros.realMarketEstimateTsubo)}）と照らし合わせることで精度の高い資産把握が可能です。`
                    : `路線価を0.8で割り戻し市場流通性を加味した実勢土地売買相場は坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が目安となり、相続対策から売買査定まで幅広く活用できます。`;

            paragraphs.push(
                `相続税評価の実務においては、例えば${areaName}の平均路線価で150㎡（約45.4坪）の宅地を評価した場合、自用地評価額は約${eval150Man.toLocaleString('ja-JP')}万円となりますが、「小規模宅地等の特例（特定居住用宅地等・330㎡まで80%減額）」を適用できれば評価額は約${reduced150Man.toLocaleString('ja-JP')}万円まで大幅に圧縮されます。${realLandNote}`
            );
        } else {
            paragraphs.push(
                `${fullAreaName}における路線価（相続税路線価）は、毎年1月1日を評価基準日として国税庁が公表する土地評価の基準価格です。地価公示価格の約80%水準を目安に設定され、相続税や贈与税の申告時における土地評価額の算定基礎として用いられます。`
            );
        }
    }

    // =========================================================================
    // 2. 公示価格ページ (/official) 専用レポート
    // =========================================================================
    else if (currentType === 'official') {
        title = `${areaName}の地価公示（公示価格）市場分析レポート（${yearNum}年最新）`;
        if (off.hasData && off.avgPrice) {
            const fluc = off.avgFluctuation ?? fluctuation;
            const divSummary = (off.divisions || [])
                .map((d) => `${d.name}（${d.count}地点）が平均${formatJpYen(d.avgPrice)}/㎡・前年比${formatPct(d.fluctuationRate)}`)
                .join('、');

            paragraphs.push(
                `${yearStr}に国土交通省・土地鑑定委員会が公表した地価公示データによると、${scopeLabel}（調査対象${off.count}地点）の平均公示価格は1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}）、前年比変動率は${formatPct(fluc)}と${describeFluctuationTrend(fluc)}。用途区分別では、${divSummary}となっており、一般の土地取引における客観的な指標価格として機能しています。`
            );

            if (maxPt) {
                const minPart =
                    minPt && minPt.address !== maxPt.address
                        ? `対して最低価格地点は『${shortMinAddr}』（${minPt.division}）の${formatJpYen(minPt.officialPrice)}/㎡（坪単価 約${formatMan1(minPt.officialTsubo)}）となっており、最寄り駅からの距離や用途地域（容積率${maxPt.far || 200}%等）の違いが地価水準に反映されています。`
                        : `対象地点の地積は${maxPt.area || 150}㎡、建蔽率${maxPt.bcr || 60}%・容積率${maxPt.far || 200}%の標準的な宅地として評価されています。`;

                paragraphs.push(
                    `エリア内の最高価格地点は『${shortMaxAddr}』（${maxPt.division}）で、公示価格は1㎡あたり${formatJpYen(maxPt.officialPrice)}（坪単価 約${formatMan1(maxPt.officialTsubo)}・前年比${formatPct(maxPt.fluctuationRate)}）です。${minPart}`
                );
            }

            const divNote =
                land.count > 0 && land.avgSqm && off.divergence != null
                    ? `実際の土地取引データ（${land.count}件・平均${formatJpYen(land.avgSqm)}/㎡）と比較すると、公示地価に対する実勢価格の乖離率は${formatPct(off.divergence)}となっています。`
                    : `公示地価をベースとした実勢取引目安は坪単価約${formatMan1(ros.realMarketEstimateTsubo)}（公示価格の約1.1〜1.15倍水準）となります。`;

            paragraphs.push(
                `地価公示価格は、不動産鑑定士2名以上の鑑定評価をもとに判定される「更地としての適正な正常価格」であり、公共事業用地の取得価格算定や金融機関の担保評価、相続税路線価（公示価格の約80%・坪単価約${formatMan1(ros.avgTsubo)}）および固定資産税評価額（約70%）の基準となります。${divNote}`
            );
        }
    }

    // =========================================================================
    // 3. 基準地価ページ (/standard) 専用レポート
    // =========================================================================
    else if (currentType === 'standard') {
        title = `${areaName}の基準地価（都道府県地価調査）分析レポート（${yearNum}年最新）`;
        if (std.hasData && std.avgPrice) {
            const fluc = std.trendRate ?? off.avgFluctuation ?? fluctuation;
            const divSummary = (std.divisions || [])
                .map((d) => `${d.name}（${d.count}地点）が平均${formatJpYen(d.avgPrice)}/㎡（坪単価約${formatMan1(d.avgTsubo)}）`)
                .join('、');

            paragraphs.push(
                `${yearStr}基準における${scopeLabel}の基準地価（都道府県地価調査・7月1日基準推計）は、全用途平均で1㎡あたり${formatJpYen(std.avgPrice)}（坪単価 約${formatMan1(std.avgTsubo)}）となっています。直近の変動トレンドは年率${formatPct(fluc)}と${describeFluctuationTrend(fluc)}。用途区分別の水準は、${divSummary}となっています。`
            );

            if (maxPt) {
                const minPart =
                    minPt && minPt.address !== maxPt.address
                        ? `また、エリア内の下限水準は『${shortMinAddr}』（${minPt.division}）の${formatJpYen(minPt.standardPrice)}/㎡（坪単価 約${formatMan1(minPt.standardTsubo)}）であり、商業利便性や幹線道路へのアクセス性によって価格帯が分かれています。`
                        : `標準的な容積率（${maxPt.far || 200}%）・建蔽率（${maxPt.bcr || 60}%）の規制下で安定した需要が維持されています。`;

                paragraphs.push(
                    `基準地価が最も高い地点は『${shortMaxAddr}』（${maxPt.division}）の1㎡あたり${formatJpYen(maxPt.standardPrice)}（坪単価 約${formatMan1(maxPt.standardTsubo)}）です。${minPart}`
                );
            }

            const realNote =
                land.count > 0 && land.avgSqm
                    ? `なお、${fullAreaName}における実際の土地取引（${land.count}件）の平均単価は1㎡あたり${formatJpYen(land.avgSqm)}（坪単価約${formatMan1(land.avgSqm * TSUBO)}）となっています。`
                    : '';

            paragraphs.push(
                `都道府県地価調査（基準地価）は、国が1月1日時点で実施する地価公示とあわせて半年ごとの地価変動を把握するための公的調査であり、都市計画区域外の住宅地や林地・工業地まで幅広くカバーしている点が特徴です。${realNote}${areaName}で土地の売買や資産活用を検討する際は、基準地価（坪単価約${formatMan1(std.avgTsubo)}）と実勢取引目安（坪単価約${formatMan1(ros.realMarketEstimateTsubo)}）の双方を確認することで、時期による相場変動を織り込んだ妥当な価格判断が可能になります。`
            );
        }
    }

    // =========================================================================
    // 4. 中古マンションページ (/mansion) 専用レポート
    // =========================================================================
    else if (currentType === 'mansion') {
        title = `${areaName}の中古マンション相場・成約動向 分析レポート（${yearNum}年最新）`;
        if (mansion.count > 0 && mansion.avgPrice) {
            const mTsubo = mansion.avgSqm ? Math.round(mansion.avgSqm * TSUBO) : null;
            const rowStats = analyzeTxRows(mansion.rows, yearNum);
            const qTrend = analyzeQuarterTrend(mansion.quarters);

            const trendNote = qTrend
                ? `${qTrend.firstLabel}から直近（${qTrend.latestLabel}）にかけての㎡単価推移は${formatPct(qTrend.changePct)}で推移しています。`
                : `年間を通じて安定した成約件数が記録されています。`;

            paragraphs.push(
                `国土交通省「不動産情報ライブラリ」の成約データによると、${fullAreaName}における中古マンションの累計取引件数は${mansion.count.toLocaleString('ja-JP')}件、平均取引価格は${formatManInt(mansion.avgPrice)}（1㎡あたり${formatJpYen(mansion.avgSqm)}・坪単価 約${formatMan1(mTsubo)}）、平均専有面積は${Number(mansion.avgArea || 0).toFixed(1)}㎡です。${trendNote}`
            );

            const rangePart =
                rowStats.minPriceMan && rowStats.maxPriceMan && rowStats.minPriceMan !== rowStats.maxPriceMan
                    ? `直近の主な成約価格帯は${rowStats.minPriceMan.toLocaleString('ja-JP')}万円〜${rowStats.maxPriceMan.toLocaleString('ja-JP')}万円を中心に分布しており、`
                    : `直近の成約事例（${rowStats.sampleCount}件）を見ると、`;
            const planPart = rowStats.topFloorPlan ? `間取りは「${rowStats.topFloorPlan}」タイプ、` : '';
            const agePart =
                rowStats.avgAge != null
                    ? `平均築年数は約${rowStats.avgAge}年（築5年以内の築浅物件比率は約${rowStats.newRatio}%）が取引の中心となっています。`
                    : `幅広い築年数のマンションが取引されています。`;

            const fam70Man = mansion.avgSqm ? Math.round((mansion.avgSqm * 70) / 10000) : null;
            const structPart = rowStats.topStructure ? `構造は「${rowStats.topStructure}」が中心で、` : '';

            paragraphs.push(
                `${rangePart}${planPart}${structPart}${agePart}平均㎡単価から換算した一般的なファミリー向け（専有面積70㎡）の目安価格は約${fam70Man ? fam70Man.toLocaleString('ja-JP') : '—'}万円となり、最寄り駅からの徒歩分数や管理状態、室内リノベーションの有無によって成約坪単価に差が生じる傾向があります。`
            );

            const landNote = off.avgPrice
                ? `また、マンションの敷地資産価値を裏付ける${yearStr}のエリア公示地価は平均${formatJpYen(off.avgPrice)}/㎡（前年比${formatPct(off.avgFluctuation)}）と${describeFluctuationTrend(off.avgFluctuation)}。`
                : '';
            const vsHouseNote =
                house.count > 0 && house.avgPrice
                    ? `同エリアの一戸建て平均価格（${formatManInt(house.avgPrice)}・${house.count.toLocaleString('ja-JP')}件）と比較すると、${mansion.avgPrice < house.avgPrice ? `中古マンションの方が平均で約${formatManInt(house.avgPrice - mansion.avgPrice)}抑えられた予算感で取得可能です。` : `利便性の高い立地のマンション需要が強く、戸建てと並ぶ価格水準で取引されています。`}売却・購入の検討時は、築年数や面積帯の条件フィルタを用いて類似事例の坪単価を比較することが有効です。`
                    : `購入・売却を検討する際は、同じ築年数帯・面積帯の直近成約事例と平均坪単価（約${formatMan1(mTsubo)}）を基準に比較することが重要です。`;

            paragraphs.push(`${landNote}${vsHouseNote}`);
        } else {
            paragraphs.push(
                `${fullAreaName}では現在、国土交通省の公表データ上における中古マンション単体の成約記録が少ないエリアとなっており、一戸建て（${house.count}件）や土地（${land.count}件）を中心とした戸建て住宅街としての性格が強い地域です。${off.avgPrice ? `${yearStr}の公示地価は平均${formatJpYen(off.avgPrice)}/㎡（前年比${formatPct(off.avgFluctuation)}）で推移しています。` : ''}`
            );
        }
    }

    // =========================================================================
    // 5. 戸建てページ (/house) 専用レポート
    // =========================================================================
    else if (currentType === 'house') {
        title = `${areaName}の一戸建て相場・成約動向 分析レポート（${yearNum}年最新）`;
        if (house.count > 0 && house.avgPrice) {
            const hTsubo = house.avgSqm ? Math.round(house.avgSqm * TSUBO) : null;
            const rowStats = analyzeTxRows(house.rows, yearNum);
            const qTrend = analyzeQuarterTrend(house.quarters);

            const trendNote = qTrend
                ? `${qTrend.firstLabel}から直近（${qTrend.latestLabel}）にかけての単価トレンドは${formatPct(qTrend.changePct)}で推移しています。`
                : `実需層を中心に継続的な取引が行われています。`;

            paragraphs.push(
                `国土交通省の不動産取引価格情報によると、${fullAreaName}における一戸建て（宅地：土地と建物）の累計取引件数は${house.count.toLocaleString('ja-JP')}件、平均取引価格は${formatManInt(house.avgPrice)}（土地面積あたりの平均坪単価 約${formatMan1(hTsubo)}・1㎡あたり${formatJpYen(house.avgSqm)}）です。取引された物件の平均敷地面積は${Number(house.avgArea || 0).toFixed(1)}㎡（約${((house.avgArea || 0) / TSUBO).toFixed(1)}坪）${rowStats.avgFloorArea ? `、平均延床面積は約${rowStats.avgFloorArea}㎡` : ''}となっています。${trendNote}`
            );

            const rangePart =
                rowStats.minPriceMan && rowStats.maxPriceMan && rowStats.minPriceMan !== rowStats.maxPriceMan
                    ? `直近の成約事例における中心価格帯は${rowStats.minPriceMan.toLocaleString('ja-JP')}万円〜${rowStats.maxPriceMan.toLocaleString('ja-JP')}万円で、`
                    : `直近の成約事例を見ると、`;
            const structPart = rowStats.topStructure ? `建物構造は「${rowStats.topStructure}」が主流、` : '';
            const agePart =
                rowStats.avgAge != null
                    ? `平均築年数は約${rowStats.avgAge}年（うち新築・築5年以内の物件が約${rowStats.newRatio}%）を占めています。`
                    : `新築建売から中古戸建てまで幅広く成約しています。`;

            paragraphs.push(
                `${rangePart}${structPart}${agePart}立地条件やカースペースの台数、南向き・角地といった敷地条件によって成約価格に幅が見られます。`
            );

            const landValueNote =
                land.count > 0 && land.avgSqm && house.avgArea
                    ? `同エリアの土地単体の実勢価格（1㎡あたり${formatJpYen(land.avgSqm)}・坪単価約${formatMan1(land.avgSqm * TSUBO)}）を平均敷地面積（${Math.round(house.avgArea)}㎡）に当てはめると、戸建て価格のうち土地部分の価値目安は約${formatManInt(land.avgSqm * house.avgArea)}を占めると試算されます。`
                    : off.avgPrice && house.avgArea
                      ? `${yearStr}の地価公示平均（${formatJpYen(off.avgPrice)}/㎡・前年比${formatPct(off.avgFluctuation)}）をベースにすると、平均敷地（${Math.round(house.avgArea)}㎡）の公的土地評価目安は約${formatManInt(off.avgPrice * house.avgArea)}となります。`
                      : '';

            paragraphs.push(
                `${landValueNote}一戸建ての売却・購入にあたっては、建物の築年数や耐震・断熱性能、リフォーム履歴だけでなく、前面道路の幅員や接道状況、${yearStr}の最新地価動向（前年比${formatPct(off.avgFluctuation ?? fluctuation)}）を踏まえた土地資産価値のバランスを把握しておくことが重要です。`
            );
        } else {
            paragraphs.push(
                `${fullAreaName}における一戸建ての取引を検討する際は、周辺の土地実勢相場（${land.count > 0 && land.avgSqm ? `坪単価約${formatMan1(land.avgSqm * TSUBO)}` : `公示地価平均${formatJpYen(off.avgPrice)}/㎡`}）と建築コストをあわせて比較することで適正な相場水準を把握できます。`
            );
        }
    }

    // =========================================================================
    // 6. 土地ページ (/land) 専用レポート
    // =========================================================================
    else {
        title = `${areaName}の土地（宅地）実勢相場・取引動向 分析レポート（${yearNum}年最新）`;
        if (land.count > 0 && land.avgSqm) {
            const lTsubo = Math.round(land.avgSqm * TSUBO);
            const rowStats = analyzeTxRows(land.rows, yearNum);
            const qTrend = analyzeQuarterTrend(land.quarters);

            const trendNote = qTrend
                ? `${qTrend.firstLabel}から直近（${qTrend.latestLabel}）にかけての㎡単価は${formatPct(qTrend.changePct)}で推移しています。`
                : `住宅用地を中心に継続的な成約が見られます。`;

            paragraphs.push(
                `国土交通省の成約データに基づく${fullAreaName}の土地（宅地のみ）取引件数は累計${land.count.toLocaleString('ja-JP')}件、実勢平均単価は1㎡あたり${formatJpYen(land.avgSqm)}（坪単価 約${formatMan1(lTsubo)}）、1件あたりの平均取引総額は${formatManInt(land.avgPrice)}、平均取引面積は${Number(land.avgArea || 0).toFixed(1)}㎡（約${((land.avgArea || 0) / TSUBO).toFixed(1)}坪）です。${trendNote}`
            );

            const rangePart =
                rowStats.minPriceMan && rowStats.maxPriceMan && rowStats.minPriceMan !== rowStats.maxPriceMan
                    ? `実際の取引総額は面積規模に応じて${rowStats.minPriceMan.toLocaleString('ja-JP')}万円〜${rowStats.maxPriceMan.toLocaleString('ja-JP')}万円の範囲が中心となっており、`
                    : `直近の成約データを分析すると、`;

            const lot150Man = Math.round((land.avgSqm * 150) / 10000);
            paragraphs.push(
                `${rangePart}一般の戸建て住宅用地（100㎡〜200㎡前後、150㎡換算で約${lot150Man.toLocaleString('ja-JP')}万円目安）から事業用・分割用のまとまった敷地まで多様な取引が含まれています。土地の成約単価は、最寄り駅からの距離だけでなく、整形地か不整形地か、前面道路の幅員（4m以上か）、高低差や古家解体の有無によって大きく変動します。`
            );

            if (off.avgPrice) {
                const fluc = off.avgFluctuation ?? fluctuation;
                const divPct = off.divergence != null ? formatPct(off.divergence) : null;
                paragraphs.push(
                    `公的価格との比較では、${yearStr}の${scopeLabel}における地価公示平均が1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}・前年比${formatPct(fluc)}）、推定相続税路線価が1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）です。${divPct ? `地価公示に対する実勢成約単価の差は${divPct}となっており、` : ''}売買査定や価格交渉の際は、公示地価・路線価の公的基準と直近の近隣成約事例の双方を照らし合わせることが有効です。`
                );
            }
        } else if (off.avgPrice) {
            paragraphs.push(
                `${yearStr}における${scopeLabel}の公的土地評価は、地価公示平均で1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}・前年比${formatPct(off.avgFluctuation)}）、推定路線価で1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）となっています。実勢の土地売買相場に換算すると坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が目安水準となります。`
            );
        }
    }

    const fullText = paragraphs.join('');
    return {
        title,
        paragraphs,
        charCount: fullText.length,
    };
}
