globalThis.process ??= {};
globalThis.process.env ??= {};
//#region src/lib/areaSummary.js
var TSUBO = 3.30578;
/**
* 西暦から「2026年（令和8年）」形式の文字列を生成
*/
function formatEraYear(year) {
	const y = Number(year) || (/* @__PURE__ */ new Date()).getFullYear();
	if (y >= 2019) return `${y}年（令和${y - 2018}年）`;
	return `${y}年`;
}
/**
* 円単位の数値を「11万5,840円」「13万4,400円」「3,480万円」など自然な日本語表記に変換
*/
function formatJpYen(yen) {
	if (yen == null || !Number.isFinite(Number(yen))) return "—";
	const n = Math.round(Number(yen));
	if (n >= 1e8) {
		const oku = Math.floor(n / 1e8);
		const man = Math.round(n % 1e8 / 1e4);
		return man > 0 ? `${oku.toLocaleString("ja-JP")}億${man.toLocaleString("ja-JP")}万円` : `${oku.toLocaleString("ja-JP")}億円`;
	}
	if (n >= 1e4) {
		const man = Math.floor(n / 1e4);
		const rem = n % 1e4;
		return rem > 0 ? `${man.toLocaleString("ja-JP")}万${rem.toLocaleString("ja-JP")}円` : `${man.toLocaleString("ja-JP")}万円`;
	}
	return `${n.toLocaleString("ja-JP")}円`;
}
/**
* 円単位の数値を万円単位（小数第1位、例: 382942 -> "38.3万円"）に変換
*/
function formatMan1(yen) {
	if (yen == null || !Number.isFinite(Number(yen))) return "—";
	return `${(Number(yen) / 1e4).toLocaleString("ja-JP", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	})}万円`;
}
/**
* 円単位の数値を万円単位（整数、例: 34800000 -> "3,480万円"）に変換
*/
function formatManInt(yen) {
	if (yen == null || !Number.isFinite(Number(yen))) return "—";
	return `${Math.round(Number(yen) / 1e4).toLocaleString("ja-JP")}万円`;
}
/**
* 変動率を "+0.38%" / "-1.20%" 形式に変換
*/
function formatPct(val) {
	if (val == null || !Number.isFinite(Number(val))) return "—";
	const v = Number(val);
	return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}
