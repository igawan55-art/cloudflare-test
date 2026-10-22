globalThis.process ??= {};
globalThis.process.env ??= {};
import { E as createComponent, T as createAstro, a as renderComponent, f as renderTemplate, h as addAttribute, o as Fragment, p as maybeRenderHead } from "./compiler_BtRSHKO3.mjs";
import { a as SITE_URL, i as buildFaqSchema, n as buildArticleSchema, r as buildBreadcrumbSchema, t as $$Layout } from "./Layout_Bson63KP.mjs";
import { c as generateAreaFaqs } from "./areaSummary_Bqfz40N3.mjs";
import { t as $$AreaDashboard } from "./AreaDashboard_BleeDO4s.mjs";
import { i as TYPE_CONFIG, n as getLandPriceStats, o as normalizeType, r as $$TabsNavBar, s as $$AreaOverviewDashboard, t as generateMarketReport } from "./marketReport_2x12qc74.mjs";
import { l as getDb, n as getCityDistrictSummaries, t as getAreaStats } from "./areaStats_CE41jAJX.mjs";
//#region src/components/CityDetailPage.astro
createAstro("https://cloudflare-test.pages.dev");
var $$CityDetailPage = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$CityDetailPage;
	const { prefSlug, municipalityCode, type: rawType = "index" } = Astro.props;
	const currentType = normalizeType(rawType);
	const isOverview = currentType === "index";
	const conf = TYPE_CONFIG[currentType];
	const basePath = `/${prefSlug}/${municipalityCode}`;
	const db = getDb();
	const TSUBO = 3.30578;
	const { pref, city, districts } = await getCityDistrictSummaries(db, municipalityCode);
	const stats = await getAreaStats(db, {
		municipalityCode,
		rowLimit: 120
	});
	const land = stats.types.land;
	stats.types.mansion;
	stats.types.house;
	const realLandSqm = land.avgSqm;
	const totalTx = Object.values(stats.types).reduce((s, t) => s + t.count, 0);
	const landPrices = await getLandPriceStats(db, {
		municipalityCode,
		realLandAvgSqm: land.avgSqm
	});
	const offData = landPrices.official || {};
	const hasAppraisal = Boolean(offData.hasData && offData.avgPrice);
	const officialAvg = hasAppraisal ? Number(offData.avgPrice) : null;
	const fluctuation = hasAppraisal && offData.avgFluctuation != null ? Number(offData.avgFluctuation) : null;
	const res = offData.res ? {
		avgOfficial: offData.res.avgPrice,
		avgFluctuation: offData.res.avgFluctuation
	} : null;
	const com = offData.com ? {
		avgOfficial: offData.com.avgPrice,
		avgFluctuation: offData.com.avgFluctuation
	} : null;
	const maxPoint = offData.maxPoint ? {
		Address: offData.maxPoint.address,
		OfficialPrice: offData.maxPoint.price
	} : null;
	const minPoint = offData.minPoint ? {
		Address: offData.minPoint.address,
		OfficialPrice: offData.minPoint.price
	} : null;
	const divergence = offData.divergence ?? null;
	const topDistricts = districts.slice(0, 30);
	const allTowns = [...districts].sort((a, b) => a.code.localeCompare(b.code));
	const n = (v) => v == null ? null : Number(v);
	const man1 = (yen) => yen == null ? "—" : (yen / 1e4).toLocaleString("ja-JP", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	const manInt = (v) => v == null ? "—" : Math.round(v).toLocaleString("ja-JP");
	const pct = (v) => v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
	const dcls = (v) => v == null ? "flat" : v > 0 ? "up" : v < 0 ? "down" : "flat";
	const pageH1 = isOverview ? `${pref}${city}${conf.h1Suffix}` : `${city}${conf.h1Suffix}`;
	const pageTitle = isOverview ? `${pref}${city}${conf.titleSuffix}｜チカシル` : `${city}${conf.titleSuffix}｜不動産相場・価格情報`;
	const metaDescription = conf.metaTemplate(city, pref);
	const canonicalUrl = isOverview ? `${SITE_URL}/${prefSlug}/${municipalityCode}/` : `${SITE_URL}/${prefSlug}/${municipalityCode}/${currentType}`;
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
		}
	];
	if (!isOverview) breadcrumbItems.push({
		name: conf.label,
		url: `/${prefSlug}/${municipalityCode}/${currentType}`
	});
	const breadcrumbs = buildBreadcrumbSchema(breadcrumbItems);
	const articleSchema = buildArticleSchema({
		title: pageTitle,
		headline: pageH1,
		description: metaDescription,
		url: canonicalUrl
	});
	const isLandPriceTab = currentType === "rosenka" || currentType === "official" || currentType === "standard";
	const report = generateMarketReport({
		pref,
		city,
		currentType: isOverview ? "mansion" : currentType,
		stats,
		landPrices,
		fluctuation
	});
	const faqs = isOverview ? generateAreaFaqs({
		pref,
		city,
		stats,
		landPrices,
		fluctuation
	}) : [];
	const jsonLdList = [
		breadcrumbs,
		articleSchema,
		isOverview ? buildFaqSchema(faqs) : null
	].filter(Boolean);
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": pageTitle,
		"description": metaDescription,
		"canonical": canonicalUrl,
		"jsonLd": jsonLdList
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="page-head"><div class="container"><nav class="breadcrumb" aria-label="パンくずリスト"><a href="/">トップ</a><span class="sep">/</span><a${addAttribute(`/${prefSlug}/`, "href")}>${pref}</a><span class="sep">/</span>${isOverview ? renderTemplate`<span aria-current="page">${city}</span>` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<a${addAttribute(`/${prefSlug}/${municipalityCode}/`, "href")}>${city}</a><span class="sep">/</span><span aria-current="page">${conf.label}</span>` })}`}</nav><span class="eyebrow">${pref}</span><div class="page-title-row"><h1 class="page-title">${pageH1}</h1>${renderComponent($$result, "TabsNavBar", $$TabsNavBar, {
		"currentType": currentType,
		"basePath": basePath
	})}</div><div class="page-meta"><span>市区町村コード <b class="num">${municipalityCode}</b></span><span>取引件数 <b class="num">${totalTx.toLocaleString()} 件</b></span><span>掲載町名 <b class="num">${districts.length.toLocaleString()}</b></span>${hasAppraisal && renderTemplate`<span>地価公示 調査地点 <b class="num">${Number(offData.count || 0).toLocaleString()} 地点</b></span>`}</div></div></section><div class="container">${isOverview ? renderTemplate`${renderComponent($$result, "AreaOverviewDashboard", $$AreaOverviewDashboard, {
		"areaName": city,
		"prefName": pref,
		"cityName": city,
		"basePath": basePath,
		"stats": stats,
		"landPrices": landPrices,
		"fluctuation": fluctuation,
		"fallbackReport": report,
		"faqs": faqs
	})}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "AreaDashboard", $$AreaDashboard, {
		"areaName": city,
		"prefName": pref,
		"cityName": city,
		"stats": stats,
		"fluctuation": fluctuation,
		"landPrices": landPrices,
		"initialType": currentType
	})}<!-- 公的価格（地価公示）と実勢価格（実勢取引タブのみ表示） -->${!isLandPriceTab && renderTemplate`<section class="section" aria-labelledby="official-summary-title"><div class="section-head"><div><h2 class="section-title" id="official-summary-title">${city}の地価公示と土地の実勢価格</h2><p class="section-sub">国土交通省 地価公示（2026年最新）と、土地のみの取引実績の比較</p></div></div><div class="grid-3"><div class="card"><div class="kpi-label">地価公示 平均（全用途）</div>${hasAppraisal ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<div class="kpi-value">${man1(officialAvg)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">坪単価 <b class="num">${man1(officialAvg * TSUBO)} 万円</b>　<span${addAttribute(`delta ${dcls(fluctuation)}`, "class")}>${pct(fluctuation)}</span></div>` })}` : renderTemplate`<p class="kpi-note" style="margin-top:12px;">このエリアの地価公示データは未取得です。</p>`}</div><div class="card"><div class="kpi-label">住宅地 / 商業地</div><div class="stat-row"><span class="k">住宅地</span><span class="v">${res ? `${man1(n(res.avgOfficial))} 万円/㎡` : "—"} <span${addAttribute(`delta ${dcls(res && n(res.avgFluctuation))}`, "class")} style="font-size:0.8rem;">${res ? pct(n(res.avgFluctuation)) : ""}</span></span></div><div class="stat-row"><span class="k">商業地</span><span class="v">${com ? `${man1(n(com.avgOfficial))} 万円/㎡` : "—"} <span${addAttribute(`delta ${dcls(com && n(com.avgFluctuation))}`, "class")} style="font-size:0.8rem;">${com ? pct(n(com.avgFluctuation)) : ""}</span></span></div></div><div class="card" style="background:var(--accent-50); border-color:#BAE6FD;"><div class="kpi-label">土地の実勢 平均坪単価</div><div class="kpi-value">${man1(realLandSqm ? realLandSqm * TSUBO : null)}<span class="kpi-unit">万円/坪</span></div><div class="kpi-note">㎡単価 <b class="num">${man1(realLandSqm)} 万円</b>（<span class="num">${land.count.toLocaleString()}</span> 件）${divergence != null && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<br>地価公示との差 <span${addAttribute(`delta ${dcls(divergence)}`, "class")}>${pct(divergence)}</span>` })}`}</div></div></div>${maxPoint && minPoint && renderTemplate`<div class="callout" style="margin-top:16px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z"></path><circle cx="12" cy="10" r="2"></circle></svg><div><b>最高価格地点：</b>${maxPoint.Address}（<span class="num">${man1(n(maxPoint.OfficialPrice))}</span> 万円/㎡）<br><b>最低価格地点：</b>${minPoint.Address}（<span class="num">${man1(n(minPoint.OfficialPrice))}</span> 万円/㎡）</div></div>`}</section>`}<!-- 種別特化型・不動産市場 分析レポート（約600文字） -->${report.paragraphs.length > 0 && renderTemplate`<section class="section" aria-labelledby="city-report-title"><article class="card card-lg"><div class="section-head" style="margin-bottom:14px;"><h2 class="card-title" id="city-report-title" style="font-size:1.15rem;">${report.title}</h2><span class="badge info">データ分析・約${report.charCount.toLocaleString()}文字</span></div><div class="prose">${report.paragraphs.map((p) => renderTemplate`<p>${p}</p>`)}</div></article></section>`}` })}`}<!-- 町名別相場 --><section class="section" aria-labelledby="district-title"><div class="card"><div class="section-head"><div><h2 class="card-title" id="district-title">${city}の町名別 相場一覧</h2><p class="card-sub">取引件数の多い順（上位30町名）。町名をクリックすると詳細レポートを表示します。</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">町名</th><th scope="col" class="r">取引件数</th><th scope="col" class="r">中古マンション 平均</th><th scope="col" class="r">戸建て 平均</th><th scope="col" class="r">土地 坪単価</th></tr></thead><tbody>${topDistricts.map((d) => renderTemplate`<tr><td class="strong"><a${addAttribute(isOverview ? `/${prefSlug}/${municipalityCode}/${d.code}/` : `/${prefSlug}/${municipalityCode}/${d.code}/${currentType}`, "href")}>${d.name}</a></td><td class="r">${d.count.toLocaleString()} 件</td><td class="r">${d.mansion ? `${manInt(d.mansion)} 万円` : renderTemplate`<span class="muted">—</span>`}</td><td class="r">${d.house ? `${manInt(d.house)} 万円` : renderTemplate`<span class="muted">—</span>`}</td><td class="r">${d.landTsubo ? `${d.landTsubo.toFixed(1)} 万円` : renderTemplate`<span class="muted">—</span>`}</td></tr>`)}</tbody></table></div></div></section><!-- チェックリスト --><section class="section" aria-labelledby="check-title"><div class="section-head"><div><h2 class="section-title" id="check-title">${city}で住まい・土地を探す際のチェックポイント</h2><p class="section-sub">相場とあわせて確認しておきたい項目</p></div></div><ul class="check-list">${[
		["交通アクセス", "最寄り駅までの距離、バス路線、主要駅への通勤・通学時間"],
		["周辺の住環境", "商業施設・医療機関・学校・保育施設・公園などの充実度"],
		["土地の形状・接道", "間口と奥行き、前面道路の幅員（4m以上）、方位、高低差"],
		["法規制", "用途地域、建蔽率・容積率、防火地域、高度地区による制限"],
		["災害リスク", `${city}のハザードマップで浸水・土砂災害・液状化リスクを確認`],
		["価格の妥当性", "本ページの相場・坪単価や地価公示と比較して検討"]
	].map(([t, d]) => renderTemplate`<li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg><div><b>${t}</b><span>${d}</span></div></li>`)}</ul></section><!-- 町名一覧 --><section class="section" aria-labelledby="towns-title"><div class="card"><h2 class="card-title" id="towns-title" style="margin-bottom:14px;">${city}の町名一覧</h2><div class="link-cloud">${allTowns.map((t) => renderTemplate`<a${addAttribute(isOverview ? `/${prefSlug}/${municipalityCode}/${t.code}/` : `/${prefSlug}/${municipalityCode}/${t.code}/${currentType}`, "href")}>${t.name}</a>`)}</div></div></section></div>` })}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/components/CityDetailPage.astro", void 0);
//#endregion
export { $$CityDetailPage as t };

//# sourceMappingURL=CityDetailPage_DSE0bbAp.mjs.map