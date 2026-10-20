import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as renderComponent, f as renderTemplate, h as addAttribute, p as maybeRenderHead, w as createAstro } from "./server_DB20_oXV.mjs";
import { n as createComponent, t as $$Layout } from "./Layout_B2tKRp-s.mjs";
import { t as $$AreaDashboard } from "./AreaDashboard_CklL_Xi7.mjs";
import { i as getDb, t as getAreaStats } from "./areaStats_Gh6Yhqx4.mjs";
//#region src/pages/[pref]/[city]/[district].astro
var _district__exports = /* @__PURE__ */ __exportAll({
	default: () => $$District,
	file: () => $$file,
	getStaticPaths: () => getStaticPaths,
	url: () => $$url
});
createAstro("https://astro.build");
async function getStaticPaths() {
	const [rows] = await getDb().query(`
        SELECT DISTINCT MunicipalityCode, DistrictCode 
        FROM transactions 
        WHERE DistrictName IS NOT NULL AND DistrictName != '-' AND DistrictCode IS NOT NULL AND DistrictCode != '0'
    `);
	return rows.map((row) => {
		const muniCode = String(row.MunicipalityCode).padStart(5, "0");
		const distCode = String(row.DistrictCode).padStart(9, "0");
		return { params: {
			pref: "pref" + muniCode.slice(0, 2),
			city: muniCode,
			district: distCode
		} };
	});
}
var $$District = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$District;
	const { pref: prefSlug, city: municipalityCode, district: districtCode } = Astro.params;
	const db = getDb();
	const TSUBO = 3.30578;
	const [nameRows] = await db.query(`
    SELECT Prefecture, Municipality, DistrictName FROM transactions
    WHERE MunicipalityCode = ? AND DistrictCode = ? LIMIT 1
`, [municipalityCode, districtCode]);
	const pref = nameRows[0]?.Prefecture || "";
	const city = nameRows[0]?.Municipality || "";
	const district = nameRows[0]?.DistrictName || "";
	const stats = await getAreaStats(db, {
		municipalityCode,
		districtCode,
		rowLimit: 300
	});
	const apprSql = `
    SELECT AVG(OfficialPrice) AS avgOfficial, AVG(FluctuationRate) AS avgFluctuation,
           AVG(CASE WHEN CapRate > 0 THEN CapRate END) AS avgCapRate, COUNT(*) AS cnt
    FROM appraisals WHERE MunicipalityCode = ?`;
	const [districtAppr] = await db.query(`${apprSql} AND Address LIKE CONCAT('%', ?, '%')`, [municipalityCode, district]);
	let appraisal = districtAppr[0];
	let apprScope = district;
	if (!appraisal || !appraisal.avgOfficial) {
		const [cityAppr] = await db.query(apprSql, [municipalityCode]);
		appraisal = cityAppr[0] || {};
		apprScope = city;
	}
	const officialAvg = appraisal?.avgOfficial ? Number(appraisal.avgOfficial) : null;
	const fluctuation = appraisal?.avgFluctuation != null && officialAvg ? Number(appraisal.avgFluctuation) : null;
	const capRate = appraisal?.avgCapRate ? Number(appraisal.avgCapRate) : null;
	const [descRows] = await db.query(`
    SELECT Description, CharCount FROM district_descriptions 
    WHERE Prefecture = ? AND Municipality = ? AND DistrictName = ?
    LIMIT 1
`, [
		pref,
		city,
		district
	]);
	const districtDescription = descRows[0]?.Description || null;
	const descriptionCharCount = descRows[0]?.CharCount || 0;
	const [siblingRows] = await db.query(`
    SELECT DistrictCode, MAX(DistrictName) AS DistrictName, COUNT(*) AS cnt FROM transactions
    WHERE MunicipalityCode = ? AND DistrictCode != ? AND DistrictName IS NOT NULL AND DistrictName != '-' AND DistrictCode != '0'
    GROUP BY DistrictCode ORDER BY cnt DESC LIMIT 40
`, [municipalityCode, districtCode]);
	const siblings = siblingRows.map((r) => ({
		code: String(r.DistrictCode).padStart(9, "0"),
		name: r.DistrictName
	}));
	const man1 = (yen) => yen == null ? "—" : (yen / 1e4).toLocaleString("ja-JP", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	const pct = (v) => v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
	const dcls = (v) => v == null ? "flat" : v > 0 ? "up" : v < 0 ? "down" : "flat";
	const land = stats.types.land;
	const totalTx = Object.values(stats.types).reduce((s, t) => s + t.count, 0);
	const initialType = [
		"mansion",
		"house",
		"land"
	].reduce((best, k) => stats.types[k].count > stats.types[best].count ? k : best, "mansion");
	const roadEstimate = officialAvg ? officialAvg * .8 : null;
	const divergence = land.avgSqm && officialAvg ? (land.avgSqm / officialAvg - 1) * 100 : null;
	const pageTitle = `${district}（${city}・${pref}）の不動産相場・取引価格｜2023年`;
	const metaDescription = `${pref}${city}${district}の2023年の不動産取引価格（${totalTx}件）をもとにした相場情報。中古マンション・戸建て・土地の平均価格や坪単価、四半期ごとの推移、直近の取引事例、地価公示との比較を掲載しています。`;
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": pageTitle,
		"description": metaDescription
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="page-head"><div class="container"><nav class="breadcrumb" aria-label="パンくずリスト"><a href="/">日本全国</a><span class="sep">/</span><span>${pref}</span><span class="sep">/</span><a${addAttribute(`/${prefSlug}/${municipalityCode}`, "href")}>${city}</a><span class="sep">/</span><span aria-current="page">${district}</span></nav><span class="eyebrow">${pref} ${city}</span><h1 class="page-title" style="margin-top:10px;">${district}の不動産相場</h1><div class="page-meta"><span>地区コード <b class="num">${districtCode}</b></span><span>2023年の取引件数 <b class="num">${totalTx.toLocaleString()} 件</b></span><span><a${addAttribute(`/${prefSlug}/${municipalityCode}`, "href")}>${city}全体の相場を見る →</a></span></div></div></section><div class="container">${renderComponent($$result, "AreaDashboard", $$AreaDashboard, {
		"areaName": district,
		"stats": stats,
		"fluctuation": fluctuation,
		"initialType": initialType
	})}<!-- 公的価格との比較 --><section class="section" aria-labelledby="official-title"><div class="section-head"><div><h2 class="section-title" id="official-title">公的価格との比較</h2><p class="section-sub">地価公示（${apprScope}${apprScope === city ? "全体" : ""}の標準地平均）と土地の取引実績</p></div></div><div class="grid-3"><div class="card"><div class="kpi-label">地価公示 平均</div><div class="kpi-value">${man1(officialAvg)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">坪単価 <b class="num">${man1(officialAvg ? officialAvg * TSUBO : null)} 万円</b>　<span${addAttribute(`delta ${dcls(fluctuation)}`, "class")}>${pct(fluctuation)}</span></div></div><div class="card"><div class="kpi-label">相続税路線価の目安</div><div class="kpi-value">${man1(roadEstimate)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">地価公示 × 80% による推計値</div></div><div class="card"><div class="kpi-label">期待利回り / 実勢との差</div><div class="stat-row"><span class="k">期待還元利回り</span><span class="v">${capRate ? `${capRate.toFixed(2)}%` : "—"}</span></div><div class="stat-row"><span class="k">土地実勢 vs 地価公示</span><span${addAttribute(`v delta ${dcls(divergence)}`, "class")}>${pct(divergence)}</span></div></div></div></section>${districtDescription && renderTemplate`<section class="section" aria-labelledby="report-title"><article class="card card-lg"><div class="section-head"><h2 class="card-title" id="report-title" style="font-size:1.15rem;">${district} 不動産市場 分析レポート</h2><span class="badge info">データ分析・約${descriptionCharCount.toLocaleString()}文字</span></div><div class="report-body">${districtDescription}</div></article></section>`}${siblings.length > 0 && renderTemplate`<section class="section" aria-labelledby="siblings-title"><div class="card"><h2 class="card-title" id="siblings-title" style="margin-bottom:14px;">${city}のほかの町名</h2><div class="link-cloud">${siblings.map((s) => renderTemplate`<a${addAttribute(`/${prefSlug}/${municipalityCode}/${s.code}`, "href")}>${s.name}</a>`)}</div></div></section>`}</div>` })}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/[district].astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/[district].astro";
var $$url = "/[pref]/[city]/[district]";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]/[district]@_@astro
var page = () => _district__exports;
//#endregion
export { page };