/**
* 変動率から自然なトレンド表現を生成
*/
function describeFluctuationTrend(fluc) {
	if (fluc == null || !Number.isFinite(Number(fluc))) return "安定した推移を示しています";
	const v = Number(fluc);
	if (v >= 5) return "大幅な上昇傾向を示しています";
	if (v >= 1.5) return "堅調な上昇傾向を示しています";
	if (v > 0) return "小幅な上昇傾向を示しています";
	if (v === 0) return "前年と同水準の横ばい推移となっています";
	if (v > -1.5) return "小幅な下落傾向（弱含み）で推移しています";
	return "下落傾向で推移しています";
}
/**
* 鑑定評価・地価公示の所在地から都道府県名・市区町村名を除いた簡潔な地点表記を生成
* 例: "東京都 多摩市連光寺１丁目２１番６" -> "連光寺1丁目21番6"
*/
function formatShortAddress(rawAddress, pref = "", city = "") {
	if (!rawAddress) return "";
	let s = String(rawAddress).normalize("NFKC").trim();
	if (pref && s.startsWith(pref)) s = s.slice(pref.length).trim();
	if (city && s.startsWith(city)) s = s.slice(city.length).trim();
	return s.replace(/\s+/g, "");
}
/**
* エリア・種別に応じた200〜300文字程度の要約HTMLを生成
* @param {{
*   pref?: string,
*   city?: string,
*   district?: string,
*   currentType: 'index' | 'rosenka' | 'official' | 'standard' | 'mansion' | 'house' | 'land',
*   stats?: any,
*   landPrices?: any,
*   fluctuation?: number | null
* }} opts
*/
function generateAreaSummaryHtml({ pref = "", city = "", district = "", currentType = "mansion", stats = null, landPrices = null, fluctuation = null }) {
	const fullAreaName = `${pref}${city}${district}`;
	const lp = landPrices || {};
	const off = lp.official || {};
	const std = lp.standard || {};
	const ros = lp.rosenka || {};
	const points = lp.points || [];
	const yearNum = Number(lp.year || ros.year || off.year || 2026);
	const yearStr = formatEraYear(yearNum);
	const areaScopeNote = Boolean(district && lp.isDistrictSpecific === false) ? `${fullAreaName}（${city}基準）` : fullAreaName;
	const maxPt = points.length > 0 ? points[0] : null;
	const shortMaxAddr = maxPt ? formatShortAddress(maxPt.address, pref, city) : "";
	if (currentType === "index") {
		const txTypes = stats?.types || {};
		const m = txTypes.mansion || {};
		const h = txTypes.house || {};
		const l = txTypes.land || {};
		const txParts = [];
		if (m.count > 0 && m.avgPrice) {
			const mTsuboMan = m.avgSqm ? Math.round(m.avgSqm * TSUBO / 1e4).toLocaleString("ja-JP") : "—";
			txParts.push(`<strong>中古マンションの平均価格は${formatManInt(m.avgPrice)}（坪単価 約${mTsuboMan}万円）</strong>`);
		}
		if (h.count > 0 && h.avgPrice) {
			const hTsuboMan = h.avgSqm ? Math.round(h.avgSqm * TSUBO / 1e4).toLocaleString("ja-JP") : "—";
			txParts.push(`<strong>一戸建ては${formatManInt(h.avgPrice)}（坪単価 約${hTsuboMan}万円）</strong>`);
		}
		if (l.count > 0 && l.avgSqm) {
			const lTsuboMan = Math.round(l.avgSqm * TSUBO / 1e4).toLocaleString("ja-JP");
			txParts.push(`<strong>土地の平均坪単価は${lTsuboMan}万円</strong>`);
		}
		const txSentence = txParts.length > 0 ? `直近の取引実績において、${txParts.join("、")}となっています。` : `国土交通省の公的データに基づき、エリア内の取引実績と地価指標を集計しています。`;
		const fluc = off.avgFluctuation ?? fluctuation;
		return `${fullAreaName}における最新の不動産市場サマリーです。${txSentence}${ros.avgPrice ? `また、公的指標である${yearNum}年推計路線価は平米あたり${formatMan1(ros.avgPrice)}、地価公示は前年比${formatPct(fluc)}と${describeFluctuationTrend(fluc)}。` : ""}各種別の詳細や取引推移は各タブよりご確認いただけます。`;
	}
	if (currentType === "rosenka") {
		if (!ros.hasData || !ros.avgPrice) return `${yearStr}における${fullAreaName}の路線価（相続税路線価）および土地相場データです。周辺の公示地価や実勢取引価格をもとに、土地評価額の目安をご確認いただけます。`;
		const fluc = off.avgFluctuation ?? fluctuation;
		const flucSentence = fluc != null ? `前年比の変動率は${formatPct(fluc)}</strong>と${describeFluctuationTrend(fluc)}。` : `</strong>国税庁の財産評価基準に基づく推計値です。`;
		let maxPointSentence = "";
		if (maxPt) {
			const divObj = (ros.divisions || []).find((d) => d.name === maxPt.division) || (ros.divisions || [])[0];
			maxPointSentence = `対象エリア内の${divObj ? `${divObj.name}（調査地点${divObj.count.toLocaleString("ja-JP")}件）` : `${maxPt.division || "標準地"}`}における最高価格地点は『${shortMaxAddr}』の${formatJpYen(maxPt.rosenkaPrice)}/㎡（坪単価 約${formatMan1(maxPt.rosenkaTsubo)}）となっています。`;
		}
		const estTsuboSentence = ros.realMarketEstimateTsubo ? `実勢の土地取引相場に換算すると坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が取引目安水準となります。` : "";
		return `${yearStr}における${areaScopeNote}の平均路線価（推計）は、<strong>1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）です。${flucSentence}${maxPointSentence}${estTsuboSentence}`;
	}
	if (currentType === "official") {
		if (!off.hasData || !off.avgPrice) return `${yearStr}における${fullAreaName}の地価公示（公示価格）データです。国土交通省が公表する標準地の価格推移や周辺相場をご確認いただけます。`;
		const fluc = off.avgFluctuation ?? fluctuation;
		const flucSentence = fluc != null ? `前年比の変動率は${formatPct(fluc)}</strong>と${describeFluctuationTrend(fluc)}。` : `</strong>国土交通省の土地鑑定委員会による標準地価格です。`;
		let maxPointSentence = "";
		if (maxPt) {
			const divObj = (off.divisions || []).find((d) => d.name === maxPt.division) || (off.divisions || [])[0];
			maxPointSentence = `対象エリア内の${divObj ? `${divObj.name}（調査地点${divObj.count.toLocaleString("ja-JP")}件）` : `${maxPt.division || "標準地"}`}における最高価格地点は『${shortMaxAddr}』の${formatJpYen(maxPt.officialPrice)}/㎡（坪単価 約${formatMan1(maxPt.officialTsubo)}）となっています。`;
		}
		const rosenkaSentence = ros.avgTsubo ? `公示価格の80%水準となる相続税路線価に換算すると坪単価約${formatMan1(ros.avgTsubo)}が目安水準となります。` : "";
		return `${yearStr}における${areaScopeNote}の平均公示価格（地価公示）は、<strong>1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}）です。${flucSentence}${maxPointSentence}${rosenkaSentence}`;
	}
	if (currentType === "standard") {
		if (!std.hasData || !std.avgPrice) return `${yearStr}における${fullAreaName}の基準地価（都道府県地価調査）データです。毎年7月1日時点の地価水準や用途区分別の相場をご確認いただけます。`;
		const fluc = std.trendRate ?? off.avgFluctuation ?? fluctuation;
		const flucSentence = fluc != null ? `前年比の変動率は${formatPct(fluc)}</strong>と${describeFluctuationTrend(fluc)}。` : `</strong>都道府県地価調査に基づく推計基準地価です。`;
		let maxPointSentence = "";
		if (maxPt) {
			const divObj = (std.divisions || []).find((d) => d.name === maxPt.division) || (std.divisions || [])[0];
			maxPointSentence = `対象エリア内の${divObj ? `${divObj.name}（調査地点${divObj.count.toLocaleString("ja-JP")}件）` : `${maxPt.division || "基準地"}`}における最高価格地点は『${shortMaxAddr}』の${formatJpYen(maxPt.standardPrice)}/㎡（坪単価 約${formatMan1(maxPt.standardTsubo)}）となっています。`;
		}
		const estTsuboSentence = ros.realMarketEstimateTsubo ? `実勢の土地取引相場に換算すると坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が取引目安水準となります。` : "";
		return `${yearStr}における${areaScopeNote}の平均基準地価（推計）は、<strong>1㎡あたり${formatJpYen(std.avgPrice)}（坪単価 約${formatMan1(std.avgTsubo)}）です。${flucSentence}${maxPointSentence}${estTsuboSentence}`;
	}
	const txTypes = stats?.types || {};
	if (currentType === "land") {
		const land = txTypes.land || {};
		if (land.count > 0 && land.avgSqm) {
			const landTsubo = Math.round(land.avgSqm * TSUBO);
			const fluc = off.avgFluctuation ?? fluctuation;
			const officialPart = off.avgPrice ? `エリア内の地価公示平均は1㎡あたり${formatJpYen(off.avgPrice)}（前年比${formatPct(fluc)}）、推定路線価は坪単価約${formatMan1(ros.avgTsubo)}となっています。` : "";
			const maxPart = maxPt ? `公的調査地点の最高価格地点は『${shortMaxAddr}』の${formatJpYen(maxPt.officialPrice)}/㎡です。` : "";
			return `${fullAreaName}における土地（宅地）の実勢取引相場は、直近の成約データ${land.count.toLocaleString("ja-JP")}件の平均で<strong>1㎡あたり${formatJpYen(land.avgSqm)}（坪単価 約${formatMan1(landTsubo)}）、平均取引価格は${formatManInt(land.avgPrice)}</strong>（平均面積${Math.round(land.avgArea || 0).toLocaleString("ja-JP")}㎡）です。${officialPart}${maxPart}`;
		}
		if (off.avgPrice) return `${yearStr}における${areaScopeNote}の公的土地相場は、公示地価平均で<strong>1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}）、前年比変動率は${formatPct(off.avgFluctuation)}</strong>です。実勢の土地取引相場に換算すると坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が目安水準となります。`;
	}
	if (currentType === "house") {
		const house = txTypes.house || {};
		if (house.count > 0 && house.avgPrice) {
			const houseTsubo = house.avgSqm ? Math.round(house.avgSqm * TSUBO) : null;
			const fluc = off.avgFluctuation ?? fluctuation;
			const landPart = off.avgPrice ? `エリアの地価動向（${yearStr}地価公示）は平均${formatJpYen(off.avgPrice)}/㎡・前年比<strong>${formatPct(fluc)}</strong>と${describeFluctuationTrend(fluc)}。` : "";
			const realLandPart = txTypes.land?.avgSqm ? `土地単体の実勢相場は坪単価約${formatMan1(txTypes.land.avgSqm * TSUBO)}が目安水準となります。` : ros.realMarketEstimateTsubo ? `土地の実勢換算相場は坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が目安水準となります。` : "";
			return `${fullAreaName}における一戸建て（土地と建物）の取引相場は、直近の成約データ${house.count.toLocaleString("ja-JP")}件の平均で<strong>取引価格${formatManInt(house.avgPrice)}（坪単価 約${formatMan1(houseTsubo)}・1㎡あたり${formatJpYen(house.avgSqm)}）</strong>、平均土地面積は約${Math.round(house.avgArea || 0).toLocaleString("ja-JP")}㎡です。${landPart}${realLandPart}`;
		}
	}
	const mansion = txTypes.mansion || {};
	if (mansion.count > 0 && mansion.avgPrice) {
		const mansionTsubo = mansion.avgSqm ? Math.round(mansion.avgSqm * TSUBO) : null;
		const fluc = off.avgFluctuation ?? fluctuation;
		const landPart = off.avgPrice ? `${yearStr}のエリア公示地価は平均${formatJpYen(off.avgPrice)}/㎡（前年比<strong>${formatPct(fluc)}</strong>）と${describeFluctuationTrend(fluc)}。` : "";
		const otherTxPart = txTypes.house?.count > 0 ? `なお、同エリアの一戸建て平均取引価格は${formatManInt(txTypes.house.avgPrice)}（${txTypes.house.count.toLocaleString("ja-JP")}件）となっています。` : "";
		return `${fullAreaName}における中古マンションの取引相場は、直近の成約データ${mansion.count.toLocaleString("ja-JP")}件の平均で<strong>取引価格${formatManInt(mansion.avgPrice)}（坪単価 約${formatMan1(mansionTsubo)}・1㎡あたり${formatJpYen(mansion.avgSqm)}）</strong>、平均専有面積は約${Math.round(mansion.avgArea || 0).toLocaleString("ja-JP")}㎡です。${landPart}${otherTxPart}`;
	}
	const totalTx = (txTypes.mansion?.count || 0) + (txTypes.house?.count || 0) + (txTypes.land?.count || 0);
	if (off.avgPrice) {
		const fluc = off.avgFluctuation ?? fluctuation;
		const txNote = totalTx > 0 ? `エリア内の不動産取引実績は計${totalTx.toLocaleString("ja-JP")}件記録されており、実勢の土地取引目安は坪単価約${formatMan1(ros.realMarketEstimateTsubo)}となります。` : `実勢の土地取引相場に換算すると坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が取引目安水準となります。`;
		return `${yearStr}における${areaScopeNote}の地価公示平均は<strong>1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}）、前年比変動率は${formatPct(fluc)}</strong>と${describeFluctuationTrend(fluc)}。推定路線価は1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）です。${txNote}`;
	}
	return `${fullAreaName}の不動産取引価格（中古マンション・一戸建て・土地）および地価公示・路線価・基準地価の最新相場情報を国土交通省の公的データに基づき集計しています。`;
}
/**
* 都道府県ページ (/prefXX/) 用の200〜300文字程度の要約HTMLを生成
*/
function generatePrefSummaryHtml({ prefName = "", year = 2026, overallAppr = null, resAppr = null, maxPoint = null, totalTxCount = 0, cityCount = 0 }) {
	const yearStr = formatEraYear(year);
	const avgOff = overallAppr?.avgOfficial ? Math.round(Number(overallAppr.avgOfficial)) : null;
	const avgRosenka = avgOff ? Math.round(avgOff * .8) : null;
	const avgRosenkaTsubo = avgRosenka ? Math.round(avgRosenka * TSUBO) : null;
	const fluc = overallAppr?.avgFluctuation != null ? Number(overallAppr.avgFluctuation) : null;
	if (!avgOff) return `${prefName}内${cityCount}市区町村・計${totalTxCount.toLocaleString("ja-JP")}件の不動産取引データおよび地価公示・路線価・基準地価の最新相場を集計しています。`;
	const resPrice = resAppr?.avgOfficial ? Math.round(Number(resAppr.avgOfficial)) : null;
	const resTsubo = resPrice ? Math.round(resPrice * TSUBO) : null;
	const resCount = resAppr?.cnt ? Number(resAppr.cnt) : 0;
	let maxSentence = "";
	if (maxPoint && maxPoint.Address) {
		const shortAddr = formatShortAddress(maxPoint.Address, prefName, "");
		const maxOff = Math.round(Number(maxPoint.OfficialPrice));
		const maxTsubo = Math.round(maxOff * TSUBO);
		maxSentence = `${prefName}内の最高価格地点は『${shortAddr}』の${formatJpYen(maxOff)}/㎡（坪単価 約${formatMan1(maxTsubo)}）となっています。`;
	}
	const resSentence = resPrice ? `住宅地（調査地点${resCount.toLocaleString("ja-JP")}件）の平均公示地価は1㎡あたり${formatJpYen(resPrice)}（坪単価 約${formatMan1(resTsubo)}）です。` : "";
	return `${yearStr}における${prefName}全体の平均公示地価は<strong>1㎡あたり${formatJpYen(avgOff)}、平均路線価（推計）は1㎡あたり${formatJpYen(avgRosenka)}（坪単価 約${formatMan1(avgRosenkaTsubo)}）です。前年比の変動率は${formatPct(fluc)}</strong>と${describeFluctuationTrend(fluc)}。${resSentence}${maxSentence}`;
}
/**
* 総合トップページ (index) 用のFAQ（よくある質問）リストと構造化データ用テキストを生成
*/
function generateAreaFaqs({ pref = "", city = "", district = "", stats = null, landPrices = null, fluctuation = null }) {
	const areaName = district || city;
	const fullAreaName = `${pref}${city}${district}`;
	const txTypes = stats?.types || {};
	const m = txTypes.mansion || {};
	const h = txTypes.house || {};
	const l = txTypes.land || {};
	const lp = landPrices || {};
	const off = lp.official || {};
	const ros = lp.rosenka || {};
	const std = lp.standard || {};
	const points = lp.points || [];
	const yearNum = Number(lp.year || ros.year || off.year || 2026);
	const fluc = off.avgFluctuation ?? fluctuation;
	const faqs = [];
	const q1Parts = [];
	if (m.count > 0 && m.avgPrice) {
		const mTsubo = m.avgSqm ? formatMan1(m.avgSqm * TSUBO) : "—";
		q1Parts.push(`中古マンションは直近${m.count.toLocaleString("ja-JP")}件の成約平均で${formatManInt(m.avgPrice)}（坪単価 約${mTsubo}・平均専有面積 約${Math.round(m.avgArea || 0)}㎡）`);
	}
	if (h.count > 0 && h.avgPrice) {
		const hTsubo = h.avgSqm ? formatMan1(h.avgSqm * TSUBO) : "—";
		q1Parts.push(`一戸建て（土地＋建物）は直近${h.count.toLocaleString("ja-JP")}件の成約平均で${formatManInt(h.avgPrice)}（坪単価 約${hTsubo}・平均土地面積 約${Math.round(h.avgArea || 0)}㎡）`);
	}
	const q1Answer = q1Parts.length > 0 ? `国土交通省の不動産取引価格情報によると、${fullAreaName}の取引相場は、${q1Parts.join("、")}となっています。築年数や最寄り駅からの距離・面積帯による詳細な成約事例は各物件種別タブからご確認いただけます。` : `${fullAreaName}の住宅相場は周辺の土地価格（公示地価平均${formatJpYen(off.avgPrice)}/㎡）をベースに形成されています。近隣町字の成約事例もあわせてご参照ください。`;
	faqs.push({
		question: `${areaName}で家（戸建て・マンション）を購入・売却する場合の相場感は？`,
		answer: q1Answer
	});
	const maxPt = points.length > 0 ? points[0] : null;
	const shortMaxAddr = maxPt ? formatShortAddress(maxPt.address, pref, city) : "";
	const lRealPart = l.count > 0 && l.avgSqm ? `また、実際の土地（宅地）売買${l.count.toLocaleString("ja-JP")}件における実勢平均は坪単価 約${formatMan1(l.avgSqm * TSUBO)}（1㎡あたり${formatJpYen(l.avgSqm)}）です。` : ros.realMarketEstimateTsubo ? `実勢の土地取引相場に換算すると坪単価 約${formatMan1(ros.realMarketEstimateTsubo)}が目安水準となります。` : "";
	const maxPart = maxPt ? `対象エリア内の最高価格地点は『${shortMaxAddr}』の${formatJpYen(maxPt.officialPrice)}/㎡（坪単価 約${formatMan1(maxPt.officialTsubo)}）です。` : "";
	const q2Answer = off.avgPrice ? `${yearNum}年最新の地価公示データでは、${areaName}（${lp.isDistrictSpecific === false && district ? `${city}基準` : `調査${off.count}地点`}）の平均公示価格は1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}）で、前年比変動率は${formatPct(fluc)}と${describeFluctuationTrend(fluc)}。${maxPart}${lRealPart}` : `${fullAreaName}における土地の実勢取引（${l.count}件）の平均坪単価は約${formatMan1(l.avgSqm ? l.avgSqm * TSUBO : null)}となっています。`;
	faqs.push({
		question: `${areaName}の土地価格・地価は上昇していますか？`,
		answer: q2Answer
	});
	const fixedTaxSqm = off.avgPrice ? Math.round(off.avgPrice * .7) : null;
	const fixedTaxTsubo = fixedTaxSqm ? Math.round(fixedTaxSqm * TSUBO) : null;
	const eval150Man = ros.avgPrice ? Math.round(ros.avgPrice * 150 / 1e4) : null;
	const reduced150Man = eval150Man ? Math.round(eval150Man * .2) : null;
	const q3Answer = ros.avgPrice ? `${yearNum}年基準における${areaName}の推定相続税路線価（公示地価の80%水準）は1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）、固定資産税評価額の目安（公示地価の70%水準）は1㎡あたり${formatJpYen(fixedTaxSqm)}（坪単価 約${formatMan1(fixedTaxTsubo)}）です。例えば150㎡（約45.4坪）の宅地を相続する場合、路線価評価額は約${eval150Man?.toLocaleString("ja-JP")}万円（小規模宅地等の特例で80%減額が適用されると約${reduced150Man?.toLocaleString("ja-JP")}万円）が目安となります。` : `${areaName}の路線価は地価公示価格の約80%、固定資産税評価額は約70%を目安に算定されます。`;
	faqs.push({
		question: `${areaName}の路線価や固定資産税評価額の目安はどれくらいですか？`,
		answer: q3Answer
	});
	const totalTx = (m.count || 0) + (h.count || 0) + (l.count || 0);
	if (totalTx > 0) {
		const mPct = Math.round((m.count || 0) / totalTx * 100);
		const hPct = Math.round((h.count || 0) / totalTx * 100);
		const lPct = Math.max(0, 100 - mPct - hPct);
		faqs.push({
			question: `${areaName}の不動産取引ではどの物件種別が多く取引されていますか？`,
			answer: `${fullAreaName}の過去累計${totalTx.toLocaleString("ja-JP")}件の取引内訳を見ると、中古マンションが${(m.count || 0).toLocaleString("ja-JP")}件（約${mPct}%）、一戸建てが${(h.count || 0).toLocaleString("ja-JP")}件（約${hPct}%）、土地（宅地）が${(l.count || 0).toLocaleString("ja-JP")}件（約${lPct}%）となっています。${std.avgPrice ? `また、7月1日基準の推計基準地価は1㎡あたり${formatJpYen(std.avgPrice)}（坪単価 約${formatMan1(std.avgTsubo)}）です。` : ""}`
		});
	}
	return faqs;
}
//#endregion
export { formatManInt as a, generateAreaFaqs as c, formatMan1 as i, generateAreaSummaryHtml as l, formatEraYear as n, formatPct as o, formatJpYen as r, formatShortAddress as s, describeFluctuationTrend as t, generatePrefSummaryHtml as u };

//# sourceMappingURL=areaSummary_Bqfz40N3.mjs.map