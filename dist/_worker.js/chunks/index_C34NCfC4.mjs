globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { E as createComponent, a as renderComponent, f as renderTemplate, g as defineScriptVars, h as addAttribute, p as maybeRenderHead, t as defineStyleVars } from "./compiler_BtRSHKO3.mjs";
import { a as SITE_URL, n as buildArticleSchema, t as $$Layout } from "./Layout_Bson63KP.mjs";
import { t as $$AreaDashboard } from "./AreaDashboard_BleeDO4s.mjs";
import { a as getNationalFluctuation, l as getDb, r as getCityIndex, t as getAreaStats } from "./areaStats_CE41jAJX.mjs";
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const desktopBg = { src: "/assets/images/background.jpg" };
	const mobileBg = { src: "/assets/images/background.jpg" };
	const db = getDb();
	const cities = await getCityIndex(db);
	const stats = await getAreaStats(db, { rowLimit: 200 });
	const fluctuation = await getNationalFluctuation(db);
	const prefMap = /* @__PURE__ */ new Map();
	for (const c of cities) if (!prefMap.has(c.pref)) prefMap.set(c.pref, c.prefName);
	const prefectures = [...prefMap.entries()].map(([id, name]) => ({
		id,
		name
	})).sort((a, b) => a.id.localeCompare(b.id));
	const popular = [...cities].sort((a, b) => b.count - a.count).slice(0, 16);
	const maxCount = popular[0]?.count || 1;
	const totalCount = Object.values(stats.types).reduce((s, t) => s + t.count, 0);
	const cityOptions = JSON.stringify(cities.map((c) => [
		c.pref,
		c.code,
		c.name
	])).replace(/</g, "\\u003c");
	const pageTitle = "公的データでわかる不動産相場｜チカシル（国土交通省 不動産情報ライブラリ）";
	const pageDesc = "国土交通省「不動産情報ライブラリ」の公的データをもとに、全国の不動産取引価格・路線価・公示地価をわかりやすく可視化する相場検索サイトです。";
	const canonicalUrl = `${SITE_URL}/`;
	const articleSchema = buildArticleSchema({
		title: pageTitle,
		headline: "不動産の取引価格、路線価、公示価格、地価を知る - チカシル",
		description: pageDesc,
		url: canonicalUrl
	});
	const $$definedVars = defineStyleVars([{
		desktopBg: `url('${desktopBg.src}')`,
		mobileBg: `url('${mobileBg.src}')`
	}]);
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": pageTitle,
		"description": pageDesc,
		"canonical": canonicalUrl,
		"jsonLd": articleSchema,
		"data-astro-cid-lcdefpme": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="hero" id="search"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><div class="container hero-grid"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><div${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><span class="eyebrow"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme></path></svg>国土交通省 不動産情報ライブラリ 準拠</span><h1${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>公的データでわかる、<br${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>納得の不動産相場</h1><p class="hero-lead"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>全国 <b class="num"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>${cities.length.toLocaleString()}</b> 市区町村・<b class="num"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>${totalCount.toLocaleString()}</b> 件の実際の取引価格をもとに、エリアごとの平均価格・坪単価・価格推移をわかりやすく可視化しています。</p><ul class="hero-points"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><li${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><path d="M20 6 9 17l-5-5"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme></path></svg>実際の成約・取引データ</li><li${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><path d="M20 6 9 17l-5-5"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme></path></svg>地価公示と比較</li><li${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><path d="M20 6 9 17l-5-5"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme></path></svg>会員登録不要・無料</li></ul></div><form class="card card-lg" id="area-search" aria-labelledby="search-title"${addAttribute(`box-shadow: var(--shadow-md);; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme><h2 class="card-title" id="search-title"${addAttribute(`font-size:1.15rem;; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme>エリアから相場を調べる</h2><p class="card-sub"${addAttribute(`margin-bottom:20px;; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme>都道府県・市区町村・町名を選択してください</p><div class="stack"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><div class="field"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><label for="pref-select"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>物件種別</label><div class="seg seg-full" role="tablist" aria-label="物件種別"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><button type="button" class="seg-btn" role="tab" data-search-type="mansion" aria-selected="true"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>中古マンション</button><button type="button" class="seg-btn" role="tab" data-search-type="house" aria-selected="false"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>戸建て</button><button type="button" class="seg-btn" role="tab" data-search-type="land" aria-selected="false"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>土地</button></div></div><div class="grid-2"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><div class="field"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><label for="pref-select"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>都道府県</label><select id="pref-select" class="select" required${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><option value=""${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>選択してください</option>${prefectures.map((p) => renderTemplate`<option${addAttribute(p.id, "value")}${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>${p.name}</option>`)}</select></div><div class="field"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><label for="city-select"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>市区町村</label><select id="city-select" class="select" disabled required${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><option value=""${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>先に都道府県を選択</option></select></div></div><div class="field"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><label for="district-select"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>町名・地区（任意）</label><select id="district-select" class="select" disabled${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><option value=""${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>先に市区町村を選択</option></select></div><button type="submit" class="btn btn-primary btn-block" id="search-btn" disabled${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><circle cx="11" cy="11" r="7"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme></circle><path d="m21 21-4.3-4.3"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme></path></svg>この条件で相場を見る</button></div></form></div></section><div class="container"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>${renderComponent($$result, "AreaDashboard", $$AreaDashboard, {
		"areaName": "全国",
		"stats": stats,
		"fluctuation": fluctuation,
		"showMunicipality": true,
		"data-astro-cid-lcdefpme": true
	})}<!-- 人気エリア --><section class="section" id="popular" aria-labelledby="popular-title"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><div class="section-head"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><div${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><h2 class="section-title" id="popular-title"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>取引件数の多いエリア</h2><p class="section-sub"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>取引件数上位の市区町村</p></div></div><div class="grid-2"${addAttribute(`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme>${popular.map((c, i) => renderTemplate`<a${addAttribute(`/${c.pref}/${c.code}`, "href")} class="card"${addAttribute(`display:flex; align-items:center; gap:16px; padding:18px 20px; color:inherit; text-decoration:none;; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme><span class="num"${addAttribute(`width:28px; font-weight:700; color:var(--subtle);; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme>${String(i + 1).padStart(2, "0")}</span><span${addAttribute(`flex:1; min-width:0;; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme><span${addAttribute(`display:block; font-size:0.75rem; color:var(--muted);; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme>${c.prefName}</span><span${addAttribute(`display:block; font-weight:700;; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme>${c.name}</span><span class="mini-bar"${addAttribute(`display:block; margin-top:8px;; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme><i${addAttribute(`${`width:${Math.round(c.count / maxCount * 100)}%`}; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme></i></span></span><span class="num"${addAttribute(`font-weight:700; color:var(--primary); white-space:nowrap;; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme>${c.count.toLocaleString()}<span${addAttribute(`font-size:0.75rem; color:var(--muted); font-weight:500;; ${$$definedVars}`, "style")} data-astro-cid-lcdefpme> 件</span></span></a>`)}</div></section><section class="section"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><div class="callout"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme><circle cx="12" cy="12" r="10"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme></circle><path d="M12 16v-4M12 8h.01"${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme></path></svg><div${addAttribute($$definedVars, "style")} data-astro-cid-lcdefpme>掲載データは国土交通省「不動産情報ライブラリ」で公開されている不動産取引価格情報です。個人が特定されないよう所在地は地区単位までとなっており、最寄駅などの情報は含まれません。集計方法の詳細はページ下部の「データの出典と集計方法」をご確認ください。</div></div></section></div>` })}<script>(function(){${defineScriptVars({ cityOptions })}
    const cityList = JSON.parse(cityOptions);
    const prefSel = document.getElementById('pref-select');
    const citySel = document.getElementById('city-select');
    const distSel = document.getElementById('district-select');
    const btn = document.getElementById('search-btn');
    const validTypes = ['mansion', 'house', 'land'];
    const initialUrlType = new URLSearchParams(location.search).get('type');
    let searchType = validTypes.includes(initialUrlType) ? initialUrlType : 'mansion';

    function syncSearchTabs(type) {
        searchType = type;
        document.querySelectorAll('[data-search-type]').forEach((x) => {
            x.setAttribute('aria-selected', String(x.dataset.searchType === type));
        });
    }
    syncSearchTabs(searchType);

    document.querySelectorAll('[data-search-type]').forEach((b) => {
        b.addEventListener('click', () => {
            const nextType = b.dataset.searchType;
            syncSearchTabs(nextType);
            // 下部のダッシュボードタブとも連動（URLの ?type= も dashboard.js 側で更新される）
            const dashTab = document.querySelector(\`[data-type-tab="\${nextType}"]\`);
            if (dashTab && dashTab.getAttribute('aria-selected') !== 'true') {
                dashTab.click();
            } else {
                const url = new URL(location.href);
                url.searchParams.set('type', nextType);
                history.pushState({ type: nextType }, '', url);
            }
        });
    });

    window.addEventListener('dashboard:typechange', (e) => {
        if (e.detail && e.detail.type) syncSearchTabs(e.detail.type);
    });

    prefSel.addEventListener('change', () => {
        const items = cityList.filter((c) => c[0] === prefSel.value);
        citySel.innerHTML = items.length
            ? '<option value="">選択してください</option>' + items.map((c) => \`<option value="\${c[1]}">\${c[2]}</option>\`).join('')
            : '<option value="">先に都道府県を選択</option>';
        citySel.disabled = !items.length;
        distSel.innerHTML = '<option value="">先に市区町村を選択</option>';
        distSel.disabled = true;
        btn.disabled = true;
    });

    citySel.addEventListener('change', async () => {
        const code = citySel.value;
        btn.disabled = !code;
        if (!code) {
            distSel.innerHTML = '<option value="">先に市区町村を選択</option>';
            distSel.disabled = true;
            return;
        }
        const cityName = citySel.options[citySel.selectedIndex]?.text || '市区町村';
        distSel.innerHTML = \`<option value="">読み込み中...</option>\`;
        distSel.disabled = true;
        try {
            const res = await fetch(\`/api/districts/\${code}.json\`);
            const districts = res.ok ? await res.json() : [];
            distSel.innerHTML =
                \`<option value="">すべて（\${cityName}全体）</option>\` +
                districts.map((d) => \`<option value="\${d.code}">\${d.name}</option>\`).join('');
            distSel.disabled = false;
        } catch {
            distSel.innerHTML = \`<option value="">すべて（\${cityName}全体）</option>\`;
            distSel.disabled = false;
        }
    });

    document.getElementById('area-search').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!prefSel.value || !citySel.value) return;
        const basePath = distSel.value
            ? \`/\${prefSel.value}/\${citySel.value}/\${distSel.value}\`
            : \`/\${prefSel.value}/\${citySel.value}\`;
        location.href = \`\${basePath}?type=\${encodeURIComponent(searchType)}\`;
    });
})();<\/script>`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/index.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };

//# sourceMappingURL=index_C34NCfC4.mjs.map