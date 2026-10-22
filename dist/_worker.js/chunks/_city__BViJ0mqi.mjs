globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as __exportAll } from "./rolldown-runtime_D7vh-g_o.mjs";
import { i as getDistrictsByCity, l as getDb } from "./areaStats_vdvDVox9.mjs";
//#region src/pages/api/districts/[city].json.js
var _city__json_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
async function GET({ params }) {
	const db = getDb();
	const districts = await getDistrictsByCity(db, params.city);
	return new Response(JSON.stringify(districts), { headers: {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "public, max-age=3600, s-maxage=86400"
	} });
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/districts/[city].json@_@js
var page = () => _city__json_exports;
//#endregion
export { page };

//# sourceMappingURL=_city__BViJ0mqi.mjs.map