globalThis.process ??= {};
globalThis.process.env ??= {};
import { C as unescapeHTML, E as createComponent, T as createAstro, a as renderComponent, f as renderTemplate, h as addAttribute, o as Fragment, p as maybeRenderHead } from "./compiler_BtRSHKO3.mjs";
import { a as formatManInt, i as formatMan1, l as generateAreaSummaryHtml, n as formatEraYear, o as formatPct, r as formatJpYen, s as formatShortAddress, t as describeFluctuationTrend } from "./areaSummary_Bqfz40N3.mjs";
import { c as ssrCoreData_default } from "./areaStats_vdvDVox9.mjs";
//#region src/components/AreaOverviewDashboard.astro
createAstro("https://cloudflare-test.pages.dev");
var $$AreaOverviewDashboard = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$AreaOverviewDashboard;
	const { areaName, prefName, cityName, districtName = "", basePath, stats, landPrices, fluctuation, qualitativeReport = null, fallbackReport = null, faqs = [] } = Astro.props;
	const TSUBO = 3.30578;
	const cleanBase = basePath.replace(/\/+$/, "");
	const txTypes = stats?.types || {};
	const mansion = txTypes.mansion || {
		count: 0,
		avgPrice: null,
		avgSqm: null,
		avgArea: null,
		rows: []
	};
	const house = txTypes.house || {
		count: 0,
		avgPrice: null,
		avgSqm: null,
		avgArea: null,
		rows: []
	};
	const land = txTypes.land || {
		count: 0,
		avgPrice: null,
		avgSqm: null,
		avgArea: null,
		rows: []
	};
	const lp = landPrices || {};
	const off = lp.official || {};
	const std = lp.standard || {};
	const ros = lp.rosenka || {};
	const yearNum = Number(lp.year || ros.year || off.year || 2026);
	const fluc = off.avgFluctuation ?? fluctuation;
	const divergence = off.divergence ?? (land.avgSqm && off.avgPrice ? (land.avgSqm / off.avgPrice - 1) * 100 : null);
	const man1 = (yen) => yen == null || !isFinite(yen) ? "—" : (yen / 1e4).toLocaleString("ja-JP", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	const manInt = (yen) => yen == null || !isFinite(yen) ? "—" : Math.round(yen / 1e4).toLocaleString("ja-JP");
	const pct = (v) => v == null || !isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
	const dcls = (v) => v == null ? "flat" : v > 0 ? "up" : v < 0 ? "down" : "flat";
	const summaryHtml = generateAreaSummaryHtml({
		pref: prefName,
		city: cityName,
		district: districtName,
		currentType: "index",
		stats,
		landPrices,
		fluctuation: fluc
	});
	const taggedRows = [
		...(mansion.rows || []).slice(0, 10).map((r) => ({
			...r,
			typeKey: "mansion",
			typeLabel: "中古マンション",
			badgeClass: "info"
		})),
		...(house.rows || []).slice(0, 10).map((r) => ({
			...r,
			typeKey: "house",
			typeLabel: "戸建て",
			badgeClass: "neutral"
		})),
		...(land.rows || []).slice(0, 10).map((r) => ({
			...r,
			typeKey: "land",
			typeLabel: "土地",
			badgeClass: "up"
		}))
	];
	taggedRows.sort((a, b) => String(b.p || "").localeCompare(String(a.p || "")));
	const recentCrossRows = taggedRows.slice(0, 10);
	const fixedTaxSqm = off.avgPrice ? Math.round(off.avgPrice * .7) : null;
	const fixedTaxTsubo = fixedTaxSqm ? Math.round(fixedTaxSqm * TSUBO) : null;
	return renderTemplate`${maybeRenderHead($$result)}<div class="overview-pillar" data-astro-cid-gdgvcbxd><!-- ① ファーストビュー直下 自然言語サマリー（200〜300文字） -->${summaryHtml && renderTemplate`<p class="area-summary-text" data-astro-cid-gdgvcbxd>${unescapeHTML(summaryHtml)}</p>`}<!-- ② ひと目でわかる「不動産相場・地価マトリクス」（KPI一覧 6カード） --><section class="section" aria-labelledby="matrix-title" data-astro-cid-gdgvcbxd><div class="section-head" data-astro-cid-gdgvcbxd><div data-astro-cid-gdgvcbxd><h2 class="section-title" id="matrix-title" data-astro-cid-gdgvcbxd>${areaName}の不動産相場・地価マトリクス</h2><p class="section-sub" data-astro-cid-gdgvcbxd>実勢取引価格（マンション・戸建て・土地）と公的地価指標（路線価・公示価格・基準地価）の全体比較</p></div><span class="badge info" data-astro-cid-gdgvcbxd>${yearNum}年最新集計</span></div><div class="matrix-grid" data-astro-cid-gdgvcbxd><!-- 1. 中古マンション --><div class="card matrix-card" data-astro-cid-gdgvcbxd><div class="matrix-card-top" data-astro-cid-gdgvcbxd><span class="matrix-tag tx" data-astro-cid-gdgvcbxd>実勢取引</span><span class="matrix-count" data-astro-cid-gdgvcbxd>取引 <b class="num" data-astro-cid-gdgvcbxd>${mansion.count.toLocaleString()}</b> 件</span></div><h3 class="matrix-title" data-astro-cid-gdgvcbxd>中古マンション</h3><div class="matrix-main-val" data-astro-cid-gdgvcbxd>${mansion.count > 0 && mansion.avgPrice ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`平均 <span class="num" data-astro-cid-gdgvcbxd>${manInt(mansion.avgPrice)}</span><span class="kpi-unit" data-astro-cid-gdgvcbxd>万円</span>` })}` : renderTemplate`<span class="muted" style="font-size:1.1rem;" data-astro-cid-gdgvcbxd>成約データなし</span>`}</div><div class="matrix-sub-val" data-astro-cid-gdgvcbxd>坪単価 <b class="num" data-astro-cid-gdgvcbxd>${mansion.avgSqm ? `${manInt(mansion.avgSqm * TSUBO)}万円` : "—"}</b>／ 平均専有面積 <b class="num" data-astro-cid-gdgvcbxd>${mansion.avgArea ? `${Math.round(mansion.avgArea)}㎡` : "—"}</b></div><a${addAttribute(`${cleanBase}/mansion`, "href")} class="matrix-link" data-astro-cid-gdgvcbxd>${areaName}のマンション相場を見る <span aria-hidden="true" data-astro-cid-gdgvcbxd>→</span></a></div><!-- 2. 戸建て --><div class="card matrix-card" data-astro-cid-gdgvcbxd><div class="matrix-card-top" data-astro-cid-gdgvcbxd><span class="matrix-tag tx" data-astro-cid-gdgvcbxd>実勢取引</span><span class="matrix-count" data-astro-cid-gdgvcbxd>取引 <b class="num" data-astro-cid-gdgvcbxd>${house.count.toLocaleString()}</b> 件</span></div><h3 class="matrix-title" data-astro-cid-gdgvcbxd>戸建て（新築・中古）</h3><div class="matrix-main-val" data-astro-cid-gdgvcbxd>${house.count > 0 && house.avgPrice ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`平均 <span class="num" data-astro-cid-gdgvcbxd>${manInt(house.avgPrice)}</span><span class="kpi-unit" data-astro-cid-gdgvcbxd>万円</span>` })}` : renderTemplate`<span class="muted" style="font-size:1.1rem;" data-astro-cid-gdgvcbxd>成約データなし</span>`}</div><div class="matrix-sub-val" data-astro-cid-gdgvcbxd>坪単価 <b class="num" data-astro-cid-gdgvcbxd>${house.avgSqm ? `${manInt(house.avgSqm * TSUBO)}万円` : "—"}</b>／ 平均土地面積 <b class="num" data-astro-cid-gdgvcbxd>${house.avgArea ? `${Math.round(house.avgArea)}㎡` : "—"}</b></div><a${addAttribute(`${cleanBase}/house`, "href")} class="matrix-link" data-astro-cid-gdgvcbxd>${areaName}の戸建て相場を見る <span aria-hidden="true" data-astro-cid-gdgvcbxd>→</span></a></div><!-- 3. 土地 --><div class="card matrix-card" data-astro-cid-gdgvcbxd><div class="matrix-card-top" data-astro-cid-gdgvcbxd><span class="matrix-tag tx" data-astro-cid-gdgvcbxd>実勢取引</span><span class="matrix-count" data-astro-cid-gdgvcbxd>取引 <b class="num" data-astro-cid-gdgvcbxd>${land.count.toLocaleString()}</b> 件</span></div><h3 class="matrix-title" data-astro-cid-gdgvcbxd>土地（宅地）</h3><div class="matrix-main-val" data-astro-cid-gdgvcbxd>${land.count > 0 && land.avgSqm ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`坪単価 <span class="num" data-astro-cid-gdgvcbxd>${manInt(land.avgSqm * TSUBO)}</span><span class="kpi-unit" data-astro-cid-gdgvcbxd>万円</span>` })}` : renderTemplate`<span class="muted" style="font-size:1.1rem;" data-astro-cid-gdgvcbxd>成約データなし</span>`}</div><div class="matrix-sub-val" data-astro-cid-gdgvcbxd>平米単価 <b class="num" data-astro-cid-gdgvcbxd>${land.avgSqm ? `${man1(land.avgSqm)}万円/㎡` : "—"}</b>／ 平均取引額 <b class="num" data-astro-cid-gdgvcbxd>${land.avgPrice ? `${manInt(land.avgPrice)}万円` : "—"}</b></div><a${addAttribute(`${cleanBase}/land`, "href")} class="matrix-link" data-astro-cid-gdgvcbxd>${areaName}の土地相場を見る <span aria-hidden="true" data-astro-cid-gdgvcbxd>→</span></a></div><!-- 4. 路線価 --><div class="card matrix-card" data-astro-cid-gdgvcbxd><div class="matrix-card-top" data-astro-cid-gdgvcbxd><span class="matrix-tag lp" data-astro-cid-gdgvcbxd>公的指標（相続・贈与）</span><span${addAttribute(`delta ${dcls(fluc)}`, "class")} style="font-size:0.8rem; font-weight:700;" data-astro-cid-gdgvcbxd>前年比 ${pct(fluc)}</span></div><h3 class="matrix-title" data-astro-cid-gdgvcbxd>路線価（相続税路線価）</h3><div class="matrix-main-val" data-astro-cid-gdgvcbxd>${ros.avgPrice ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`推計 <span class="num" data-astro-cid-gdgvcbxd>${man1(ros.avgPrice)}</span><span class="kpi-unit" data-astro-cid-gdgvcbxd>万円/㎡</span>` })}` : renderTemplate`<span class="muted" style="font-size:1.1rem;" data-astro-cid-gdgvcbxd>データなし</span>`}</div><div class="matrix-sub-val" data-astro-cid-gdgvcbxd>坪単価 <b class="num" data-astro-cid-gdgvcbxd>${ros.avgTsubo ? `${man1(ros.avgTsubo)}万円/坪` : "—"}</b>（地価公示の約80%水準）</div><a${addAttribute(`${cleanBase}/rosenka`, "href")} class="matrix-link" data-astro-cid-gdgvcbxd>${areaName}の路線価・相続税試算を見る <span aria-hidden="true" data-astro-cid-gdgvcbxd>→</span></a></div><!-- 5. 公示地価 --><div class="card matrix-card" data-astro-cid-gdgvcbxd><div class="matrix-card-top" data-astro-cid-gdgvcbxd><span class="matrix-tag lp" data-astro-cid-gdgvcbxd>公的指標（1月1日基準）</span><span class="matrix-count" data-astro-cid-gdgvcbxd>調査 <b class="num" data-astro-cid-gdgvcbxd>${off.count ? off.count.toLocaleString() : 0}</b> 地点</span></div><h3 class="matrix-title" data-astro-cid-gdgvcbxd>公示価格（地価公示）</h3><div class="matrix-main-val" data-astro-cid-gdgvcbxd>${off.avgPrice ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`平均 <span class="num" data-astro-cid-gdgvcbxd>${man1(off.avgPrice)}</span><span class="kpi-unit" data-astro-cid-gdgvcbxd>万円/㎡</span>` })}` : renderTemplate`<span class="muted" style="font-size:1.1rem;" data-astro-cid-gdgvcbxd>データなし</span>`}</div><div class="matrix-sub-val" data-astro-cid-gdgvcbxd>坪単価 <b class="num" data-astro-cid-gdgvcbxd>${off.avgTsubo ? `${man1(off.avgTsubo)}万円/坪` : "—"}</b>／ 前年比 <span${addAttribute(`delta ${dcls(fluc)}`, "class")} data-astro-cid-gdgvcbxd>${pct(fluc)}</span></div><a${addAttribute(`${cleanBase}/official`, "href")} class="matrix-link" data-astro-cid-gdgvcbxd>${areaName}の公示価格を見る <span aria-hidden="true" data-astro-cid-gdgvcbxd>→</span></a></div><!-- 6. 基準地価 --><div class="card matrix-card" data-astro-cid-gdgvcbxd><div class="matrix-card-top" data-astro-cid-gdgvcbxd><span class="matrix-tag lp" data-astro-cid-gdgvcbxd>公的指標（7月1日基準）</span><span class="matrix-count" data-astro-cid-gdgvcbxd>都道府県地価調査</span></div><h3 class="matrix-title" data-astro-cid-gdgvcbxd>基準地価</h3><div class="matrix-main-val" data-astro-cid-gdgvcbxd>${std.avgPrice ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`推計 <span class="num" data-astro-cid-gdgvcbxd>${man1(std.avgPrice)}</span><span class="kpi-unit" data-astro-cid-gdgvcbxd>万円/㎡</span>` })}` : renderTemplate`<span class="muted" style="font-size:1.1rem;" data-astro-cid-gdgvcbxd>データなし</span>`}</div><div class="matrix-sub-val" data-astro-cid-gdgvcbxd>坪単価 <b class="num" data-astro-cid-gdgvcbxd>${std.avgTsubo ? `${man1(std.avgTsubo)}万円/坪` : "—"}</b>／ トレンド <span${addAttribute(`delta ${dcls(std.trendRate)}`, "class")} data-astro-cid-gdgvcbxd>${pct(std.trendRate)}</span></div><a${addAttribute(`${cleanBase}/standard`, "href")} class="matrix-link" data-astro-cid-gdgvcbxd>${areaName}の基準地価を見る <span aria-hidden="true" data-astro-cid-gdgvcbxd>→</span></a></div></div></section><!-- ③ 実勢価格 vs 公的価格の比較（一物四価ダイジェスト） --><section class="section" aria-labelledby="four-price-title" data-astro-cid-gdgvcbxd><div class="card card-lg" data-astro-cid-gdgvcbxd><div class="section-head" style="margin-bottom: 16px;" data-astro-cid-gdgvcbxd><div data-astro-cid-gdgvcbxd><h2 class="section-title" id="four-price-title" data-astro-cid-gdgvcbxd>${areaName}の実勢価格 vs 公的価格の比較（一物四価ダイジェスト）</h2><p class="section-sub" data-astro-cid-gdgvcbxd>実際の市場売買価格（実勢価格）と公的評価額（公示地価・相続税路線価・固定資産税評価額）の水準比較</p></div></div><div class="grid-2" style="align-items: center;" data-astro-cid-gdgvcbxd><div class="four-price-bars" data-astro-cid-gdgvcbxd><div class="fp-row" data-astro-cid-gdgvcbxd><div class="fp-head" data-astro-cid-gdgvcbxd><span data-astro-cid-gdgvcbxd><b data-astro-cid-gdgvcbxd>1. 実勢価格（実際の土地取引 / 時価）</b></span><span class="strong text-accent" data-astro-cid-gdgvcbxd>${land.avgSqm ? `${man1(land.avgSqm * TSUBO)} 万円/坪（${man1(land.avgSqm)} 万円/㎡）` : ros.realMarketEstimateTsubo ? `推計 ${man1(ros.realMarketEstimateTsubo)} 万円/坪` : "—"}</span></div><div class="fp-bar-track" data-astro-cid-gdgvcbxd><div class="fp-bar-fill is-market" style="width: 100%;" data-astro-cid-gdgvcbxd></div></div><div class="fp-foot" data-astro-cid-gdgvcbxd>実際の売買成約水準（公示地価の約110〜120%が一般的な目安）</div></div><div class="fp-row" data-astro-cid-gdgvcbxd><div class="fp-head" data-astro-cid-gdgvcbxd><span data-astro-cid-gdgvcbxd><b data-astro-cid-gdgvcbxd>2. 公示地価・基準地価（基準 100%）</b></span><span class="strong" data-astro-cid-gdgvcbxd>${off.avgTsubo ? `${man1(off.avgTsubo)} 万円/坪（${man1(off.avgPrice)} 万円/㎡）` : "—"}</span></div><div class="fp-bar-track" data-astro-cid-gdgvcbxd><div class="fp-bar-fill is-official" style="width: 86%;" data-astro-cid-gdgvcbxd></div></div><div class="fp-foot" data-astro-cid-gdgvcbxd>国土交通省・都道府県が公表する更地の適正価格（100%基準）</div></div><div class="fp-row" data-astro-cid-gdgvcbxd><div class="fp-head" data-astro-cid-gdgvcbxd><span data-astro-cid-gdgvcbxd><b data-astro-cid-gdgvcbxd>3. 相続税路線価（公示地価の約 80%）</b></span><span class="strong" data-astro-cid-gdgvcbxd>${ros.avgTsubo ? `${man1(ros.avgTsubo)} 万円/坪（${man1(ros.avgPrice)} 万円/㎡）` : "—"}</span></div><div class="fp-bar-track" data-astro-cid-gdgvcbxd><div class="fp-bar-fill is-rosenka" style="width: 69%;" data-astro-cid-gdgvcbxd></div></div><div class="fp-foot" data-astro-cid-gdgvcbxd>国税庁が定める相続税・贈与税の土地評価基準</div></div><div class="fp-row" data-astro-cid-gdgvcbxd><div class="fp-head" data-astro-cid-gdgvcbxd><span data-astro-cid-gdgvcbxd><b data-astro-cid-gdgvcbxd>4. 固定資産税評価額（公示地価の約 70%）</b></span><span class="strong" data-astro-cid-gdgvcbxd>${fixedTaxTsubo ? `${man1(fixedTaxTsubo)} 万円/坪（${man1(fixedTaxSqm)} 万円/㎡）` : "—"}</span></div><div class="fp-bar-track" data-astro-cid-gdgvcbxd><div class="fp-bar-fill is-fixed" style="width: 60%;" data-astro-cid-gdgvcbxd></div></div><div class="fp-foot" data-astro-cid-gdgvcbxd>市区町村が3年に1度算定する固定資産税・都市計画税・登録免許税の基準</div></div></div><div class="fp-explanation" data-astro-cid-gdgvcbxd><h3 class="card-title" style="font-size: 1.02rem; margin-bottom: 10px;" data-astro-cid-gdgvcbxd>${areaName}における実勢価格と公示地価の乖離分析</h3><div class="prose" style="font-size: 0.92rem;" data-astro-cid-gdgvcbxd>${land.count > 0 && land.avgSqm && off.avgPrice ? renderTemplate`<p data-astro-cid-gdgvcbxd>${prefName}${cityName}${districtName}における実際の土地（宅地）取引データ（<b class="num" data-astro-cid-gdgvcbxd>${land.count.toLocaleString()}件</b>）の平均単価は<b data-astro-cid-gdgvcbxd>${man1(land.avgSqm)}万円/㎡（坪単価 ${man1(land.avgSqm * TSUBO)}万円）</b>であり、${yearNum}年地価公示平均（<b data-astro-cid-gdgvcbxd>${man1(off.avgPrice)}万円/㎡</b>）に対する乖離率は<b${addAttribute(`delta ${dcls(divergence)}`, "class")} data-astro-cid-gdgvcbxd>${pct(divergence)}</b>となっています。</p>` : renderTemplate`<p data-astro-cid-gdgvcbxd>${prefName}${cityName}${districtName}の${yearNum}年地価公示平均は<b data-astro-cid-gdgvcbxd>${man1(off.avgPrice)}万円/㎡（坪単価 ${man1(off.avgTsubo)}万円）</b>となっており、 路線価からの理論換算による実勢取引目安は<b data-astro-cid-gdgvcbxd>坪単価 約${man1(ros.realMarketEstimateTsubo)}万円</b>水準です。</p>`}<p style="margin-top: 10px;" data-astro-cid-gdgvcbxd>土地や戸建ての売却・購入を検討する際は、<a${addAttribute(`${cleanBase}/official`, "href")} data-astro-cid-gdgvcbxd>公示価格</a>や<a${addAttribute(`${cleanBase}/rosenka`, "href")} data-astro-cid-gdgvcbxd>相続税路線価</a>を物差しとしつつ、<a${addAttribute(`${cleanBase}/land`, "href")} data-astro-cid-gdgvcbxd>土地の実勢取引事例</a>で近隣の成約坪単価を確認することで、妥当な価格判断が可能になります。</p></div></div></div></div></section><!-- ④ 直近の最新取引事例速報（全種別横断・最新10件） -->${recentCrossRows.length > 0 && renderTemplate`<section class="section" aria-labelledby="recent-tx-title" data-astro-cid-gdgvcbxd><div class="card" data-astro-cid-gdgvcbxd><div class="section-head" style="margin-bottom: 14px;" data-astro-cid-gdgvcbxd><div data-astro-cid-gdgvcbxd><h2 class="section-title" id="recent-tx-title" data-astro-cid-gdgvcbxd>${areaName}の最新取引事例速報（全種別横断）</h2><p class="section-sub" data-astro-cid-gdgvcbxd>マンション・戸建て・土地の直近成約データ（最新${recentCrossRows.length}件）</p></div><span class="badge neutral" data-astro-cid-gdgvcbxd>国土交通省 成約データ</span></div><div class="table-wrap" data-astro-cid-gdgvcbxd><table class="data-table responsive" data-astro-cid-gdgvcbxd><thead data-astro-cid-gdgvcbxd><tr data-astro-cid-gdgvcbxd><th data-astro-cid-gdgvcbxd>種別</th><th data-astro-cid-gdgvcbxd>取引時期</th>${!districtName && renderTemplate`<th data-astro-cid-gdgvcbxd>町名</th>`}<th class="r" data-astro-cid-gdgvcbxd>取引価格</th><th class="r" data-astro-cid-gdgvcbxd>坪単価</th><th class="r" data-astro-cid-gdgvcbxd>面積</th><th data-astro-cid-gdgvcbxd>間取り / 構造</th><th class="r" data-astro-cid-gdgvcbxd>建築年</th></tr></thead><tbody data-astro-cid-gdgvcbxd>${recentCrossRows.map((r) => {
		const sqm = r.pr && r.a ? r.pr / r.a : null;
		const tsubo = sqm ? sqm * TSUBO : null;
		return renderTemplate`<tr data-astro-cid-gdgvcbxd><td data-label="種別" data-astro-cid-gdgvcbxd><a${addAttribute(`${cleanBase}/${r.typeKey}`, "href")}${addAttribute(`badge ${r.badgeClass}`, "class")} style="text-decoration:none;" data-astro-cid-gdgvcbxd>${r.typeLabel}</a></td><td data-label="取引時期" class="muted" data-astro-cid-gdgvcbxd>${r.p}</td>${!districtName && renderTemplate`<td data-label="町名" class="strong" data-astro-cid-gdgvcbxd>${r.dc ? renderTemplate`<a${addAttribute(`${cleanBase}/${r.dc}/`, "href")} data-astro-cid-gdgvcbxd>${r.d || "—"}</a>` : r.d || "—"}</td>`}<td data-label="取引価格" class="r strong num" data-astro-cid-gdgvcbxd>${manInt(r.pr)} 万円</td><td data-label="坪単価" class="r num" data-astro-cid-gdgvcbxd>${tsubo ? `${man1(tsubo)} 万円` : "—"}</td><td data-label="面積" class="r num" data-astro-cid-gdgvcbxd>${r.a ? `${r.a} ㎡` : "—"}</td><td data-label="間取り / 構造" data-astro-cid-gdgvcbxd>${[r.fp, r.st].filter(Boolean).join(" / ") || "—"}</td><td data-label="建築年" class="r muted" data-astro-cid-gdgvcbxd>${r.by ? `${r.by}年` : "—"}</td></tr>`;
	})}</tbody></table></div><div class="recent-tx-footer" data-astro-cid-gdgvcbxd><span data-astro-cid-gdgvcbxd>さらに詳しい取引事例や築年数・面積帯での絞り込みは各物件種別ページへ：</span><div class="recent-tx-links" data-astro-cid-gdgvcbxd><a${addAttribute(`${cleanBase}/mansion`, "href")} data-astro-cid-gdgvcbxd>中古マンション事例（${mansion.count.toLocaleString()}件）→</a><a${addAttribute(`${cleanBase}/house`, "href")} data-astro-cid-gdgvcbxd>戸建て事例（${house.count.toLocaleString()}件）→</a><a${addAttribute(`${cleanBase}/land`, "href")} data-astro-cid-gdgvcbxd>土地事例（${land.count.toLocaleString()}件）→</a></div></div></div></section>`}<!-- ⑤ エリア市場分析レポート（住環境・地域特性・需要傾向） -->${(qualitativeReport?.text || fallbackReport && fallbackReport.paragraphs.length > 0) && renderTemplate`<section class="section" aria-labelledby="overview-report-title" data-astro-cid-gdgvcbxd><article class="card card-lg" data-astro-cid-gdgvcbxd><div class="section-head" style="margin-bottom: 14px;" data-astro-cid-gdgvcbxd><h2 class="card-title" id="overview-report-title" style="font-size: 1.15rem;" data-astro-cid-gdgvcbxd>${areaName}の住環境・地域特性・不動産市場分析レポート</h2><span class="badge info" data-astro-cid-gdgvcbxd>エリア総合分析・約${(qualitativeReport?.charCount || fallbackReport?.charCount || 0).toLocaleString()}文字</span></div>${qualitativeReport?.text ? renderTemplate`<div class="report-body" data-astro-cid-gdgvcbxd>${qualitativeReport.text}</div>` : renderTemplate`<div class="prose" data-astro-cid-gdgvcbxd>${fallbackReport?.paragraphs.map((p) => renderTemplate`<p data-astro-cid-gdgvcbxd>${p}</p>`)}</div>`}</article></section>`}<!-- ⑥ よくある質問（FAQセクション ＆ FAQPage構造化データ連動） -->${faqs.length > 0 && renderTemplate`<section class="section" aria-labelledby="faq-title" data-astro-cid-gdgvcbxd><div class="card card-lg" data-astro-cid-gdgvcbxd><div class="section-head" style="margin-bottom: 16px;" data-astro-cid-gdgvcbxd><div data-astro-cid-gdgvcbxd><h2 class="section-title" id="faq-title" data-astro-cid-gdgvcbxd>${areaName}の不動産相場・地価に関するよくある質問（FAQ）</h2><p class="section-sub" data-astro-cid-gdgvcbxd>マンション・戸建て・土地の売買相場や路線価・公示価格に関するQ&A</p></div></div><div class="faq-list" data-astro-cid-gdgvcbxd>${faqs.map((faq) => renderTemplate`<details class="faq-item" open data-astro-cid-gdgvcbxd><summary class="faq-question" data-astro-cid-gdgvcbxd><span class="faq-q-badge" data-astro-cid-gdgvcbxd>Q</span><span data-astro-cid-gdgvcbxd>${faq.question}</span></summary><div class="faq-answer" data-astro-cid-gdgvcbxd><p data-astro-cid-gdgvcbxd>${faq.answer}</p></div></details>`)}</div></div></section>`}</div>`;
}, "D:/xampp/htdocs/root/realestate-astro/src/components/AreaOverviewDashboard.astro", void 0);
//#endregion
//#region src/lib/typeConfig.js
var VALID_TYPES = [
	"mansion",
	"house",
	"land",
	"rosenka",
	"official",
	"standard"
];
var TYPE_CONFIG = {
	index: {
		key: "index",
		label: "総合",
		titleSuffix: "の不動産相場・地価まとめ【2026年最新】マンション・戸建て・土地・路線価",
		h1Suffix: "の不動産相場・地価総合情報",
		subSuffix: "国土交通省の公的データに基づくマンション・戸建て・土地の取引相場と路線価・公示地価・基準地価の総合まとめ",
		metaTemplate: (name, pref) => `${pref}${name}の不動産相場・地価の総合まとめ（2026年最新）。中古マンション・一戸建て・土地の平均取引価格や坪単価、相続税路線価、公示価格、基準地価、最新取引事例を一覧で比較できます。`
	},
	mansion: {
		key: "mansion",
		label: "中古マンション",
		titleSuffix: "の中古マンション相場",
		h1Suffix: "の中古マンション相場",
		subSuffix: "国土交通省の取引実績に基づく中古マンションの相場情報・価格推移・直近事例",
		metaTemplate: (name, pref) => `${pref}${name}の中古マンション相場情報。平均取引価格や坪単価、四半期ごとの推移、直近の取引事例を掲載しています。`
	},
	house: {
		key: "house",
		label: "戸建て",
		titleSuffix: "の戸建て相場",
		h1Suffix: "の戸建て相場",
		subSuffix: "国土交通省の取引実績に基づく一戸建て（土地＋建物）の相場情報・延床面積・構造別事例",
		metaTemplate: (name, pref) => `${pref}${name}の戸建て相場情報。平均取引価格や延床面積・築年数別事例、四半期ごとの推移を掲載しています。`
	},
	land: {
		key: "land",
		label: "土地",
		titleSuffix: "の土地価格・相場",
		h1Suffix: "の土地価格・相場",
		subSuffix: "国土交通省の取引実績に基づく土地取引の平均坪単価・平米単価・直近事例",
		metaTemplate: (name, pref) => `${pref}${name}の土地取引価格・平均坪単価情報。四半期推移や直近取引事例を掲載しています。`
	},
	rosenka: {
		key: "rosenka",
		label: "路線価",
		titleSuffix: "の路線価",
		h1Suffix: "の路線価",
		subSuffix: "国税庁が公表する道路（路線）に面する宅地の価格基準（毎年1月1日時点・地価公示の約80%水準）",
		metaTemplate: (name, pref) => `${pref}${name}の相続税路線価情報。平均路線価・坪単価、敷地面積別の相続税評価額目安試算、主要地点一覧を掲載しています。`
	},
	official: {
		key: "official",
		label: "公示価格",
		titleSuffix: "の公示価格",
		h1Suffix: "の公示価格",
		subSuffix: "国土交通省 土地鑑定委員会が判定・公表する標準地の価格指標（毎年1月1日時点・3月下旬公表）",
		metaTemplate: (name, pref) => `${pref}${name}の地価公示（公示地価）情報。標準地の平均価格、坪単価、前年比変動率、住宅地・商業地別比較、標準地一覧を掲載しています。`
	},
	standard: {
		key: "standard",
		label: "基準地価",
		titleSuffix: "の基準地価",
		h1Suffix: "の基準地価",
		subSuffix: "各都道府県が判定・公表する基準地の標準価格（毎年7月1日時点・9月下旬公表）",
		metaTemplate: (name, pref) => `${pref}${name}の都道府県地価調査（基準地価）情報。7月1日時点の推計基準地価、坪単価、年間変動トレンド、基準地一覧を掲載しています。`
	}
};
var normalizeType = (t) => {
	if (!t) return "mansion";
	if (t === "index" || t === "overview") return "index";
	if (t === "kouji") return "official";
	if (t === "kijun") return "standard";
	return TYPE_CONFIG[t] ? t : "mansion";
};
//#endregion
//#region src/components/TabsNavBar.astro
createAstro("https://cloudflare-test.pages.dev");
var $$TabsNavBar = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$TabsNavBar;
	const { currentType: rawType = "mansion", basePath = "" } = Astro.props;
	const currentType = normalizeType(rawType);
	const cleanBase = basePath.replace(/\/+$/, "");
	const tabs = [{
		key: "index",
		label: "総合",
		href: cleanBase ? `${cleanBase}/` : "/",
		isSelected: currentType === "index"
	}, ...VALID_TYPES.map((key) => {
		const conf = TYPE_CONFIG[key];
		const href = cleanBase ? `${cleanBase}/${key}` : `/${key}`;
		return {
			key,
			label: conf.label,
			href,
			isSelected: key === currentType
		};
	})];
	return renderTemplate`${maybeRenderHead($$result)}<div class="tabs-nav-bar"><div class="seg seg-tabs" role="tablist" aria-label="物件・地価種別切り替え">${tabs.map((t) => renderTemplate`<a${addAttribute(t.href, "href")} class="seg-btn" role="tab"${addAttribute(t.key, "data-type-tab")}${addAttribute(String(t.isSelected), "aria-selected")}>${t.label}</a>`)}</div></div>`;
}, "D:/xampp/htdocs/root/realestate-astro/src/components/TabsNavBar.astro", void 0);
//#endregion
//#region src/lib/landPriceStats.js
var TSUBO$1 = 3.30578;
var toNum = (v) => v === null || v === void 0 || v === "" ? null : Number(v);
var cityRawCache = /* @__PURE__ */ new Map();
var computedBaseCache = /* @__PURE__ */ new Map();
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
	const muniCode = String(municipalityCode || "").padStart(5, "0");
	if (cityRawCache.has(muniCode)) return cityRawCache.get(muniCode);
	const promise = (async () => {
		if (!db?.isEdgeSnapshot) {
			const [rows] = await db.query(`SELECT Year, Address, Division, OfficialPrice, FluctuationRate, Area, BuildingCoverageRatio, FloorAreaRatio, CapRate
                 FROM appraisals
                 WHERE MunicipalityCode = ?`, [muniCode]);
			if (rows && rows.length > 0) return {
				rows,
				avgCapRate: computeAvgCapRate(rows)
			};
		}
		const tokyoCity = ssrCoreData_default?.tokyoCities?.[muniCode];
		if (tokyoCity?.apprRows && tokyoCity.apprRows.length > 0) return {
			rows: tokyoCity.apprRows,
			avgCapRate: computeAvgCapRate(tokyoCity.apprRows)
		};
		const prefCode = muniCode.slice(0, 2);
		return {
			rows: ((ssrCoreData_default?.prefs?.[prefCode])?.topAppraisals || []).map((t) => ({
				Year: "2026",
				Address: t.Address,
				Division: t.Division || "住宅地",
				OfficialPrice: t.OfficialPrice,
				FluctuationRate: t.FluctuationRate,
				Area: null,
				BuildingCoverageRatio: null,
				FloorAreaRatio: null,
				CapRate: null
			})),
			avgCapRate: null
		};
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
	let latestYear = "2026";
	if (filtered.length > 0) {
		let maxY = "";
		for (const r of filtered) {
			const y = String(r.Year || "");
			if (y > maxY) maxY = y;
		}
		if (maxY) latestYear = maxY;
	}
	const yearRows = filtered.filter((r) => String(r.Year || "") === latestYear);
	const pointMap = /* @__PURE__ */ new Map();
	for (const r of yearRows) {
		const addr = r.Address || "";
		const key = `${addr}|||${r.Division || "住宅地"}`;
		let p = pointMap.get(key);
		if (!p) {
			p = {
				Address: addr,
				Division: r.Division,
				priceSum: 0,
				priceCnt: 0,
				flucSum: 0,
				flucCnt: 0,
				Area: null,
				BuildingCoverageRatio: null,
				FloorAreaRatio: null
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
	for (const p of pointMap.values()) dedupPoints.push({
		Address: p.Address,
		Division: p.Division,
		OfficialPrice: p.priceCnt > 0 ? p.priceSum / p.priceCnt : null,
		FluctuationRate: p.flucCnt > 0 ? p.flucSum / p.flucCnt : null,
		Area: p.Area,
		BuildingCoverageRatio: p.BuildingCoverageRatio,
		FloorAreaRatio: p.FloorAreaRatio
	});
	const divMap = /* @__PURE__ */ new Map();
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
				d = {
					Division: divKey,
					cnt: 0,
					priceSum: 0,
					priceCnt: 0,
					flucSum: 0,
					flucCnt: 0
				};
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
		avgFluctuation: d.flucCnt > 0 ? d.flucSum / d.flucCnt : null
	}));
	const overall = totalCnt > 0 ? {
		cnt: totalCnt,
		avgOfficial: totalPriceCnt > 0 ? totalPriceSum / totalPriceCnt : null,
		avgFluctuation: totalFlucCnt > 0 ? totalFlucSum / totalFlucCnt : null
	} : null;
	const res = divSummaries.find((r) => r.Division === "住宅地") || null;
	const com = divSummaries.find((r) => r.Division === "商業地") || null;
	const divisions = divSummaries.filter((r) => r.Division !== null && Number(r.cnt) > 0 && r.avgOfficial != null).map((r) => {
		const offPrice = Math.round(Number(r.avgOfficial));
		const offTsubo = Math.round(offPrice * TSUBO$1);
		const fluc = toNum(r.avgFluctuation);
		const rosPrice = Math.round(offPrice * .8);
		const rosTsubo = Math.round(rosPrice * TSUBO$1);
		const stdPrice = Math.round(offPrice * (1 + (fluc || 0) / 200));
		const stdTsubo = Math.round(stdPrice * TSUBO$1);
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
			realMarketEstimateTsubo: Math.round(rosPrice / .8 * 1.15 * TSUBO$1)
		};
	}).sort((a, b) => b.count - a.count);
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
			const rosenka = Math.round(price * .8);
			const standard = Math.round(price * (1 + (toNum(r.FluctuationRate) || 0) / 200));
			return {
				rank: i + 1,
				address: r.Address,
				division: r.Division || "住宅地",
				officialPrice: price,
				officialTsubo: Math.round(price * TSUBO$1),
				rosenkaPrice: rosenka,
				rosenkaTsubo: Math.round(rosenka * TSUBO$1),
				standardPrice: standard,
				standardTsubo: Math.round(standard * TSUBO$1),
				fluctuationRate: toNum(r.FluctuationRate),
				area: toNum(r.Area),
				bcr: toNum(r.BuildingCoverageRatio),
				far: toNum(r.FloorAreaRatio)
			};
		});
	}
	const officialBase = {
		hasData,
		year: latestYear,
		count,
		avgPrice: avgOfficial,
		avgTsubo: avgOfficial ? Math.round(avgOfficial * TSUBO$1) : null,
		avgFluctuation,
		divisions: divisions.map((d) => ({
			name: d.name,
			count: d.count,
			avgPrice: d.officialPrice,
			avgTsubo: d.officialTsubo,
			fluctuationRate: d.fluctuationRate
		})),
		res: res && res.avgOfficial ? {
			avgPrice: Number(res.avgOfficial),
			avgTsubo: Math.round(Number(res.avgOfficial) * TSUBO$1),
			avgFluctuation: toNum(res.avgFluctuation),
			count: Number(res.cnt)
		} : null,
		com: com && com.avgOfficial ? {
			avgPrice: Number(com.avgOfficial),
			avgTsubo: Math.round(Number(com.avgOfficial) * TSUBO$1),
			avgFluctuation: toNum(com.avgFluctuation),
			count: Number(com.cnt)
		} : null,
		maxPoint: maxPoint ? {
			address: maxPoint.Address,
			division: maxPoint.Division,
			price: Number(maxPoint.OfficialPrice),
			tsubo: Math.round(Number(maxPoint.OfficialPrice) * TSUBO$1),
			fluctuation: toNum(maxPoint.FluctuationRate)
		} : null,
		minPoint: minPoint ? {
			address: minPoint.Address,
			division: minPoint.Division,
			price: Number(minPoint.OfficialPrice),
			tsubo: Math.round(Number(minPoint.OfficialPrice) * TSUBO$1),
			fluctuation: toNum(minPoint.FluctuationRate)
		} : null
	};
	const standardHalfRate = avgFluctuation != null ? avgFluctuation / 2 : 0;
	const avgStandard = avgOfficial ? Math.round(avgOfficial * (1 + standardHalfRate / 100)) : null;
	const standard = {
		hasData,
		year: latestYear,
		count,
		avgPrice: avgStandard,
		avgTsubo: avgStandard ? Math.round(avgStandard * TSUBO$1) : null,
		trendRate: avgFluctuation,
		divisions: divisions.map((d) => ({
			name: d.name,
			count: d.count,
			avgPrice: d.standardPrice,
			avgTsubo: d.standardTsubo,
			fluctuationRate: d.fluctuationRate
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
		} : null
	};
	const avgRosenka = avgOfficial ? Math.round(avgOfficial * .8) : null;
	const rosenka = {
		hasData,
		year: latestYear,
		count,
		avgPrice: avgRosenka,
		avgTsubo: avgRosenka ? Math.round(avgRosenka * TSUBO$1) : null,
		ratio: 80,
		realMarketEstimateSqm: avgRosenka ? Math.round(avgRosenka / .8 * 1.15) : null,
		realMarketEstimateTsubo: avgRosenka ? Math.round(avgRosenka / .8 * 1.15 * TSUBO$1) : null,
		divisions: divisions.map((d) => ({
			name: d.name,
			count: d.count,
			avgPrice: d.rosenkaPrice,
			avgTsubo: d.rosenkaTsubo,
			officialPrice: d.officialPrice,
			fluctuationRate: d.fluctuationRate,
			realMarketEstimateTsubo: d.realMarketEstimateTsubo
		})),
		res: res && res.avgOfficial ? {
			avgPrice: Math.round(Number(res.avgOfficial) * .8),
			avgTsubo: Math.round(Number(res.avgOfficial) * .8 * TSUBO$1),
			count: Number(res.cnt)
		} : null,
		com: com && com.avgOfficial ? {
			avgPrice: Math.round(Number(com.avgOfficial) * .8),
			avgTsubo: Math.round(Number(com.avgOfficial) * .8 * TSUBO$1),
			count: Number(com.cnt)
		} : null,
		simulations: avgRosenka ? [
			{
				label: "約30坪（100㎡）",
				area: 100,
				tsubo: 30.2,
				price: Math.round(avgRosenka * 100)
			},
			{
				label: "約50坪（165㎡）",
				area: 165,
				tsubo: 49.9,
				price: Math.round(avgRosenka * 165)
			},
			{
				label: "約70坪（230㎡）",
				area: 230,
				tsubo: 69.6,
				price: Math.round(avgRosenka * 230)
			}
		] : []
	};
	return {
		year: latestYear,
		isDistrictSpecific,
		avgCapRate,
		divisions,
		points,
		officialBase,
		standard,
		rosenka
	};
}
/**
* @param {import('mysql2/promise').Pool} db
* @param {{ municipalityCode: string, districtName?: string, realLandAvgSqm?: number }} opts
*/
async function getLandPriceStats(db, { municipalityCode, districtName = null, realLandAvgSqm = null } = {}) {
	const baseKey = `${municipalityCode}|${districtName || ""}`;
	let base = computedBaseCache.get(baseKey);
	if (!base) {
		const { rows, avgCapRate } = await getCityAppraisalRows(db, municipalityCode);
		base = buildBaseLandPriceStats(rows, avgCapRate, districtName);
		computedBaseCache.set(baseKey, base);
	}
	const avgOfficial = base.officialBase.avgPrice;
	const divergence = realLandAvgSqm && avgOfficial ? (realLandAvgSqm / avgOfficial - 1) * 100 : null;
	return {
		year: base.year,
		isDistrictSpecific: base.isDistrictSpecific,
		avgCapRate: base.avgCapRate,
		divisions: base.divisions,
		points: base.points,
		official: {
			...base.officialBase,
			divergence
		},
		standard: base.standard,
		rosenka: base.rosenka
	};
}
//#endregion
//#region src/lib/marketReport.js
var TSUBO = 3.30578;
/**
* 取引事例配列 (rows) から築年数・面積・価格レンジ・構造・間取りの傾向を集計
*/
function analyzeTxRows(rows = [], currentYear = 2026) {
	if (!rows || rows.length === 0) return {
		sampleCount: 0,
		avgAge: null,
		newRatio: 0,
		minPriceMan: null,
		maxPriceMan: null,
		topFloorPlan: null,
		topStructure: null,
		avgFloorArea: null
	};
	const prices = rows.map((r) => Number(r.pr)).filter((v) => v > 0).sort((a, b) => a - b);
	const p10 = prices.length >= 5 ? prices[Math.floor(prices.length * .1)] : prices[0];
	const p90 = prices.length >= 5 ? prices[Math.floor(prices.length * .9)] : prices[prices.length - 1];
	const ages = rows.map((r) => r.by && r.by > 1950 && r.by <= currentYear ? currentYear - r.by : null).filter((v) => v !== null);
	const avgAge = ages.length > 0 ? Math.round(ages.reduce((s, v) => s + v, 0) / ages.length) : null;
	const newCount = ages.filter((a) => a <= 5).length;
	const newRatio = ages.length > 0 ? Math.round(newCount / ages.length * 100) : 0;
	const floorAreas = rows.map((r) => Number(r.fa)).filter((v) => v > 0);
	const avgFloorArea = floorAreas.length > 0 ? Math.round(floorAreas.reduce((s, v) => s + v, 0) / floorAreas.length) : null;
	const countMap = (arr) => {
		const m = /* @__PURE__ */ new Map();
		for (const item of arr) {
			if (!item) continue;
			m.set(item, (m.get(item) || 0) + 1);
		}
		let best = null;
		let max = 0;
		for (const [k, v] of m.entries()) if (v > max) {
			max = v;
			best = k;
		}
		return best;
	};
	const topFloorPlan = countMap(rows.map((r) => r.fp));
	const topStructure = countMap(rows.map((r) => r.st));
	return {
		sampleCount: rows.length,
		avgAge,
		newRatio,
		minPriceMan: p10 ? Math.round(p10 / 1e4) : null,
		maxPriceMan: p90 ? Math.round(p90 / 1e4) : null,
		topFloorPlan,
		topStructure,
		avgFloorArea
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
		changePct: (recentAvg / oldAvg - 1) * 100
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
function generateMarketReport({ pref = "", city = "", district = "", currentType = "mansion", stats = null, landPrices = null, fluctuation = null }) {
	const areaName = district || city;
	const fullAreaName = `${pref}${city}${district}`;
	const lp = landPrices || {};
	const off = lp.official || {};
	const std = lp.standard || {};
	const ros = lp.rosenka || {};
	const points = lp.points || [];
	const yearNum = Number(lp.year || ros.year || off.year || 2026);
	const yearStr = formatEraYear(yearNum);
	const scopeLabel = Boolean(district && lp.isDistrictSpecific === false) ? `${fullAreaName}（${city}基準）` : fullAreaName;
	const maxPt = points.length > 0 ? points[0] : null;
	const minPt = points.length > 1 ? points[points.length - 1] : maxPt;
	const shortMaxAddr = maxPt ? formatShortAddress(maxPt.address, pref, city) : "";
	const shortMinAddr = minPt ? formatShortAddress(minPt.address, pref, city) : "";
	const txTypes = stats?.types || {};
	const mansion = txTypes.mansion || {
		count: 0,
		rows: [],
		quarters: []
	};
	const house = txTypes.house || {
		count: 0,
		rows: [],
		quarters: []
	};
	const land = txTypes.land || {
		count: 0,
		rows: [],
		quarters: []
	};
	let title = "";
	const paragraphs = [];
	if (currentType === "rosenka") {
		title = `${areaName}の路線価・相続税評価 市場分析レポート（${yearNum}年最新）`;
		if (ros.hasData && ros.avgPrice) {
			const fluc = off.avgFluctuation ?? fluctuation;
			const divSummary = (ros.divisions || []).map((d) => `${d.name}が平均${formatJpYen(d.avgPrice)}/㎡（坪単価約${formatMan1(d.avgTsubo)}・${d.count}地点）`).join("、");
			paragraphs.push(`${yearStr}の最新公的データに基づく${scopeLabel}の推定平均路線価（公示地価の80%基準）は、1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）となっています。元となる地価公示価格の前年比変動率は${formatPct(fluc)}と${describeFluctuationTrend(fluc)}。用途区分別の内訳を見ると、${divSummary || `全${ros.count}地点で安定した評価水準`}となっており、国税庁が定める相続税・贈与税の財産評価基準として重要な指標となります。`);
			if (maxPt) {
				const minPart = minPt && minPt.address !== maxPt.address ? `一方、エリア内で最も抑えられた地点は『${shortMinAddr}』（${minPt.division}）の推定路線価${formatJpYen(minPt.rosenkaPrice)}/㎡（坪単価 約${formatMan1(minPt.rosenkaTsubo)}）であり、立地や前面道路の条件によって約${Math.max(1.1, maxPt.rosenkaPrice / Math.max(1, minPt.rosenkaPrice)).toFixed(1)}倍の価格差が見られます。` : `標準地の建蔽率は${maxPt.bcr || 60}%・容積率は${maxPt.far || 200}%が基準となっており、住環境と利便性を兼ね備えた評価水準です。`;
				paragraphs.push(`対象エリア内の最高路線価地点は『${shortMaxAddr}』（${maxPt.division}）で、推定路線価は1㎡あたり${formatJpYen(maxPt.rosenkaPrice)}（坪単価 約${formatMan1(maxPt.rosenkaTsubo)}・元公示地価${formatJpYen(maxPt.officialPrice)}/㎡）を記録しています。${minPart}`);
			}
			const eval150Man = Math.round(ros.avgPrice * 150 / 1e4);
			const reduced150Man = Math.round(eval150Man * .2);
			const realLandNote = land.count > 0 && land.avgSqm ? `なお、${fullAreaName}における実際の土地成約データ（${land.count}件）の実勢平均は坪単価約${formatMan1(land.avgSqm * TSUBO)}であり、路線価からの理論換算値（坪単価約${formatMan1(ros.realMarketEstimateTsubo)}）と照らし合わせることで精度の高い資産把握が可能です。` : `路線価を0.8で割り戻し市場流通性を加味した実勢土地売買相場は坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が目安となり、相続対策から売買査定まで幅広く活用できます。`;
			paragraphs.push(`相続税評価の実務においては、例えば${areaName}の平均路線価で150㎡（約45.4坪）の宅地を評価した場合、自用地評価額は約${eval150Man.toLocaleString("ja-JP")}万円となりますが、「小規模宅地等の特例（特定居住用宅地等・330㎡まで80%減額）」を適用できれば評価額は約${reduced150Man.toLocaleString("ja-JP")}万円まで大幅に圧縮されます。${realLandNote}`);
		} else paragraphs.push(`${fullAreaName}における路線価（相続税路線価）は、毎年1月1日を評価基準日として国税庁が公表する土地評価の基準価格です。地価公示価格の約80%水準を目安に設定され、相続税や贈与税の申告時における土地評価額の算定基礎として用いられます。`);
	} else if (currentType === "official") {
		title = `${areaName}の地価公示（公示価格）市場分析レポート（${yearNum}年最新）`;
		if (off.hasData && off.avgPrice) {
			const fluc = off.avgFluctuation ?? fluctuation;
			const divSummary = (off.divisions || []).map((d) => `${d.name}（${d.count}地点）が平均${formatJpYen(d.avgPrice)}/㎡・前年比${formatPct(d.fluctuationRate)}`).join("、");
			paragraphs.push(`${yearStr}に国土交通省・土地鑑定委員会が公表した地価公示データによると、${scopeLabel}（調査対象${off.count}地点）の平均公示価格は1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}）、前年比変動率は${formatPct(fluc)}と${describeFluctuationTrend(fluc)}。用途区分別では、${divSummary}となっており、一般の土地取引における客観的な指標価格として機能しています。`);
			if (maxPt) {
				const minPart = minPt && minPt.address !== maxPt.address ? `対して最低価格地点は『${shortMinAddr}』（${minPt.division}）の${formatJpYen(minPt.officialPrice)}/㎡（坪単価 約${formatMan1(minPt.officialTsubo)}）となっており、最寄り駅からの距離や用途地域（容積率${maxPt.far || 200}%等）の違いが地価水準に反映されています。` : `対象地点の地積は${maxPt.area || 150}㎡、建蔽率${maxPt.bcr || 60}%・容積率${maxPt.far || 200}%の標準的な宅地として評価されています。`;
				paragraphs.push(`エリア内の最高価格地点は『${shortMaxAddr}』（${maxPt.division}）で、公示価格は1㎡あたり${formatJpYen(maxPt.officialPrice)}（坪単価 約${formatMan1(maxPt.officialTsubo)}・前年比${formatPct(maxPt.fluctuationRate)}）です。${minPart}`);
			}
			const divNote = land.count > 0 && land.avgSqm && off.divergence != null ? `実際の土地取引データ（${land.count}件・平均${formatJpYen(land.avgSqm)}/㎡）と比較すると、公示地価に対する実勢価格の乖離率は${formatPct(off.divergence)}となっています。` : `公示地価をベースとした実勢取引目安は坪単価約${formatMan1(ros.realMarketEstimateTsubo)}（公示価格の約1.1〜1.15倍水準）となります。`;
			paragraphs.push(`地価公示価格は、不動産鑑定士2名以上の鑑定評価をもとに判定される「更地としての適正な正常価格」であり、公共事業用地の取得価格算定や金融機関の担保評価、相続税路線価（公示価格の約80%・坪単価約${formatMan1(ros.avgTsubo)}）および固定資産税評価額（約70%）の基準となります。${divNote}`);
		}
	} else if (currentType === "standard") {
		title = `${areaName}の基準地価（都道府県地価調査）分析レポート（${yearNum}年最新）`;
		if (std.hasData && std.avgPrice) {
			const fluc = std.trendRate ?? off.avgFluctuation ?? fluctuation;
			const divSummary = (std.divisions || []).map((d) => `${d.name}（${d.count}地点）が平均${formatJpYen(d.avgPrice)}/㎡（坪単価約${formatMan1(d.avgTsubo)}）`).join("、");
			paragraphs.push(`${yearStr}基準における${scopeLabel}の基準地価（都道府県地価調査・7月1日基準推計）は、全用途平均で1㎡あたり${formatJpYen(std.avgPrice)}（坪単価 約${formatMan1(std.avgTsubo)}）となっています。直近の変動トレンドは年率${formatPct(fluc)}と${describeFluctuationTrend(fluc)}。用途区分別の水準は、${divSummary}となっています。`);
			if (maxPt) {
				const minPart = minPt && minPt.address !== maxPt.address ? `また、エリア内の下限水準は『${shortMinAddr}』（${minPt.division}）の${formatJpYen(minPt.standardPrice)}/㎡（坪単価 約${formatMan1(minPt.standardTsubo)}）であり、商業利便性や幹線道路へのアクセス性によって価格帯が分かれています。` : `標準的な容積率（${maxPt.far || 200}%）・建蔽率（${maxPt.bcr || 60}%）の規制下で安定した需要が維持されています。`;
				paragraphs.push(`基準地価が最も高い地点は『${shortMaxAddr}』（${maxPt.division}）の1㎡あたり${formatJpYen(maxPt.standardPrice)}（坪単価 約${formatMan1(maxPt.standardTsubo)}）です。${minPart}`);
			}
			const realNote = land.count > 0 && land.avgSqm ? `なお、${fullAreaName}における実際の土地取引（${land.count}件）の平均単価は1㎡あたり${formatJpYen(land.avgSqm)}（坪単価約${formatMan1(land.avgSqm * TSUBO)}）となっています。` : "";
			paragraphs.push(`都道府県地価調査（基準地価）は、国が1月1日時点で実施する地価公示とあわせて半年ごとの地価変動を把握するための公的調査であり、都市計画区域外の住宅地や林地・工業地まで幅広くカバーしている点が特徴です。${realNote}${areaName}で土地の売買や資産活用を検討する際は、基準地価（坪単価約${formatMan1(std.avgTsubo)}）と実勢取引目安（坪単価約${formatMan1(ros.realMarketEstimateTsubo)}）の双方を確認することで、時期による相場変動を織り込んだ妥当な価格判断が可能になります。`);
		}
	} else if (currentType === "mansion") {
		title = `${areaName}の中古マンション相場・成約動向 分析レポート（${yearNum}年最新）`;
		if (mansion.count > 0 && mansion.avgPrice) {
			const mTsubo = mansion.avgSqm ? Math.round(mansion.avgSqm * TSUBO) : null;
			const rowStats = analyzeTxRows(mansion.rows, yearNum);
			const qTrend = analyzeQuarterTrend(mansion.quarters);
			const trendNote = qTrend ? `${qTrend.firstLabel}から直近（${qTrend.latestLabel}）にかけての㎡単価推移は${formatPct(qTrend.changePct)}で推移しています。` : `年間を通じて安定した成約件数が記録されています。`;
			paragraphs.push(`国土交通省「不動産情報ライブラリ」の成約データによると、${fullAreaName}における中古マンションの累計取引件数は${mansion.count.toLocaleString("ja-JP")}件、平均取引価格は${formatManInt(mansion.avgPrice)}（1㎡あたり${formatJpYen(mansion.avgSqm)}・坪単価 約${formatMan1(mTsubo)}）、平均専有面積は${Number(mansion.avgArea || 0).toFixed(1)}㎡です。${trendNote}`);
			const rangePart = rowStats.minPriceMan && rowStats.maxPriceMan && rowStats.minPriceMan !== rowStats.maxPriceMan ? `直近の主な成約価格帯は${rowStats.minPriceMan.toLocaleString("ja-JP")}万円〜${rowStats.maxPriceMan.toLocaleString("ja-JP")}万円を中心に分布しており、` : `直近の成約事例（${rowStats.sampleCount}件）を見ると、`;
			const planPart = rowStats.topFloorPlan ? `間取りは「${rowStats.topFloorPlan}」タイプ、` : "";
			const agePart = rowStats.avgAge != null ? `平均築年数は約${rowStats.avgAge}年（築5年以内の築浅物件比率は約${rowStats.newRatio}%）が取引の中心となっています。` : `幅広い築年数のマンションが取引されています。`;
			const fam70Man = mansion.avgSqm ? Math.round(mansion.avgSqm * 70 / 1e4) : null;
			const structPart = rowStats.topStructure ? `構造は「${rowStats.topStructure}」が中心で、` : "";
			paragraphs.push(`${rangePart}${planPart}${structPart}${agePart}平均㎡単価から換算した一般的なファミリー向け（専有面積70㎡）の目安価格は約${fam70Man ? fam70Man.toLocaleString("ja-JP") : "—"}万円となり、最寄り駅からの徒歩分数や管理状態、室内リノベーションの有無によって成約坪単価に差が生じる傾向があります。`);
			const landNote = off.avgPrice ? `また、マンションの敷地資産価値を裏付ける${yearStr}のエリア公示地価は平均${formatJpYen(off.avgPrice)}/㎡（前年比${formatPct(off.avgFluctuation)}）と${describeFluctuationTrend(off.avgFluctuation)}。` : "";
			const vsHouseNote = house.count > 0 && house.avgPrice ? `同エリアの一戸建て平均価格（${formatManInt(house.avgPrice)}・${house.count.toLocaleString("ja-JP")}件）と比較すると、${mansion.avgPrice < house.avgPrice ? `中古マンションの方が平均で約${formatManInt(house.avgPrice - mansion.avgPrice)}抑えられた予算感で取得可能です。` : `利便性の高い立地のマンション需要が強く、戸建てと並ぶ価格水準で取引されています。`}売却・購入の検討時は、築年数や面積帯の条件フィルタを用いて類似事例の坪単価を比較することが有効です。` : `購入・売却を検討する際は、同じ築年数帯・面積帯の直近成約事例と平均坪単価（約${formatMan1(mTsubo)}）を基準に比較することが重要です。`;
			paragraphs.push(`${landNote}${vsHouseNote}`);
		} else paragraphs.push(`${fullAreaName}では現在、国土交通省の公表データ上における中古マンション単体の成約記録が少ないエリアとなっており、一戸建て（${house.count}件）や土地（${land.count}件）を中心とした戸建て住宅街としての性格が強い地域です。${off.avgPrice ? `${yearStr}の公示地価は平均${formatJpYen(off.avgPrice)}/㎡（前年比${formatPct(off.avgFluctuation)}）で推移しています。` : ""}`);
	} else if (currentType === "house") {
		title = `${areaName}の一戸建て相場・成約動向 分析レポート（${yearNum}年最新）`;
		if (house.count > 0 && house.avgPrice) {
			const hTsubo = house.avgSqm ? Math.round(house.avgSqm * TSUBO) : null;
			const rowStats = analyzeTxRows(house.rows, yearNum);
			const qTrend = analyzeQuarterTrend(house.quarters);
			const trendNote = qTrend ? `${qTrend.firstLabel}から直近（${qTrend.latestLabel}）にかけての単価トレンドは${formatPct(qTrend.changePct)}で推移しています。` : `実需層を中心に継続的な取引が行われています。`;
			paragraphs.push(`国土交通省の不動産取引価格情報によると、${fullAreaName}における一戸建て（宅地：土地と建物）の累計取引件数は${house.count.toLocaleString("ja-JP")}件、平均取引価格は${formatManInt(house.avgPrice)}（土地面積あたりの平均坪単価 約${formatMan1(hTsubo)}・1㎡あたり${formatJpYen(house.avgSqm)}）です。取引された物件の平均敷地面積は${Number(house.avgArea || 0).toFixed(1)}㎡（約${((house.avgArea || 0) / TSUBO).toFixed(1)}坪）${rowStats.avgFloorArea ? `、平均延床面積は約${rowStats.avgFloorArea}㎡` : ""}となっています。${trendNote}`);
			const rangePart = rowStats.minPriceMan && rowStats.maxPriceMan && rowStats.minPriceMan !== rowStats.maxPriceMan ? `直近の成約事例における中心価格帯は${rowStats.minPriceMan.toLocaleString("ja-JP")}万円〜${rowStats.maxPriceMan.toLocaleString("ja-JP")}万円で、` : `直近の成約事例を見ると、`;
			const structPart = rowStats.topStructure ? `建物構造は「${rowStats.topStructure}」が主流、` : "";
			const agePart = rowStats.avgAge != null ? `平均築年数は約${rowStats.avgAge}年（うち新築・築5年以内の物件が約${rowStats.newRatio}%）を占めています。` : `新築建売から中古戸建てまで幅広く成約しています。`;
			paragraphs.push(`${rangePart}${structPart}${agePart}立地条件やカースペースの台数、南向き・角地といった敷地条件によって成約価格に幅が見られます。`);
			const landValueNote = land.count > 0 && land.avgSqm && house.avgArea ? `同エリアの土地単体の実勢価格（1㎡あたり${formatJpYen(land.avgSqm)}・坪単価約${formatMan1(land.avgSqm * TSUBO)}）を平均敷地面積（${Math.round(house.avgArea)}㎡）に当てはめると、戸建て価格のうち土地部分の価値目安は約${formatManInt(land.avgSqm * house.avgArea)}を占めると試算されます。` : off.avgPrice && house.avgArea ? `${yearStr}の地価公示平均（${formatJpYen(off.avgPrice)}/㎡・前年比${formatPct(off.avgFluctuation)}）をベースにすると、平均敷地（${Math.round(house.avgArea)}㎡）の公的土地評価目安は約${formatManInt(off.avgPrice * house.avgArea)}となります。` : "";
			paragraphs.push(`${landValueNote}一戸建ての売却・購入にあたっては、建物の築年数や耐震・断熱性能、リフォーム履歴だけでなく、前面道路の幅員や接道状況、${yearStr}の最新地価動向（前年比${formatPct(off.avgFluctuation ?? fluctuation)}）を踏まえた土地資産価値のバランスを把握しておくことが重要です。`);
		} else paragraphs.push(`${fullAreaName}における一戸建ての取引を検討する際は、周辺の土地実勢相場（${land.count > 0 && land.avgSqm ? `坪単価約${formatMan1(land.avgSqm * TSUBO)}` : `公示地価平均${formatJpYen(off.avgPrice)}/㎡`}）と建築コストをあわせて比較することで適正な相場水準を把握できます。`);
	} else {
		title = `${areaName}の土地（宅地）実勢相場・取引動向 分析レポート（${yearNum}年最新）`;
		if (land.count > 0 && land.avgSqm) {
			const lTsubo = Math.round(land.avgSqm * TSUBO);
			const rowStats = analyzeTxRows(land.rows, yearNum);
			const qTrend = analyzeQuarterTrend(land.quarters);
			const trendNote = qTrend ? `${qTrend.firstLabel}から直近（${qTrend.latestLabel}）にかけての㎡単価は${formatPct(qTrend.changePct)}で推移しています。` : `住宅用地を中心に継続的な成約が見られます。`;
			paragraphs.push(`国土交通省の成約データに基づく${fullAreaName}の土地（宅地のみ）取引件数は累計${land.count.toLocaleString("ja-JP")}件、実勢平均単価は1㎡あたり${formatJpYen(land.avgSqm)}（坪単価 約${formatMan1(lTsubo)}）、1件あたりの平均取引総額は${formatManInt(land.avgPrice)}、平均取引面積は${Number(land.avgArea || 0).toFixed(1)}㎡（約${((land.avgArea || 0) / TSUBO).toFixed(1)}坪）です。${trendNote}`);
			const rangePart = rowStats.minPriceMan && rowStats.maxPriceMan && rowStats.minPriceMan !== rowStats.maxPriceMan ? `実際の取引総額は面積規模に応じて${rowStats.minPriceMan.toLocaleString("ja-JP")}万円〜${rowStats.maxPriceMan.toLocaleString("ja-JP")}万円の範囲が中心となっており、` : `直近の成約データを分析すると、`;
			const lot150Man = Math.round(land.avgSqm * 150 / 1e4);
			paragraphs.push(`${rangePart}一般の戸建て住宅用地（100㎡〜200㎡前後、150㎡換算で約${lot150Man.toLocaleString("ja-JP")}万円目安）から事業用・分割用のまとまった敷地まで多様な取引が含まれています。土地の成約単価は、最寄り駅からの距離だけでなく、整形地か不整形地か、前面道路の幅員（4m以上か）、高低差や古家解体の有無によって大きく変動します。`);
			if (off.avgPrice) {
				const fluc = off.avgFluctuation ?? fluctuation;
				const divPct = off.divergence != null ? formatPct(off.divergence) : null;
				paragraphs.push(`公的価格との比較では、${yearStr}の${scopeLabel}における地価公示平均が1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}・前年比${formatPct(fluc)}）、推定相続税路線価が1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）です。${divPct ? `地価公示に対する実勢成約単価の差は${divPct}となっており、` : ""}売買査定や価格交渉の際は、公示地価・路線価の公的基準と直近の近隣成約事例の双方を照らし合わせることが有効です。`);
			}
		} else if (off.avgPrice) paragraphs.push(`${yearStr}における${scopeLabel}の公的土地評価は、地価公示平均で1㎡あたり${formatJpYen(off.avgPrice)}（坪単価 約${formatMan1(off.avgTsubo)}・前年比${formatPct(off.avgFluctuation)}）、推定路線価で1㎡あたり${formatJpYen(ros.avgPrice)}（坪単価 約${formatMan1(ros.avgTsubo)}）となっています。実勢の土地売買相場に換算すると坪単価約${formatMan1(ros.realMarketEstimateTsubo)}が目安水準となります。`);
	}
	const fullText = paragraphs.join("");
	return {
		title,
		paragraphs,
		charCount: fullText.length
	};
}
//#endregion
export { VALID_TYPES as a, TYPE_CONFIG as i, getLandPriceStats as n, normalizeType as o, $$TabsNavBar as r, $$AreaOverviewDashboard as s, generateMarketReport as t };

//# sourceMappingURL=marketReport_B-oyxVl5.mjs.map