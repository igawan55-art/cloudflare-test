import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { S as unescapeHTML, a as renderComponent, f as renderTemplate, h as addAttribute, o as Fragment, p as maybeRenderHead, w as createAstro } from "./server_DB20_oXV.mjs";
import { n as createComponent, t as $$Layout } from "./Layout_B2tKRp-s.mjs";
import { t as $$AreaDashboard } from "./AreaDashboard_CklL_Xi7.mjs";
import { i as getDb, t as getAreaStats } from "./areaStats_Gh6Yhqx4.mjs";
//#region src/pages/[pref]/[city].astro
var _city__exports = /* @__PURE__ */ __exportAll({
	default: () => $$City,
	file: () => $$file,
	getStaticPaths: () => getStaticPaths,
	url: () => $$url
});
createAstro("https://astro.build");
async function getStaticPaths() {
	const [rows] = await getDb().query(`
        SELECT DISTINCT MunicipalityCode 
        FROM transactions
        WHERE MunicipalityCode IS NOT NULL AND MunicipalityCode != ''
    `);
	return rows.map((row) => {
		const muniCode = String(row.MunicipalityCode).padStart(5, "0");
		return { params: {
			pref: "pref" + muniCode.slice(0, 2),
			city: muniCode
		} };
	});
}
var $$City = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$City;
	const { pref: prefSlug, city: municipalityCode } = Astro.params;
	const db = getDb();
	const TSUBO = 3.30578;
	const [muniRows] = await db.query(`
    SELECT Prefecture, Municipality FROM transactions WHERE MunicipalityCode = ? LIMIT 1
`, [municipalityCode]);
	const pref = muniRows[0]?.Prefecture || "";
	const city = muniRows[0]?.Municipality || "";
	const stats = await getAreaStats(db, {
		municipalityCode,
		rowLimit: 300
	});
	const [apprRows] = await db.query(`
    SELECT Division,
           AVG(OfficialPrice) AS avgOfficial,
           AVG(FluctuationRate) AS avgFluctuation,
           COUNT(*) AS cnt
    FROM appraisals
    WHERE MunicipalityCode = ?
    GROUP BY Division WITH ROLLUP
`, [municipalityCode]);
	const apprBy = (div) => apprRows.find((r) => div === null ? r.Division === null : r.Division === div) || null;
	const overall = apprBy(null);
	const res = apprBy("住宅地");
	const com = apprBy("商業地");
	const hasAppraisal = !!(overall && Number(overall.cnt) > 0 && overall.avgOfficial);
	const fluctuation = hasAppraisal && overall.avgFluctuation != null ? Number(overall.avgFluctuation) : null;
	const [maxPointRows] = await db.query(`
    SELECT Address, OfficialPrice FROM appraisals WHERE MunicipalityCode = ? ORDER BY OfficialPrice DESC LIMIT 1
`, [municipalityCode]);
	const [minPointRows] = await db.query(`
    SELECT Address, OfficialPrice FROM appraisals WHERE MunicipalityCode = ? AND OfficialPrice > 0 ORDER BY OfficialPrice ASC LIMIT 1
`, [municipalityCode]);
	const maxPoint = maxPointRows[0] || null;
	const minPoint = minPointRows[0] || null;
	const [rankingPoints] = await db.query(`
    SELECT Address, OfficialPrice, FluctuationRate, Division, Area, BuildingCoverageRatio, FloorAreaRatio
    FROM appraisals 
    WHERE MunicipalityCode = ?
    ORDER BY OfficialPrice DESC LIMIT 30
`, [municipalityCode]);
	const [districtRows] = await db.query(`
    SELECT DistrictCode, MAX(DistrictName) AS DistrictName, COUNT(*) AS cnt,
        AVG(CASE WHEN Type = '中古マンション等' AND CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) END) AS mansion,
        AVG(CASE WHEN Type = '宅地(土地と建物)' AND CAST(TradePrice AS UNSIGNED) > 0 THEN CAST(TradePrice AS UNSIGNED) END) AS house,
        AVG(CASE WHEN Type = '宅地(土地)' AND CAST(TradePrice AS UNSIGNED) > 0 AND CAST(Area AS DECIMAL(12,2)) > 0
                 THEN CAST(TradePrice AS UNSIGNED) / CAST(Area AS DECIMAL(12,2)) END) AS landSqm
    FROM transactions
    WHERE MunicipalityCode = ? AND DistrictName IS NOT NULL AND DistrictName != '-' AND DistrictCode IS NOT NULL AND DistrictCode != '0'
    GROUP BY DistrictCode
    ORDER BY cnt DESC
`, [municipalityCode]);
	const districts = districtRows.map((r) => ({
		code: String(r.DistrictCode).padStart(9, "0"),
		name: r.DistrictName,
		count: Number(r.cnt),
		mansion: r.mansion ? Number(r.mansion) / 1e4 : null,
		house: r.house ? Number(r.house) / 1e4 : null,
		landTsubo: r.landSqm ? Number(r.landSqm) * TSUBO / 1e4 : null
	}));
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
	const land = stats.types.land;
	const realLandSqm = land.avgSqm;
	const officialAvg = hasAppraisal ? n(overall.avgOfficial) : null;
	const divergence = realLandSqm && officialAvg ? (realLandSqm / officialAvg - 1) * 100 : null;
	const totalTx = Object.values(stats.types).reduce((s, t) => s + t.count, 0);
	const mansion = stats.types.mansion;
	const house = stats.types.house;
	const pageTitle = `${city}（${pref}）の不動産相場・土地価格・坪単価｜2023年 取引価格`;
	const metaDescription = `${pref}${city}の2023年の不動産取引価格をもとにした相場情報。中古マンション平均${manInt(mansion.avgPrice ? mansion.avgPrice / 1e4 : null)}万円、戸建て平均${manInt(house.avgPrice ? house.avgPrice / 1e4 : null)}万円、土地の平均坪単価${man1(land.avgSqm ? land.avgSqm * TSUBO : null)}万円。${hasAppraisal ? `地価公示の平均は${man1(officialAvg)}万円/㎡（前年比${pct(fluctuation)}）。` : ""}町名別相場や直近の取引事例も掲載。`;
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"itemListElement": [
			{
				"@type": "ListItem",
				"position": 1,
				"name": "日本全国",
				"item": "https://cloudflare-test.pages.dev/"
			},
			{
				"@type": "ListItem",
				"position": 2,
				"name": pref,
				"item": `https://cloudflare-test.pages.dev/`
			},
			{
				"@type": "ListItem",
				"position": 3,
				"name": city,
				"item": `https://cloudflare-test.pages.dev/${prefSlug}/${municipalityCode}/`
			}
		]
	};
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": pageTitle,
		"description": metaDescription
	}, { "default": ($$result) => renderTemplate`<script type="application/ld+json">${unescapeHTML(JSON.stringify(jsonLd))}<\/script>${maybeRenderHead($$result)}<section class="page-head"><div class="container"><nav class="breadcrumb" aria-label="パンくずリスト"><a href="/">日本全国</a><span class="sep">/</span><span>${pref}</span><span class="sep">/</span><span aria-current="page">${city}</span></nav><span class="eyebrow">${pref}</span><h1 class="page-title" style="margin-top:10px;">${city}の不動産相場・土地価格</h1><div class="page-meta"><span>市区町村コード <b class="num">${municipalityCode}</b></span><span>2023年の取引件数 <b class="num">${totalTx.toLocaleString()} 件</b></span><span>掲載町名 <b class="num">${districts.length.toLocaleString()}</b></span>${hasAppraisal && renderTemplate`<span>地価公示 調査地点 <b class="num">${Number(overall.cnt).toLocaleString()} 地点</b></span>`}</div></div></section><div class="container">${renderComponent($$result, "AreaDashboard", $$AreaDashboard, {
		"areaName": city,
		"stats": stats,
		"fluctuation": fluctuation
	})}<!-- 公的価格（地価公示）と実勢価格 --><section class="section" aria-labelledby="official-title"><div class="section-head"><div><h2 class="section-title" id="official-title">${city}の地価公示と土地の実勢価格</h2><p class="section-sub">国土交通省 鑑定評価書情報（地価公示）と、土地のみの取引実績の比較</p></div></div><div class="grid-3"><div class="card"><div class="kpi-label">地価公示 平均（全用途）</div>${hasAppraisal ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<div class="kpi-value">${man1(officialAvg)}<span class="kpi-unit">万円/㎡</span></div><div class="kpi-note">坪単価 <b class="num">${man1(officialAvg * TSUBO)} 万円</b>　<span${addAttribute(`delta ${dcls(fluctuation)}`, "class")}>${pct(fluctuation)}</span></div>` })}` : renderTemplate`<p class="kpi-note" style="margin-top:12px;">このエリアの地価公示データは未取得です。</p>`}</div><div class="card"><div class="kpi-label">住宅地 / 商業地</div><div class="stat-row"><span class="k">住宅地</span><span class="v">${res ? `${man1(n(res.avgOfficial))} 万円/㎡` : "—"} <span${addAttribute(`delta ${dcls(res && n(res.avgFluctuation))}`, "class")} style="font-size:0.8rem;">${res ? pct(n(res.avgFluctuation)) : ""}</span></span></div><div class="stat-row"><span class="k">商業地</span><span class="v">${com ? `${man1(n(com.avgOfficial))} 万円/㎡` : "—"} <span${addAttribute(`delta ${dcls(com && n(com.avgFluctuation))}`, "class")} style="font-size:0.8rem;">${com ? pct(n(com.avgFluctuation)) : ""}</span></span></div></div><div class="card" style="background:var(--accent-50); border-color:#BAE6FD;"><div class="kpi-label">土地の実勢 平均坪単価</div><div class="kpi-value">${man1(realLandSqm ? realLandSqm * TSUBO : null)}<span class="kpi-unit">万円/坪</span></div><div class="kpi-note">㎡単価 <b class="num">${man1(realLandSqm)} 万円</b>（<span class="num">${land.count.toLocaleString()}</span> 件）${divergence != null && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<br>地価公示との差 <span${addAttribute(`delta ${dcls(divergence)}`, "class")}>${pct(divergence)}</span>` })}`}</div></div></div>${maxPoint && minPoint && renderTemplate`<div class="callout" style="margin-top:16px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z"></path><circle cx="12" cy="10" r="2"></circle></svg><div><b>最高価格地点：</b>${maxPoint.Address}（<span class="num">${man1(n(maxPoint.OfficialPrice))}</span> 万円/㎡）<br><b>最低価格地点：</b>${minPoint.Address}（<span class="num">${man1(n(minPoint.OfficialPrice))}</span> 万円/㎡）</div></div>`}</section><!-- 市況サマリー --><section class="section"><article class="card card-lg"><h2 class="card-title" style="font-size:1.15rem; margin-bottom:14px;">${city}の不動産市況サマリー（2023年）</h2><div class="prose"><p>${pref}${city}では、2023年に <b class="num">${totalTx.toLocaleString()} 件</b> の不動産取引が記録されました。 中古マンションの平均取引価格は <b class="num">${manInt(mansion.avgPrice ? mansion.avgPrice / 1e4 : null)} 万円</b>（<span class="num">${mansion.count.toLocaleString()}</span> 件）、 戸建ての平均取引価格は <b class="num">${manInt(house.avgPrice ? house.avgPrice / 1e4 : null)} 万円</b>（<span class="num">${house.count.toLocaleString()}</span> 件）です。</p><p>土地のみの取引では平均坪単価 <b class="num">${man1(land.avgSqm ? land.avgSqm * TSUBO : null)} 万円</b> となっています。${hasAppraisal ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`地価公示の平均は <b class="num">${man1(officialAvg)} 万円/㎡</b>、前年比 <b class="num">${pct(fluctuation)}</b> で${fluctuation > 0 ? "上昇基調" : fluctuation < 0 ? "下落基調" : "横ばい"}にあります。` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`地価公示データが取得でき次第、公的価格との比較も掲載します。` })}`}</p></div></article></section><!-- 町名別相場 --><section class="section" aria-labelledby="district-title"><div class="card"><div class="section-head"><div><h2 class="card-title" id="district-title">${city}の町名別 相場一覧</h2><p class="card-sub">取引件数の多い順（上位30町名）。町名をクリックすると詳細レポートを表示します。</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">町名</th><th scope="col" class="r">取引件数</th><th scope="col" class="r">中古マンション 平均</th><th scope="col" class="r">戸建て 平均</th><th scope="col" class="r">土地 坪単価</th></tr></thead><tbody>${topDistricts.map((d) => renderTemplate`<tr><td class="strong"><a${addAttribute(`/${prefSlug}/${municipalityCode}/${d.code}`, "href")}>${d.name}</a></td><td class="r">${d.count.toLocaleString()} 件</td><td class="r">${d.mansion ? `${manInt(d.mansion)} 万円` : renderTemplate`<span class="muted">—</span>`}</td><td class="r">${d.house ? `${manInt(d.house)} 万円` : renderTemplate`<span class="muted">—</span>`}</td><td class="r">${d.landTsubo ? `${d.landTsubo.toFixed(1)} 万円` : renderTemplate`<span class="muted">—</span>`}</td></tr>`)}</tbody></table></div></div></section><!-- 地点ランキング -->${rankingPoints.length > 0 && renderTemplate`<section class="section" aria-labelledby="ranking-title"><div class="card"><div class="section-head"><div><h2 class="card-title" id="ranking-title">${city}の地価公示 地点ランキング</h2><p class="card-sub">国土交通省が公表する標準地の価格（上位30地点）</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th scope="col" class="r">順位</th><th scope="col">所在地</th><th scope="col">用途</th><th scope="col" class="r">価格（㎡）</th><th scope="col" class="r">坪単価</th><th scope="col" class="r">前年比</th><th scope="col" class="r">地積</th><th scope="col" class="r">建蔽率 / 容積率</th></tr></thead><tbody>${rankingPoints.map((pt, i) => {
		const price = n(pt.OfficialPrice) || 0;
		const f = pt.FluctuationRate != null ? n(pt.FluctuationRate) : null;
		return renderTemplate`<tr><td class="r muted">${i + 1}</td><td class="strong">${pt.Address}</td><td><span${addAttribute(`badge ${pt.Division === "商業地" ? "info" : "neutral"}`, "class")}>${pt.Division || "—"}</span></td><td class="r strong">${man1(price)} 万円</td><td class="r">${man1(price * TSUBO)} 万円</td><td class="r"><span${addAttribute(`delta ${dcls(f)}`, "class")}>${pct(f)}</span></td><td class="r">${pt.Area ? `${Number(pt.Area).toLocaleString()} ㎡` : "—"}</td><td class="r muted">${pt.BuildingCoverageRatio ?? "—"}% / ${pt.FloorAreaRatio ?? "—"}%</td></tr>`;
	})}</tbody></table></div></div></section>`}<!-- チェックリスト --><section class="section" aria-labelledby="check-title"><div class="section-head"><div><h2 class="section-title" id="check-title">${city}で住まい・土地を探す際のチェックポイント</h2><p class="section-sub">相場とあわせて確認しておきたい項目</p></div></div><ul class="check-list">${[
		["交通アクセス", "最寄り駅までの距離、バス路線、主要駅への通勤・通学時間"],
		["周辺の住環境", "商業施設・医療機関・学校・保育施設・公園などの充実度"],
		["土地の形状・接道", "間口と奥行き、前面道路の幅員（4m以上）、方位、高低差"],
		["法規制", "用途地域、建蔽率・容積率、防火地域、高度地区による制限"],
		["災害リスク", `${city}のハザードマップで浸水・土砂災害・液状化リスクを確認`],
		["価格の妥当性", "本ページの相場・坪単価や地価公示と比較して検討"]
	].map(([t, d]) => renderTemplate`<li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg><div><b>${t}</b><span>${d}</span></div></li>`)}</ul></section><!-- 町名一覧 --><section class="section" aria-labelledby="towns-title"><div class="card"><h2 class="card-title" id="towns-title" style="margin-bottom:14px;">${city}の町名一覧</h2><div class="link-cloud">${allTowns.map((t) => renderTemplate`<a${addAttribute(`/${prefSlug}/${municipalityCode}/${t.code}`, "href")}>${t.name}</a>`)}</div></div></section></div>` })}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city].astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city].astro";
var $$url = "/[pref]/[city]";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]@_@astro
var page = () => _city__exports;
//#endregion
export { page };
