import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as renderComponent, f as renderTemplate, p as maybeRenderHead } from "./server_DB20_oXV.mjs";
import { n as createComponent, t as $$Layout } from "./Layout_B2tKRp-s.mjs";
//#region src/pages/privacy.astro
var privacy_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Privacy,
	file: () => $$file,
	url: () => $$url
});
var $$Privacy = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "プライバシーポリシー｜RealEstate Analytics" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="page-head"><div class="container"><nav class="breadcrumb" aria-label="パンくずリスト"><a href="/">トップ</a><span class="sep">/</span><span aria-current="page">プライバシーポリシー</span></nav><h1 class="page-title">プライバシーポリシー</h1></div></section><div class="container"><article class="card card-lg section prose" style="max-width:860px;"><h2 class="card-title">個人情報の取り扱い</h2><p>本サービスは会員登録不要で利用でき、氏名・連絡先などの個人情報を取得しません。</p><h2 class="card-title" style="margin-top:24px;">アクセス解析・Cookie</h2><p>サービス改善のため、アクセス解析ツールを利用する場合があります。これらはCookieを使用して匿名のトラフィックデータを収集するもので、個人を特定するものではありません。</p><h2 class="card-title" style="margin-top:24px;">掲載データについて</h2><p>掲載している取引データは国土交通省が公開している情報であり、個人が特定されないよう所在地は地区単位までに加工されています。</p></article></div>` })}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/privacy.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/privacy.astro";
var $$url = "/privacy";
//#endregion
//#region \0virtual:astro:page:src/pages/privacy@_@astro
var page = () => privacy_exports;
//#endregion
export { page };
