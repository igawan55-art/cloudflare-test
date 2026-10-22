globalThis.process ??= {};
globalThis.process.env ??= {};
import { C as unescapeHTML, E as createComponent, T as createAstro, f as renderTemplate, h as addAttribute, l as renderSlot, m as renderHead } from "./compiler_BtRSHKO3.mjs";
var SITE_URL = (typeof process !== "undefined" && process.env?.SITE_URL || "https://cloudflare-test.pages.dev").replace(/\/+$/, "");
var SITE_NAME = "チカシル";
/**
* 相対パスまたはURLから正規化された canonical URL を生成するヘルパー
* @param {string} [pathOrUrl] - 例: '/pref13/13112/rosenka' または フルURL
* @returns {string}
*/
function buildCanonicalUrl(pathOrUrl = "/") {
	if (!pathOrUrl) return `${SITE_URL}/`;
	if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
	return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}
//#endregion
//#region src/lib/structuredData.js
/**
* サイト全体の共通WebSite構造化データ
* 検索アクション（SearchAction）付き
*/
function buildWebSiteSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"name": SITE_NAME,
		"url": `${SITE_URL}/`,
		"description": "全国の不動産取引価格、路線価、公示価格、地価を知る相場検索サイト",
		"inLanguage": "ja",
		"potentialAction": {
			"@type": "SearchAction",
			"target": {
				"@type": "EntryPoint",
				"urlTemplate": `${SITE_URL}/areas?q={search_term_string}`
			},
			"query-input": "required name=search_term_string"
		}
	};
}
/**
* パンくずリスト構造化データ（BreadcrumbList）
* @param {Array<{ name: string, url?: string }>} items
*/
function buildBreadcrumbSchema(items = []) {
	if (!items || items.length === 0) return null;
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"itemListElement": items.map((item, index) => {
			const element = {
				"@type": "ListItem",
				"position": index + 1,
				"name": item.name
			};
			if (item.url) element.item = item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url.startsWith("/") ? "" : "/"}${item.url}`;
			return element;
		})
	};
}
/**
* 記事・コンテンツページ用 構造化データ（Article）
* 都道府県・市区町村・地区などの相場情報・地価解説コンテンツに適合
* @param {{
*   title: string,
*   description?: string,
*   url: string,
*   headline?: string,
*   datePublished?: string,
*   dateModified?: string,
*   authorName?: string,
*   image?: string
* }} opts
*/
function buildArticleSchema({ title, description = "", url, headline = title, datePublished = "2024-01-01T00:00:00+09:00", dateModified = "2026-10-01T00:00:00+09:00", authorName = SITE_NAME, image = `${SITE_URL}/assets/images/logo.svg` }) {
	const canonical = url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
	return {
		"@context": "https://schema.org",
		"@type": "Article",
		"mainEntityOfPage": {
			"@type": "WebPage",
			"@id": canonical
		},
		"headline": headline || title,
		"name": title,
		"description": description,
		"url": canonical,
		"image": [image],
		"datePublished": datePublished,
		"dateModified": dateModified,
		"author": {
			"@type": "Organization",
			"name": authorName,
			"url": `${SITE_URL}/`
		},
		"publisher": {
			"@type": "Organization",
			"name": SITE_NAME,
			"url": `${SITE_URL}/`,
			"logo": {
				"@type": "ImageObject",
				"url": `${SITE_URL}/assets/images/logo.svg`
			}
		},
		"inLanguage": "ja"
	};
}
/**
* FAQPage 構造化データ（Google検索のリッチリザルト用）
* @param {Array<{ question: string, answer: string }>} faqs
*/
function buildFaqSchema(faqs = []) {
	if (!faqs || faqs.length === 0) return null;
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": faqs.map((f) => ({
			"@type": "Question",
			"name": f.question,
			"acceptedAnswer": {
				"@type": "Answer",
				"text": f.answer
			}
		}))
	};
}
//#endregion
//#region src/layouts/Layout.astro
createAstro("https://cloudflare-test.pages.dev");
var $$Layout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Layout;
	const { title, description = "国土交通省「不動産情報ライブラリ」の公的データをもとに、全国のエリア別不動産取引価格・相場推移をわかりやすく可視化する相場検索サイトです。", canonical, jsonLd = null } = Astro.props;
	const canonicalHref = buildCanonicalUrl(canonical || Astro.url.pathname);
	if (Astro.response?.headers && !Astro.response.headers.has("Cache-Control")) Astro.response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
	const schemasToRender = [buildWebSiteSchema()];
	if (jsonLd) {
		if (Array.isArray(jsonLd)) schemasToRender.push(...jsonLd.filter(Boolean));
		else schemasToRender.push(jsonLd);
	}
	return renderTemplate`<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description"${addAttribute(description, "content")}><meta name="theme-color" content="#1E3A8A"><title>${title}</title><link rel="canonical"${addAttribute(canonicalHref, "href")}><link rel="icon" href="/favicon.ico?v=2" sizes="any"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/css/style.css"><script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\/script>${schemasToRender.map((schema) => renderTemplate`<script type="application/ld+json">${unescapeHTML(JSON.stringify(schema))}<\/script>`)}${renderSlot($$result, $$slots["head"])}${renderHead($$result)}</head><body><header class="site-header"><div class="container bar"><a href="/" class="brand" aria-label="チカシル トップへ"><span class="brand-logo-wrap"><img src="/assets/images/logo.svg" alt="チカシル" class="brand-logo" width="140" height="39"></span><span class="brand-text"><span class="brand-name sr-only">チカシル</span><span class="brand-tagline">不動産の取引価格、路線価、公示価格、地価を知る - チカシル</span></span></a><nav class="site-nav" aria-label="メインメニュー"><a href="/">トップ</a><a href="/areas">エリア一覧</a><a href="/#about-data">データについて</a><a href="/#search" class="is-cta">相場を調べる</a></nav></div></header><main class="main-content">${renderSlot($$result, $$slots["default"])}</main><footer class="site-footer" id="about-data"><div class="container"><div class="footer-grid"><div><div class="footer-title">データの出典と集計方法</div><p class="footer-note">本サイトの取引価格情報は、国土交通省が提供する「不動産情報ライブラリ」API（不動産価格（取引価格・成約価格）情報、鑑定評価書情報）から取得したデータを加工・集計して作成しています。 平均価格・㎡単価は取引価格が記録されている事例のみを対象とした単純平均で、坪単価は ㎡単価 × 3.30578 で算出しています。 前年比騰落率は、同エリアの地価公示（標準地）の対前年変動率の平均値です。</p><div class="footer-source"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg><div>出典：国土交通省 <a href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noopener">不動産情報ライブラリ</a><br><span class="footer-note">このサービスは、国土交通省の不動産情報ライブラリのAPI機能を使用していますが、提供情報の最新性、正確性、完全性等が保証されたものではありません。</span></div></div></div><div><div class="footer-title">ご利用にあたって</div><p class="footer-note">掲載している相場は過去の取引実績に基づく参考値であり、個別物件の価格や将来の価格を保証するものではありません。 実際のお取引にあたっては、不動産会社・不動産鑑定士などの専門家にご相談ください。</p></div><div><div class="footer-title">サイト情報</div><ul class="footer-list"><li><a href="/">トップページ</a></li><li><a href="/#search">エリアから相場を探す</a></li><li><a href="/terms">利用規約</a></li><li><a href="/privacy">プライバシーポリシー</a></li></ul></div></div><div class="footer-bottom"><span>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} チカシル</span><span>データ出典：国土交通省 不動産取引価格情報・地価公示（2022年〜最新）</span></div></div></footer></body></html>`;
}, "D:/xampp/htdocs/root/realestate-astro/src/layouts/Layout.astro", void 0);
//#endregion
export { SITE_URL as a, buildFaqSchema as i, buildArticleSchema as n, buildBreadcrumbSchema as r, $$Layout as t };

//# sourceMappingURL=Layout_Bson63KP.mjs.map