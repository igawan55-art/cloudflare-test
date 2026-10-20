import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as getDb, n as getCityIndex, r as getDistrictsByCity } from "./areaStats_Gh6Yhqx4.mjs";
//#region src/pages/api/districts/[city].json.js
var _city__json_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	getStaticPaths: () => getStaticPaths
});
async function getStaticPaths() {
	const db = getDb();
	return (await getCityIndex(db)).map((c) => ({ params: { city: c.code } }));
}
async function GET({ params }) {
	const db = getDb();
	const districts = await getDistrictsByCity(db, params.city);
	return new Response(JSON.stringify(districts), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/districts/[city].json@_@js
var page = () => _city__json_exports;
//#endregion
export { page };
