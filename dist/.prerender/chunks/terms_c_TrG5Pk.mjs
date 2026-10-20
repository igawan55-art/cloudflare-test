import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as renderComponent, f as renderTemplate, p as maybeRenderHead } from "./server_DB20_oXV.mjs";
import { n as createComponent, t as $$Layout } from "./Layout_B2tKRp-s.mjs";
//#region src/pages/terms.astro
var terms_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Terms,
	file: () => $$file,
	url: () => $$url
});
var $$Terms = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "利用規約｜RealEstate Analytics" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="page-head"><div class="container"><nav class="breadcrumb" aria-label="パンくずリスト"><a href="/">トップ</a><span class="sep">/</span><span aria-current="page">利用規約</span></nav><h1 class="page-title">利用規約</h1></div></section><div class="container"><article class="card card-lg section prose" style="max-width:860px;"><h2 class="card-title">第1条（本サービスについて）</h2><p>本サービスは、国土交通省「不動産情報ライブラリ」のAPIから取得した公的データを加工・集計し、不動産相場の参考情報として提供するものです。</p><h2 class="card-title" style="margin-top:24px;">第2条（情報の正確性）</h2><p>掲載情報の最新性・正確性・完全性について保証するものではありません。掲載内容は過去の取引実績に基づく参考値であり、個別物件の価格や将来の価格を示すものではありません。</p><h2 class="card-title" style="margin-top:24px;">第3条（免責）</h2><p>本サービスの利用により生じたいかなる損害についても、運営者は責任を負いません。不動産のお取引にあたっては、必ず専門家にご相談ください。</p><h2 class="card-title" style="margin-top:24px;">第4条（出典）</h2><p>出典：国土交通省 不動産情報ライブラリ（https://www.reinfolib.mlit.go.jp/）</p></article></div>` })}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/terms.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/terms.astro";
var $$url = "/terms";
//#endregion
//#region \0virtual:astro:page:src/pages/terms@_@astro
var page = () => terms_exports;
//#endregion
export { page };
