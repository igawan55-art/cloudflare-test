globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { T as createAstro, a as renderComponent, f as renderTemplate } from "./server_C4b5Dyho.mjs";
import { t as createComponent } from "./compiler_B-lTv1lO.mjs";
import { t as $$CityDetailPage } from "./CityDetailPage_DPW3Ldlt.mjs";
//#region src/pages/[pref]/[city]/official.astro
var official_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Official,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://chikashiru.jp");
var $$Official = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Official;
	const { pref: prefSlug, city: municipalityCode } = Astro.params;
	return renderTemplate`${renderComponent($$result, "CityDetailPage", $$CityDetailPage, {
		"prefSlug": prefSlug,
		"municipalityCode": municipalityCode,
		"type": "official"
	})}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/official.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/official.astro";
var $$url = "/[pref]/[city]/official";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]/official@_@astro
var page = () => official_exports;
//#endregion
export { page };

//# sourceMappingURL=official_sPJRMS7D.mjs.map