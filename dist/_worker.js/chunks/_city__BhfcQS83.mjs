globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { T as createAstro, a as renderComponent, f as renderTemplate } from "./server_C4b5Dyho.mjs";
import { t as createComponent } from "./compiler_B-lTv1lO.mjs";
import { t as $$CityDetailPage } from "./CityDetailPage_DPW3Ldlt.mjs";
//#region src/pages/[pref]/[city].astro
var _city__exports = /* @__PURE__ */ __exportAll({
	default: () => $$City,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://chikashiru.jp");
var $$City = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$City;
	const { pref: prefSlug, city: municipalityCode } = Astro.params;
	return renderTemplate`${renderComponent($$result, "CityDetailPage", $$CityDetailPage, {
		"prefSlug": prefSlug,
		"municipalityCode": municipalityCode,
		"type": "index"
	})}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city].astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city].astro";
var $$url = "/[pref]/[city]";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]@_@astro
var page = () => _city__exports;
//#endregion
export { page };

//# sourceMappingURL=_city__BhfcQS83.mjs.map