globalThis.process ??= {};
globalThis.process.env ??= {};
//#region node_modules/unstorage/drivers/utils/index.mjs
function defineDriver(factory) {
	return factory;
}
//#endregion
//#region node_modules/unstorage/drivers/memory.mjs
var DRIVER_NAME = "memory";
//#endregion
//#region \0virtual:astro:session-driver
var _virtual_astro_session_driver_default = defineDriver(() => {
	const data = /* @__PURE__ */ new Map();
	return {
		name: DRIVER_NAME,
		getInstance: () => data,
		hasItem(key) {
			return data.has(key);
		},
		getItem(key) {
			return data.get(key) ?? null;
		},
		getItemRaw(key) {
			return data.get(key) ?? null;
		},
		setItem(key, value) {
			data.set(key, value);
		},
		setItemRaw(key, value) {
			data.set(key, value);
		},
		removeItem(key) {
			data.delete(key);
		},
		getKeys() {
			return [...data.keys()];
		},
		clear() {
			data.clear();
		},
		dispose() {
			data.clear();
		}
	};
});
//#endregion
export { _virtual_astro_session_driver_default as default };

//# sourceMappingURL=_virtual_astro_session-driver_mwNecSIa.mjs.map