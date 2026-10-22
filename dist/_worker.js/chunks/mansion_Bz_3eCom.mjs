globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { E as createComponent, T as createAstro, a as renderComponent, f as renderTemplate } from "./compiler_BtRSHKO3.mjs";
import { t as $$CityDetailPage } from "./CityDetailPage_BnAbHo_9.mjs";
//#region src/pages/[pref]/[city]/mansion.astro
var mansion_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Mansion,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://cloudflare-test.pages.dev");
var $$Mansion = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Mansion;
	const { pref: prefSlug, city: municipalityCode } = Astro.params;
	return renderTemplate`${renderComponent($$result, "CityDetailPage", $$CityDetailPage, {
		"prefSlug": prefSlug,
		"municipalityCode": municipalityCode,
		"type": "mansion"
	})}`;
}, "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/mansion.astro", void 0);
var $$file = "D:/xampp/htdocs/root/realestate-astro/src/pages/[pref]/[city]/mansion.astro";
var $$url = "/[pref]/[city]/mansion";
//#endregion
//#region \0virtual:astro:page:src/pages/[pref]/[city]/mansion@_@astro
var page = () => mansion_exports;
//#endregion
export { page };

//# sourceMappingURL=mansion_Bz_3eCom.mjs.map