globalThis.process ??= {};
globalThis.process.env ??= {};
import { r as verifyOptions, s as isESMImportedImage, t as baseService } from "./service_4aNV5NDo.mjs";
//#region node_modules/astro/dist/assets/services/noop.js
var noopService = {
	...baseService,
	propertiesToHash: ["src"],
	async validateOptions(options) {
		if (isESMImportedImage(options.src) && options.src.format === "svg") options.format = "svg";
		else delete options.format;
		verifyOptions(options);
		return options;
	},
	async transform(inputBuffer, transformOptions) {
		return {
			data: inputBuffer,
			format: transformOptions.format
		};
	}
};
//#endregion
export { noopService as default };

//# sourceMappingURL=noop_CgqkaO-6.mjs.map