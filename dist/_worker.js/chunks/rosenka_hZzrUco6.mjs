globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { T as createAstro, a as renderComponent, f as renderTemplate } from "./server_C4b5Dyho.mjs";
import { t as createComponent } from "./compiler_B-lTv1lO.mjs";
import { t as $$CityDetailPage } from "./CityDetailPage_DPW3Ldlt.mjs";
//#region src/pages/[pref]/[city]/rosenka.astro
var rosenka_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Rosenka,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://chikashiru.jp");
var $$Rosenka = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Rosenka;
	const { pref: prefSlug, city: municipalityCode } = Astro.params;
	return renderTemplate`${renderComponent($$result, "CityDetailPage", $$CityDetailPage, {
		"prefSlug": prefSlug,
		"municipalityCode": municipalityCode,
		"type": "rosenka"
	})}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/rosenka.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/rosenka.astro";
var $$url = "/[pref]/[city]/rosenka";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]/rosenka@_@astro
var page = () => rosenka_exports;
//#endregion
export { page };

//# sourceMappingURL=rosenka_hZzrUco6.mjs.map