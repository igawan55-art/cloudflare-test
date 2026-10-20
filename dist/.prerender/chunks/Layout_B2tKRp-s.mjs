import { P as InvalidComponentArgs, Z as AstroError, f as renderTemplate, h as addAttribute, l as renderSlot, m as renderHead, w as createAstro } from "./server_DB20_oXV.mjs";
//#region node_modules/astro/dist/runtime/server/astro-component.js
function validateArgs(args) {
	if (args.length !== 3) return false;
	if (!args[0] || typeof args[0] !== "object") return false;
	return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
	const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
	const fn = (...args) => {
		if (!validateArgs(args)) throw new AstroError({
			...InvalidComponentArgs,
			message: InvalidComponentArgs.message(name)
		});
		return cb(...args);
	};
	Object.defineProperty(fn, "name", {
		value: name,
		writable: false
	});
	fn.isAstroComponentFactory = true;
	fn.moduleId = moduleId;
	fn.propagation = propagation;
	return fn;
}
function createComponentWithOptions(opts) {
	return baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
}
function createComponent(arg1, moduleId, propagation) {
	if (typeof arg1 === "function") return baseCreateComponent(arg1, moduleId, propagation);
	else return createComponentWithOptions(arg1);
}
//#endregion
//#region src/layouts/Layout.astro
createAstro("https://astro.build");
var $$Layout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Layout;
	const { title, description = "国土交通省「不動産情報ライブラリ」の公的データをもとに、全国のエリア別不動産取引価格・相場推移をわかりやすく可視化する相場検索サイトです。" } = Astro.props;
	return renderTemplate`<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description"${addAttribute(description, "content")}><meta name="theme-color" content="#1E3A8A"><title>${title}</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/css/style.css"><script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\/script>${renderSlot($$result, $$slots["head"])}${renderHead($$result)}</head><body><header class="site-header"><div class="container bar"><a href="/" class="brand" aria-label="RealEstate Analytics トップへ"><span class="brand-mark" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V10l7-5 7 5v11"></path><path d="M9 21v-5h6v5"></path><path d="M9 12h.01M15 12h.01"></path></svg></span><span><span class="brand-name">RealEstate Analytics</span><br><span class="brand-tagline">公的データ（国土交通省 不動産情報ライブラリ）に基づく相場検索</span></span></a><nav class="site-nav" aria-label="メインメニュー"><a href="/">トップ</a><a href="/#popular">エリア一覧</a><a href="/#about-data">データについて</a><a href="/#search" class="is-cta">相場を調べる</a></nav></div></header><main class="main-content">${renderSlot($$result, $$slots["default"])}</main><footer class="site-footer" id="about-data"><div class="container"><div class="footer-grid"><div><div class="footer-title">データの出典と集計方法</div><p class="footer-note">本サイトの取引価格情報は、国土交通省が提供する「不動産情報ライブラリ」API（不動産価格（取引価格・成約価格）情報、鑑定評価書情報）から取得したデータを加工・集計して作成しています。 平均価格・㎡単価は取引価格が記録されている事例のみを対象とした単純平均で、坪単価は ㎡単価 × 3.30578 で算出しています。 前年比騰落率は、同エリアの地価公示（標準地）の対前年変動率の平均値です。</p><div class="footer-source"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg><div>出典：国土交通省 <a href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noopener">不動産情報ライブラリ</a><br><span class="footer-note">このサービスは、国土交通省の不動産情報ライブラリのAPI機能を使用していますが、提供情報の最新性、正確性、完全性等が保証されたものではありません。</span></div></div></div><div><div class="footer-title">ご利用にあたって</div><p class="footer-note">掲載している相場は過去の取引実績に基づく参考値であり、個別物件の価格や将来の価格を保証するものではありません。 実際のお取引にあたっては、不動産会社・不動産鑑定士などの専門家にご相談ください。</p></div><div><div class="footer-title">サイト情報</div><ul class="footer-list"><li><a href="/">トップページ</a></li><li><a href="/#search">エリアから相場を探す</a></li><li><a href="/terms">利用規約</a></li><li><a href="/privacy">プライバシーポリシー</a></li></ul></div></div><div class="footer-bottom"><span>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} RealEstate Analytics</span><span>データ対象期間：2023年第1四半期〜第4四半期</span></div></div></footer></body></html>`;
}, "D:/xampp/htdocs/root/realestate-astro/src/layouts/Layout.astro", void 0);
//#endregion
export { createComponent as n, $$Layout as t };
