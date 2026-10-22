globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { E as createComponent, T as createAstro, a as renderComponent, f as renderTemplate } from "./compiler_BtRSHKO3.mjs";
import { a as VALID_TYPES } from "./marketReport_2x12qc74.mjs";
import { t as $$DistrictDetailPage } from "./DistrictDetailPage_3p-Gt1tJ.mjs";
//#region src/pages/[pref]/[city]/[district]/[type].astro
var _type__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Type,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://cloudflare-test.pages.dev");
var $$Type = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Type;
	const { pref: prefSlug, city: municipalityCode, district: districtCode, type } = Astro.params;
	if (!type || !VALID_TYPES.includes(type)) return Astro.redirect(`/${prefSlug}/${municipalityCode}/${districtCode}/`);
	return renderTemplate`${renderComponent($$result, "DistrictDetailPage", $$DistrictDetailPage, {
		"prefSlug": prefSlug,
		"municipalityCode": municipalityCode,
		"districtCode": districtCode,
		"type": type
	})}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/[district]/[type].astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/[district]/[type].astro";
var $$url = "/[pref]/[city]/[district]/[type]";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]/[district]/[type]@_@astro
var page = () => _type__exports;
//#endregion
export { page };

//# sourceMappingURL=_type__C14-9Ob5.mjs.map