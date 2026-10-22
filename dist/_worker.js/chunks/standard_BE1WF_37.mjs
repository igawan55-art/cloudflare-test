globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { E as createComponent, T as createAstro, a as renderComponent, f as renderTemplate } from "./compiler_BtRSHKO3.mjs";
import { t as $$CityDetailPage } from "./CityDetailPage_DSE0bbAp.mjs";
//#region src/pages/[pref]/[city]/standard.astro
var standard_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Standard,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://cloudflare-test.pages.dev");
var $$Standard = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Standard;
	const { pref: prefSlug, city: municipalityCode } = Astro.params;
	return renderTemplate`${renderComponent($$result, "CityDetailPage", $$CityDetailPage, {
		"prefSlug": prefSlug,
		"municipalityCode": municipalityCode,
		"type": "standard"
	})}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/standard.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/standard.astro";
var $$url = "/[pref]/[city]/standard";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]/standard@_@astro
var page = () => standard_exports;
//#endregion
export { page };

//# sourceMappingURL=standard_BE1WF_37.mjs.map