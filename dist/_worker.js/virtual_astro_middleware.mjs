globalThis.process ??= {};
globalThis.process.env ??= {};
import { t as sequence } from "./chunks/sequence_7HsH9dGT.mjs";
//#region src/middleware.js
var BLOCKED_BOT_REGEX = new RegExp([
	"bytespider",
	"gptbot",
	"chatgpt-user",
	"ccbot",
	"anthropic-ai",
	"claudebot",
	"claude-web",
	"cohere-ai",
	"perplexitybot",
	"ahrefsbot",
	"semrushbot",
	"dotbot",
	"mj12bot",
	"petalbot",
	"dataforseobot",
	"baiduspider",
	"yandex",
	"sogou",
	"exabot",
	"seekport",
	"megaindex",
	"censysinspect",
	"zgrab",
	"sqlmap",
	"nikto"
].join("|"), "i");
var SUSPICIOUS_PATHS = [
	".php",
	"wp-admin",
	"wp-login",
	"xmlrpc.php",
	".env",
	".git",
	"cgi-bin",
	"setup.php",
	"phpmyadmin"
];
async function onRequest$1(context, next) {
	const pathname = new URL(context.request.url).pathname.toLowerCase();
	const ua = (context.request.headers.get("user-agent") || "").toLowerCase();
	for (const badPath of SUSPICIOUS_PATHS) if (pathname.includes(badPath)) return new Response("Not Found", { status: 404 });
	if (BLOCKED_BOT_REGEX.test(ua)) return new Response("Access Denied: Automated scraping is blocked to preserve server resources.", {
		status: 403,
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=86400"
		}
	});
	if (!ua || ua.trim() === "") return new Response("Forbidden: Missing User-Agent", { status: 403 });
	if (pathname.startsWith("/_astro/") || pathname.startsWith("/assets/") || pathname.startsWith("/sitemaps/") || pathname === "/robots.txt" || pathname === "/sitemap.xml" || pathname === "/favicon.svg") return next();
	return next();
}
//#endregion
//#region \0virtual:astro:middleware
var onRequest = sequence(onRequest$1);
//#endregion
export { onRequest };

//# sourceMappingURL=virtual_astro_middleware.mjs.map