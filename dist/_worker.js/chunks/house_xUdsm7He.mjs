globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { E as createComponent, T as createAstro, a as renderComponent, f as renderTemplate } from "./compiler_BtRSHKO3.mjs";
import { t as $$CityDetailPage } from "./CityDetailPage_DSE0bbAp.mjs";
//#region src/pages/[pref]/[city]/house.astro
var house_exports = /* @__PURE__ */ __exportAll({
	default: () => $$House,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://cloudflare-test.pages.dev");
var $$House = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$House;
	const { pref: prefSlug, city: municipalityCode } = Astro.params;
	return renderTemplate`${renderComponent($$result, "CityDetailPage", $$CityDetailPage, {
		"prefSlug": prefSlug,
		"municipalityCode": municipalityCode,
		"type": "house"
	})}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/house.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/house.astro";
var $$url = "/[pref]/[city]/house";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]/house@_@astro
var page = () => house_exports;
//#endregion
export { page };

//# sourceMappingURL=house_xUdsm7He.mjs.map