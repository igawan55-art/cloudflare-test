import { S as unescapeHTML, f as renderTemplate, h as addAttribute, p as maybeRenderHead, w as createAstro } from "./server_DB20_oXV.mjs";
import { n as createComponent } from "./Layout_B2tKRp-s.mjs";
//#region src/components/AreaDashboard.astro
createAstro("https://astro.build");
var $$AreaDashboard = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$AreaDashboard;
	const { areaName, stats, fluctuation, showMunicipality = false, initialType = "mansion" } = Astro.props;
	const payload = JSON.stringify({
		types: stats.types,
		fluctuation,
		showMunicipality,
		initialType
	}).replace(/</g, "\\u003c");
	const tabs = [
		{
			key: "mansion",
			label: "中古マンション"
		},
		{
			key: "house",
			label: "戸建て"
		},
		{
			key: "land",
			label: "土地"
		}
	];
	const chip = (filter, value, label) => ({
		filter,
		value,
		label
	});
	const ageChips = [
		chip("age", "", "すべて"),
		chip("age", "10", "築10年以内"),
		chip("age", "20", "築20年以内"),
		chip("age", "30", "築30年以内"),
		chip("age", "old", "築30年超")
	];
	const planChips = [
		chip("plan", "", "すべて"),
		chip("plan", "1", "1R〜1LDK"),
		chip("plan", "2", "2K〜2LDK"),
		chip("plan", "3", "3K以上")
	];
	const structChips = [
		chip("struct", "", "すべて"),
		chip("struct", "rc", "RC・SRC"),
		chip("struct", "wood", "木造"),
		chip("struct", "other", "その他")
	];
	return renderTemplate`${maybeRenderHead($$result)}<div data-dashboard><script type="application/json">${unescapeHTML(payload)}<\/script><!-- 3. エリア相場サマリー --><section class="section" aria-labelledby="kpi-title"><div class="section-head"><div><h2 class="section-title" id="kpi-title">${areaName}の相場サマリー</h2><p class="section-sub">2023年の取引実績（<span data-kpi-type>中古マンション</span>）に基づく集計値</p></div><div class="seg" role="tablist" aria-label="物件種別">${tabs.map((t) => renderTemplate`<button type="button" class="seg-btn" role="tab"${addAttribute(t.key, "data-type-tab")}${addAttribute(String(t.key === initialType), "aria-selected")}>${t.label}</button>`)}</div></div><div class="kpi-grid"><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></span>平均取引価格</div><div class="kpi-value"><span data-kpi="price">—</span><span class="kpi-unit">万円</span></div><div class="kpi-note">平均面積 <b class="num"><span data-kpi="avgArea">—</span> ㎡</b></div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg></span>平均坪単価</div><div class="kpi-value"><span data-kpi="tsubo">—</span><span class="kpi-unit">万円/坪</span></div><div class="kpi-note">㎡単価 <b class="num"><span data-kpi="sqm">—</span> 万円/㎡</b></div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 7-8.5 8.5-5-5L2 17"></path><path d="M16 7h6v6"></path></svg></span>前年比騰落率</div><div class="kpi-value delta flat" data-kpi="fluc">—</div><div class="kpi-note"><span class="badge neutral" data-kpi="flucBadge">—</span>&nbsp;地価公示ベース</div></div><div class="card kpi"><div class="kpi-label"><span class="kpi-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></span>直近の取引件数</div><div class="kpi-value"><span data-kpi="count">—</span><span class="kpi-unit">件</span></div><div class="kpi-note">対象期間 <b>2023年1月〜12月</b></div></div></div></section><!-- 4. 価格推移グラフ & 条件フィルタ --><section class="section" aria-labelledby="trend-title"><div class="grid-chart"><div class="card"><div class="section-head" style="margin-bottom:0;"><div><h2 class="card-title" id="trend-title">価格推移と取引件数（四半期別）</h2><p class="card-sub">折れ線：平均値 ／ 棒：取引件数。グラフにカーソルを合わせると詳細を表示します。</p></div><div class="seg" role="tablist" aria-label="表示指標"><button type="button" class="seg-btn" role="tab" data-metric="price" aria-selected="true">平均価格</button><button type="button" class="seg-btn" role="tab" data-metric="tsubo" aria-selected="false">坪単価</button></div></div><div class="chart-box"><canvas aria-label="価格推移グラフ" role="img"></canvas></div></div><aside class="card" aria-labelledby="filter-title"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;"><h2 class="card-title" id="filter-title" style="margin:0;">条件で絞り込む</h2><button type="button" class="chip" data-reset style="font-size:0.78rem;">リセット</button></div><div class="filters"><div data-filter-group="age"><div class="filter-group-label">築年数</div><div class="chips">${ageChips.map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.filter, "data-filter")}${addAttribute(c.value, "data-value")}${addAttribute(String(c.value === ""), "aria-pressed")}>${c.label}</button>`)}</div></div><div data-filter-group="plan"><div class="filter-group-label">間取り</div><div class="chips">${planChips.map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.filter, "data-filter")}${addAttribute(c.value, "data-value")}${addAttribute(String(c.value === ""), "aria-pressed")}>${c.label}</button>`)}</div></div><div data-filter-group="area"><div class="filter-group-label">面積</div><div class="chips"></div></div><div data-filter-group="struct"><div class="filter-group-label">構造</div><div class="chips">${structChips.map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.filter, "data-filter")}${addAttribute(c.value, "data-value")}${addAttribute(String(c.value === ""), "aria-pressed")}>${c.label}</button>`)}</div></div><div class="filter-result" data-filter-result aria-live="polite">—</div></div></aside></div></section><!-- 5. 直近の取引事例一覧 --><section class="section" aria-labelledby="tx-title"><div class="card"><div class="section-head"><div><h2 class="card-title" id="tx-title">直近の取引事例一覧</h2><p class="card-sub">上の絞り込み条件が反映されます。地区名をクリックすると地区別の詳細ページへ移動します。</p></div><span class="badge info">国土交通省 不動産情報ライブラリ</span></div><div class="table-wrap"><table class="data-table responsive"><thead><tr></tr></thead><tbody></tbody></table><div class="table-empty" data-table-empty hidden>条件に一致する取引事例がありません。</div></div><div class="table-foot"><span data-table-count class="num"></span><button type="button" class="btn btn-ghost" data-more style="height:38px;">さらに20件表示</button></div></div></section></div><script src="/assets/js/dashboard.js" defer><\/script>`;
}, "D:/xampp/htdocs/root/realestate-astro/src/components/AreaDashboard.astro", void 0);
//#endregion
export { $$AreaDashboard as t };
