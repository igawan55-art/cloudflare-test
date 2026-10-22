globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { E as createComponent, T as createAstro, a as renderComponent, f as renderTemplate } from "./compiler_BtRSHKO3.mjs";
import { t as $$DistrictDetailPage } from "./DistrictDetailPage_3p-Gt1tJ.mjs";
//#region src/pages/[pref]/[city]/[district]/index.astro
var _district__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://cloudflare-test.pages.dev");
var $$Index = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const { pref: prefSlug, city: municipalityCode, district: districtCode } = Astro.params;
	return renderTemplate`${renderComponent($$result, "DistrictDetailPage", $$DistrictDetailPage, {
		"prefSlug": prefSlug,
		"municipalityCode": municipalityCode,
		"districtCode": districtCode,
		"type": "index"
	})}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/[district]/index.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/[district]/index.astro";
var $$url = "/[pref]/[city]/[district]";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]/[district]/index@_@astro
var page = () => _district__exports;
//#endregion
export { page };

//# sourceMappingURL=index_BWSWOPyM.mjs.map