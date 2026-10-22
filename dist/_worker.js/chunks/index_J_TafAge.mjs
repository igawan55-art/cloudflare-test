globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { E as createComponent, a as renderComponent, f as renderTemplate, g as defineScriptVars, h as addAttribute, p as maybeRenderHead } from "./compiler_BtRSHKO3.mjs";
import { a as SITE_URL, n as buildArticleSchema, r as buildBreadcrumbSchema, t as $$Layout } from "./Layout_Bson63KP.mjs";
import { l as getDb, r as getCityIndex } from "./areaStats_vdvDVox9.mjs";
//#region src/pages/areas/index.astro
var areas_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const db = getDb();
	const cities = await getCityIndex(db);
	const PREFECTURE_NAMES = {
		"01": "北海道",
		"02": "青森県",
		"03": "岩手県",
		"04": "宮城県",
		"05": "秋田県",
		"06": "山形県",
		"07": "福島県",
		"08": "茨城県",
		"09": "栃木県",
		"10": "群馬県",
		"11": "埼玉県",
		"12": "千葉県",
		"13": "東京都",
		"14": "神奈川県",
		"15": "新潟県",
		"16": "富山県",
		"17": "石川県",
		"18": "福井県",
		"19": "山梨県",
		"20": "長野県",
		"21": "岐阜県",
		"22": "静岡県",
		"23": "愛知県",
		"24": "三重県",
		"25": "滋賀県",
		"26": "京都府",
		"27": "大阪府",
		"28": "兵庫県",
		"29": "奈良県",
		"30": "和歌山県",
		"31": "鳥取県",
		"32": "島根県",
		"33": "岡山県",
		"34": "広島県",
		"35": "山口県",
		"36": "徳島県",
		"37": "香川県",
		"38": "愛媛県",
		"39": "高知県",
		"40": "福岡県",
		"41": "佐賀県",
		"42": "長崎県",
		"43": "熊本県",
		"44": "大分県",
		"45": "宮崎県",
		"46": "鹿児島県",
		"47": "沖縄県"
	};
	const REGIONS = [
		{
			name: "北海道",
			codes: ["01"]
		},
		{
			name: "東北",
			codes: [
				"02",
				"03",
				"04",
				"05",
				"06",
				"07"
			]
		},
		{
			name: "関東",
			codes: [
				"08",
				"09",
				"10",
				"11",
				"12",
				"13",
				"14"
			]
		},
		{
			name: "中部",
			codes: [
				"15",
				"16",
				"17",
				"18",
				"19",
				"20",
				"21",
				"22",
				"23"
			]
		},
		{
			name: "近畿",
			codes: [
				"24",
				"25",
				"26",
				"27",
				"28",
				"29",
				"30"
			]
		},
		{
			name: "中国",
			codes: [
				"31",
				"32",
				"33",
				"34",
				"35"
			]
		},
		{
			name: "四国",
			codes: [
				"36",
				"37",
				"38",
				"39"
			]
		},
		{
			name: "九州・沖縄",
			codes: [
				"40",
				"41",
				"42",
				"43",
				"44",
				"45",
				"46",
				"47"
			]
		}
	];
	const prefMap = /* @__PURE__ */ new Map();
	for (const [id, name] of Object.entries(PREFECTURE_NAMES)) prefMap.set(id, {
		id,
		slug: `pref${id}`,
		name,
		count: 0,
		cities: []
	});
	for (const c of cities) {
		const prefId = c.code.slice(0, 2);
		const target = prefMap.get(prefId);
		if (target) {
			target.count += c.count;
			target.cities.push({
				code: c.code,
				name: c.name,
				count: c.count
			});
		}
	}
	const prefDataJson = JSON.stringify(Object.fromEntries(prefMap)).replace(/</g, "\\u003c");
	const pageTitle = "全国の不動産相場 エリア一覧｜都道府県・市区町村・町字から探す";
	const pageDesc = "全国47都道府県の不動産相場（中古マンション・戸建て・土地）のエリア一覧。都道府県を選択すると市区町村および配下の町字一覧から詳細な相場情報をご覧いただけます。";
	const breadcrumbs = buildBreadcrumbSchema([{
		name: "トップ",
		url: "/"
	}, {
		name: "エリア一覧",
		url: "/areas"
	}]);
	const canonicalUrl = `${SITE_URL}/areas`;
	const articleSchema = buildArticleSchema({
		title: pageTitle,
		headline: "全国47都道府県の不動産相場・地価エリア一覧",
		description: pageDesc,
		url: canonicalUrl
	});
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": pageTitle,
		"description": pageDesc,
		"canonical": canonicalUrl,
		"jsonLd": [breadcrumbs, articleSchema],
		"data-astro-cid-bwathwbw": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="page-head" data-astro-cid-bwathwbw><div class="container" data-astro-cid-bwathwbw><nav class="breadcrumb" aria-label="パンくずリスト" data-astro-cid-bwathwbw><a href="/" data-astro-cid-bwathwbw>トップ</a><span class="sep" data-astro-cid-bwathwbw>/</span><span aria-current="page" data-astro-cid-bwathwbw>エリア一覧</span></nav><span class="eyebrow" data-astro-cid-bwathwbw>全国 47都道府県</span><h1 class="page-title" style="margin-top:10px;" data-astro-cid-bwathwbw>エリアから相場を探す</h1><p style="color:var(--muted); font-size:0.95rem; margin-top:8px;" data-astro-cid-bwathwbw>都道府県を選択すると、市区町村と配下の町字（町名）別の相場情報をご覧いただけます。</p></div></section><div class="container" style="padding-top: 32px; padding-bottom: 64px;" data-astro-cid-bwathwbw><div class="regions-list" data-astro-cid-bwathwbw>${REGIONS.map((reg) => renderTemplate`<section class="region-section" data-astro-cid-bwathwbw><h2 class="region-title" data-astro-cid-bwathwbw>${reg.name}</h2><div class="pref-grid" data-astro-cid-bwathwbw>${reg.codes.map((code) => {
		const p = prefMap.get(code);
		return renderTemplate`<button type="button" class="pref-card"${addAttribute(p.slug, "data-open-modal")}${addAttribute(p.id, "data-pref-id")} aria-haspopup="dialog" data-astro-cid-bwathwbw><span class="pref-name" data-astro-cid-bwathwbw>${p.name}</span><span class="pref-meta" data-astro-cid-bwathwbw><span data-astro-cid-bwathwbw>${p.cities.length} 市区町村</span><span class="pref-count" data-astro-cid-bwathwbw>${p.count.toLocaleString()} 件</span></span><svg class="pref-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-astro-cid-bwathwbw><path d="m9 18 6-6-6-6" data-astro-cid-bwathwbw></path></svg></button>`;
	})}</div></section>`)}</div></div><div id="area-modal" class="modal-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="modal-title" data-astro-cid-bwathwbw><div class="modal-card" data-astro-cid-bwathwbw><!-- モーダルヘッダー --><div class="modal-header" data-astro-cid-bwathwbw><div data-astro-cid-bwathwbw><nav id="modal-breadcrumb" class="modal-breadcrumb" data-astro-cid-bwathwbw><span id="modal-crumb-pref" class="crumb-active" data-astro-cid-bwathwbw>東京都</span><span id="modal-crumb-sep" class="sep" hidden data-astro-cid-bwathwbw>/</span><span id="modal-crumb-city" class="crumb-sub" hidden data-astro-cid-bwathwbw>港区</span></nav><div style="display:flex; align-items:center; gap:12px; margin-top:2px; flex-wrap:wrap;" data-astro-cid-bwathwbw><h3 id="modal-title" class="modal-title" style="margin:0;" data-astro-cid-bwathwbw>東京都の市区町村一覧</h3><a id="modal-pref-page-link" href="#" class="btn-sm" style="font-size:0.75rem; font-weight:600; padding:3px 10px; background:var(--primary-50, #eff6ff); color:var(--primary); border:1px solid var(--border); border-radius:4px; text-decoration:none;" data-astro-cid-bwathwbw>都道府県サマリーを見る &rarr;</a></div></div><button type="button" id="modal-close-btn" class="modal-close" aria-label="閉じる" data-astro-cid-bwathwbw><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-bwathwbw><path d="M18 6 6 18M6 6l12 12" data-astro-cid-bwathwbw></path></svg></button></div><!-- モーダル本体コンテンツ --><div class="modal-body" data-astro-cid-bwathwbw><!-- ステップ1: 市区町村一覧ビュー --><div id="view-cities" class="view-panel" data-astro-cid-bwathwbw><div id="cities-list" class="city-grid" data-astro-cid-bwathwbw></div><div id="cities-empty" class="empty-msg" hidden data-astro-cid-bwathwbw>該当する市区町村がありません</div></div><!-- ステップ2: 配下の町字一覧ビュー --><div id="view-districts" class="view-panel" hidden data-astro-cid-bwathwbw><div class="district-nav-bar" data-astro-cid-bwathwbw><button type="button" id="back-to-cities-btn" class="btn btn-ghost btn-sm" data-astro-cid-bwathwbw><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-bwathwbw><path d="m15 18-6-6 6-6" data-astro-cid-bwathwbw></path></svg>市区町村一覧に戻る</button><a id="city-page-link" href="#" class="city-page-link" data-astro-cid-bwathwbw><span id="city-page-link-text" data-astro-cid-bwathwbw>港区全体の相場を見る</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-bwathwbw><path d="M5 12h14M12 5l7 7-7 7" data-astro-cid-bwathwbw></path></svg></a></div><div id="districts-loading" class="loading-state" data-astro-cid-bwathwbw><div class="spinner" data-astro-cid-bwathwbw></div><p data-astro-cid-bwathwbw>町字データを読み込み中...</p></div><div id="districts-list" class="district-grid" hidden data-astro-cid-bwathwbw></div><div id="districts-empty" class="empty-msg" hidden data-astro-cid-bwathwbw>登録されている町字がありません</div></div></div></div></div>` })}<script>(function(){${defineScriptVars({ prefDataJson })}
    const prefData = JSON.parse(prefDataJson);
    const modal = document.getElementById('area-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const crumbPref = document.getElementById('modal-crumb-pref');
    const crumbSep = document.getElementById('modal-crumb-sep');
    const crumbCity = document.getElementById('modal-crumb-city');

    const viewCities = document.getElementById('view-cities');
    const viewDistricts = document.getElementById('view-districts');
    const citiesList = document.getElementById('cities-list');
    const citiesEmpty = document.getElementById('cities-empty');
    const districtsList = document.getElementById('districts-list');
    const districtsLoading = document.getElementById('districts-loading');
    const districtsEmpty = document.getElementById('districts-empty');
    const backBtn = document.getElementById('back-to-cities-btn');
    const cityPageLink = document.getElementById('city-page-link');
    const cityPageLinkText = document.getElementById('city-page-link-text');
    const modalPrefPageLink = document.getElementById('modal-pref-page-link');

    let currentPref = null;
    let currentCity = null;
    let currentDistrictsCache = new Map(); // cityCode -> districts[]

    function getSelectedType() {
        return new URLSearchParams(location.search).get('type') || '';
    }

    function appendType(url) {
        const type = getSelectedType();
        if (!type) return url;
        const u = new URL(url, location.origin);
        u.searchParams.set('type', type);
        return u.pathname + u.search + u.hash;
    }

    function openPrefecture(prefId) {
        const data = prefData[prefId];
        if (!data) return;
        currentPref = data;
        currentCity = null;

        // モーダルヘッダー初期化
        crumbPref.textContent = data.name;
        crumbSep.hidden = true;
        crumbCity.hidden = true;
        modalTitle.textContent = \`\${data.name} の市区町村一覧（\${data.cities.length}）\`;
        if (modalPrefPageLink) {
            modalPrefPageLink.href = \`/\${data.slug}/\`;
            modalPrefPageLink.textContent = \`\${data.name}の相場・地価サマリーを見る →\`;
        }

        // ビュー切り替え
        viewCities.hidden = false;
        viewDistricts.hidden = true;

        renderCities(data.cities);

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function renderCities(cityList) {
        citiesList.innerHTML = '';
        if (!cityList.length) {
            citiesEmpty.hidden = false;
            return;
        }
        citiesEmpty.hidden = true;

        cityList.forEach((c) => {
            const a = document.createElement('a');
            a.className = 'city-card';
            a.href = appendType(\`/\${currentPref.slug}/\${c.code}\`);
            a.innerHTML = \`
                <span class="city-card-name">\${c.name}</span>
                <span class="city-card-count">\${(c.count || 0).toLocaleString()} 件</span>
            \`;
            a.addEventListener('click', (e) => {
                // Ctrl / Cmd / Shift クリックや中クリック時は新規タブ等で通常遷移させる
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
                    return;
                }
                e.preventDefault();
                openDistricts(c);
            });
            citiesList.appendChild(a);
        });
    }

    async function openDistricts(city) {
        currentCity = city;
        const prefSlug = currentPref.slug;

        crumbSep.hidden = false;
        crumbCity.hidden = false;
        crumbCity.textContent = city.name;
        modalTitle.textContent = \`\${currentPref.name}\${city.name} の町字一覧\`;

        viewCities.hidden = true;
        viewDistricts.hidden = false;

        cityPageLink.href = appendType(\`/\${prefSlug}/\${city.code}\`);
        cityPageLinkText.textContent = \`\${city.name} 全体の相場を見る\`;

        districtsList.innerHTML = '';
        districtsList.hidden = true;
        districtsEmpty.hidden = true;
        districtsLoading.hidden = false;

        try {
            let districts = currentDistrictsCache.get(city.code);
            if (!districts) {
                const res = await fetch(\`/api/districts/\${city.code}.json\`);
                districts = res.ok ? await res.json() : [];
                currentDistrictsCache.set(city.code, districts);
            }
            districtsLoading.hidden = true;
            modalTitle.textContent = \`\${currentPref.name}\${city.name} の町字一覧（\${districts.length}）\`;
            renderDistricts(districts);
        } catch (err) {
            console.error('[areas] 町字データの読み込みエラー:', err);
            districtsLoading.hidden = true;
            districtsEmpty.hidden = false;
        }
    }

    function renderDistricts(districtList) {
        districtsList.innerHTML = '';
        if (!districtList || !districtList.length) {
            districtsEmpty.hidden = false;
            districtsList.hidden = true;
            return;
        }
        districtsEmpty.hidden = true;
        districtsList.hidden = false;

        districtList.forEach((d) => {
            const a = document.createElement('a');
            a.className = 'district-card';
            a.href = appendType(\`/\${currentPref.slug}/\${currentCity.code}/\${d.code}\`);
            a.innerHTML = \`
                <span class="district-name">\${d.name}</span>
                <span class="district-count">\${(d.count || 0).toLocaleString()} 件</span>
            \`;
            districtsList.appendChild(a);
        });
    }

    function backToCities() {
        if (!currentPref) return;
        currentCity = null;
        crumbSep.hidden = true;
        crumbCity.hidden = true;
        modalTitle.textContent = \`\${currentPref.name} の市区町村一覧（\${currentPref.cities.length}）\`;
        viewCities.hidden = false;
        viewDistricts.hidden = true;
        renderCities(currentPref.cities);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    // パンくずの都道府県クリックで市区町村へ戻る
    crumbPref.addEventListener('click', backToCities);
    backBtn.addEventListener('click', backToCities);

    // 都道府県カードクリック
    document.querySelectorAll('[data-open-modal]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const prefId = btn.dataset.prefId;
            openPrefecture(prefId);
        });
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    // URLハッシュ（例: /areas#pref13）で直接特定都道府県のモーダルを開く
    const hash = location.hash.replace('#', '');
    if (hash.startsWith('pref')) {
        const id = hash.replace('pref', '');
        if (prefData[id]) openPrefecture(id);
    }
})();<\/script>`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/areas/index.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/areas/index.astro";
var $$url = "/areas";
//#endregion
//#region \0virtual:astro:page:src/pages/areas/index@_@astro
var page = () => areas_exports;
//#endregion
export { page };

//# sourceMappingURL=index_J_TafAge.mjs.map