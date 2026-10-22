globalThis.process ??= {};
globalThis.process.env ??= {};
import { T as createAstro, a as renderComponent, f as renderTemplate, h as addAttribute, o as Fragment, p as maybeRenderHead } from "./server_C4b5Dyho.mjs";
import { t as createComponent } from "./compiler_B-lTv1lO.mjs";
import { a as SITE_URL, i as buildFaqSchema, n as buildArticleSchema, r as buildBreadcrumbSchema, t as $$Layout } from "./Layout_mGZnc1nj.mjs";
import { c as generateAreaFaqs } from "./areaSummary_Bqfz40N3.mjs";
import { t as $$AreaDashboard } from "./AreaDashboard_B_uhoj_1.mjs";
import { i as TYPE_CONFIG, n as getLandPriceStats, o as normalizeType, r as $$TabsNavBar, s as $$AreaOverviewDashboard, t as generateMarketReport } from "./marketReport_BiLFiuuY.mjs";
import { l as getDb, n as getCityDistrictSummaries, s as getQualitativeReport, t as getAreaStats } from "./areaStats_CE41jAJX.mjs";
//#region src/components/DistrictDetailPage.astro
createAstro("https://chikashiru.jp");
var $$DistrictDetailPage = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$DistrictDetailPage;
	const { prefSlug, municipalityCode, districtCode, type: rawType = "index" } = Astro.props;
	const currentType = normalizeType(rawType);
	const isOverview = currentType === "index";
	const conf = TYPE_CONFIG[currentType];
	const basePath = `/${prefSlug}/${municipalityCode}/${districtCode}`;
	const db = getDb();
	const TSUBO = 3.30578;
	const [stats, cityDistInfo] = await Promise.all([getAreaStats(db, {
		municipalityCode,
		districtCode,
		rowLimit: 80
	}), getCityDistrictSummaries(db, municipalityCode)]);
	const pref = stats.meta?.pref || cityDistInfo.pref || "";
	const city = stats.meta?.city || cityDistInfo.city || "";
	const matchedDist = cityDistInfo.districts.find((d) => d.code === districtCode);
	const district = stats.meta?.district || matchedDist?.name || "";
	const land = stats.types.land;
	const totalTx = Object.values(stats.types).reduce((s, t) => s + t.count, 0);
	const landPrices = await getLandPriceStats(db, {
		municipalityCode,
		districtName: district,
		realLandAvgSqm: land.avgSqm
	});
	const offData = landPrices.official || {};
	const apprScope = landPrices.isDistrictSpecific ? district : city;
	const officialAvg = offData.avgPrice ? Number(offData.avgPrice) : null;
	const fluctuation = offData.avgFluctuation != null ? Number(offData.avgFluctuation) : null;
	const roadEstimate = landPrices.rosenka?.avgPrice ? Number(landPrices.rosenka.avgPrice) : null;
	const divergence = offData.divergence ?? null;
	const capRate = landPrices.avgCapRate ? Number(landPrices.avgCapRate) : null;
	const siblings = cityDistInfo.districts.filter((d) => d.code !== districtCode).slice(0, 40).map((d) => ({
		code: d.code,
		name: d.name
	}));
	const man1 = (yen) => yen == null ? "—" : (yen / 1e4).toLocaleString("ja-JP", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	const pct = (v) => v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
	const dcls = (v) => v == null ? "flat" : v > 0 ? "up" : v < 0 ? "down" : "flat";
	const isLandPriceTab = currentType === "rosenka" || currentType === "official" || currentType === "standard";
	let qualitativeReport = null;
	let faqs = [];
	if (isOverview) {
		qualitativeReport = await getQualitativeReport(db, pref, city, district);
		faqs = generateAreaFaqs({
			pref,
			city,
			district,
			stats,
			landPrices,
			fluctuation
		});
	}
	const report = generateMarketReport({
		pref,
		city,
		district,
		currentType: isOverview ? "mansion" : currentType,
		stats,
		landPrices,
		fluctuation
	});
	const pageH1 = isOverview ? `${pref}${city}${district}${conf.h1Suffix}` : `${district}${conf.h1Suffix}`;
	const pageTitle = isOverview ? `${pref}${city}${district}${conf.titleSuffix}｜チカシル` : `${district}（${city}）${conf.titleSuffix}｜不動産相場・価格情報`;
	const metaDescription = conf.metaTemplate(`${city}${district}`, pref);
	const canonicalUrl = isOverview ? `${SITE_URL}/${prefSlug}/${municipalityCode}/${districtCode}/` : `${SITE_URL}/${prefSlug}/${municipalityCode}/${districtCode}/${currentType}`;
	const breadcrumbItems = [
		{
			name: "トップ",
			url: "/"
		},
		{
			name: pref,
			url: `/${prefSlug}/`
		},
		{
			name: city,
			url: `/${prefSlug}/${municipalityCode}/`
		},
		{
			name: district,
			url: `/${prefSlug}/${municipalityCode}/${districtCode}/`
		}
	];
	if (!isOverview) breadcrumbItems.push({
		name: conf.label,
		url: `/${prefSlug}/${municipalityCode}/${districtCode}/${currentType}`
	});
	const jsonLdList = [
		buildBreadcrumbSchema(breadcrumbItems),
		buildArticleSchema({
			title: pageTitle,
			headline: pageH1,
			description: metaDescription,
			url: canonicalUrl
		}),
		isOverview ? buildFaqSchema(faqs) : null
	].filter(Boolean);
	const cityTargetHref = isOverview ? `/${prefSlug}/${municipalityCode}/` : `/${prefSlug}/${municipalityCode}/${currentType}`;
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": pageTitle,
		"description": metaDescription,
		"canonical": canonicalUrl,
		"jsonLd": jsonLdList
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="page-head"><div class="container"><nav class="breadcrumb" aria-label="パンくずリスト"><a href="/">トップ</a><span class="sep">/</span><a${addAttribute(`/${prefSlug}/`, "href")}>${pref}</a><span class="sep">/</span><a${addAttribute(cityTargetHref, "href")}>${city}</a><span class="sep">/</span>${isOverview ? renderTemplate`<span aria-current="page">${district}</span>` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<a${addAttribute(`/${prefSlug}/${municipalityCode}/${districtCode}/`, "href")}>${district}</a><span class="sep">/</span><span aria-current="page">${conf.label}</span>` })}`}</nav><span class="eyebrow">${pref} ${city}</span><div class="page-title-row"><h1 class="page-title">${pageH1}</h1>${renderComponent($$result, "TabsNavBar", $$TabsNavBar, {
		"currentType": currentType,
		"basePath": basePath
	})}</div><div class="page-meta"><span>地区コード <b class="num">${districtCode}</b></span><span>取引件数 <b class="num">${totalTx.toLocaleString()} 件</b></span><span><a${addAttribute(cityTargetHref, "href")}>${city}全体の相場を見る →</a></span></div></div></section><div class="container">${isOverview ? renderTemplate`${renderComponent($$result, "AreaOverviewDashboard", $$AreaOverviewDashboard, {
		"areaName": district,
		"prefName": pref,
		"cityName": city,
		"districtName": district,
		"basePath": basePath,
		"stats": stats,
		"landPrices": landPrices,
		"fluctuation": fluctuation,
		"qualitativeReport": qualitativeReport,
		"fallbackReport": report,
		"faqs": faqs
	})}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "AreaDashboard", $$AreaDashboard, {
		"areaName": district,
		"prefName": pref,
		"cityName": city,
		"districtName": district,
		"stats": stats,
		"fluctuation": fluctuation,
		"landPrices": landPrices,
		"initialType": currentType
	})}<!-- 公的価格との比較（実勢取引タブのみ表示） -->${!isLandPriceTab && renderTemplate`<section class="section" aria-labelledby="official-comp-title"><div class="section-head"><div><h2 class="section-title" id="official-comp-title">公的価格との比較</h2><p class="section-sub">地価公示（${apprScope}${apprScope === city ? "全体" : ""}の2026年標準地平均）と土地の取引実績</p></div></div><div class="grid-3"><div class="card"><div class="kpi-label">地価公示 平均</div><div class="kpi-value">${man1(officialAvg)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">坪単価 <b class="num">${man1(officialAvg ? officialAvg * TSUBO : null)} 万円</b>　<span${addAttribute(`delta ${dcls(fluctuation)}`, "class")}>${pct(fluctuation)}</span></div></div><div class="card"><div class="kpi-label">相続税路線価の目安</div><div class="kpi-value">${man1(roadEstimate)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">地価公示 × 80% による推計値</div></div><div class="card"><div class="kpi-label">期待利回り / 実勢との差</div><div class="stat-row"><span class="k">期待還元利回り</span><span class="v">${capRate ? `${capRate.toFixed(2)}%` : "—"}</span></div><div class="stat-row"><span class="k">土地実勢 vs 地価公示</span><span${addAttribute(`v delta ${dcls(divergence)}`, "class")}>${pct(divergence)}</span></div></div></div></section>`}${report.paragraphs.length > 0 && renderTemplate`<section class="section" aria-labelledby="report-title"><article class="card card-lg"><div class="section-head" style="margin-bottom: 14px;"><h2 class="card-title" id="report-title" style="font-size:1.15rem;">${report.title}</h2><span class="badge info">データ分析・約${report.charCount.toLocaleString()}文字</span></div><div class="prose">${report.paragraphs.map((p) => renderTemplate`<p>${p}</p>`)}</div></article></section>`}` })}`}${siblings.length > 0 && renderTemplate`<section class="section" aria-labelledby="siblings-title"><div class="card"><h2 class="card-title" id="siblings-title" style="margin-bottom:14px;">${city}のほかの町名</h2><div class="link-cloud">${siblings.map((s) => renderTemplate`<a${addAttribute(isOverview ? `/${prefSlug}/${municipalityCode}/${s.code}/` : `/${prefSlug}/${municipalityCode}/${s.code}/${currentType}`, "href")}>${s.name}</a>`)}</div></div></section>`}</div>` })}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/components/DistrictDetailPage.astro", void 0);
//#endregion
export { $$DistrictDetailPage as t };

//# sourceMappingURL=DistrictDetailPage_CMWpC2U9.mjs.map