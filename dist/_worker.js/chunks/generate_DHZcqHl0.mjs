globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
//#region src/pages/api/sitemap/generate.json.js
var generate_json_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST
});
async function GET({ request }) {
	try {
		const { generateSitemaps } = await import(
			/* @vite-ignore */
			"../../../../scripts/generateSitemap.js"
);
		const url = new URL(request.url);
		const result = await generateSitemaps({ baseUrl: url.origin && !url.origin.includes("localhost") ? url.origin : void 0 });
		return new Response(JSON.stringify(result, null, 2), { headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store, no-cache"
		} });
	} catch (err) {
		return new Response(JSON.stringify({
			success: false,
			message: "Static sitemaps are pre-generated at /sitemap.xml",
			error: err.message
		}), {
			status: 200,
			headers: { "Content-Type": "application/json; charset=utf-8" }
		});
	}
}
async function POST(context) {
	return GET(context);
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/sitemap/generate.json@_@js
var page = () => generate_json_exports;
//#endregion
export { page };

//# sourceMappingURL=generate_DHZcqHl0.mjs.map