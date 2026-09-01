const require_useRouter = require("./useRouter.cjs");
const require_Asset = require("./Asset.cjs");
let _tanstack_router_core = require("@tanstack/router-core");
let react = require("react");
let _tanstack_router_core_isServer = require("@tanstack/router-core/isServer");
let react_jsx_runtime = require("react/jsx-runtime");
let _tanstack_react_store = require("@tanstack/react-store");
//#region src/Scripts.tsx
/**
* Render body script tags collected from route matches and SSR manifests.
* Should be placed near the end of the document body.
*/
var Scripts = () => {
	const router = require_useRouter.useRouter();
	const nonce = router.options.ssr?.nonce;
	const getScripts = (matches) => {
		matches = (0, _tanstack_router_core._getAssetMatches)(matches);
		const scripts = matches.flatMap((match) => match.scripts ?? []).filter(Boolean).map(({ children, ...script }) => ({
			tag: "script",
			attrs: {
				...script,
				suppressHydrationWarning: true,
				nonce
			},
			children
		}));
		const manifest = router.ssr?.manifest;
		if (!manifest) return scripts;
		for (const match of matches) {
			const manifestScripts = manifest.routes[match.routeId]?.scripts;
			if (!manifestScripts) continue;
			for (const asset of manifestScripts) scripts.push({
				tag: "script",
				attrs: {
					...asset.attrs,
					nonce
				},
				children: asset.children,
				...typeof asset.attrs?.src === "string" ? { preventScriptHoist: true } : {}
			});
		}
		return scripts;
	};
	if (_tanstack_router_core_isServer.isServer ?? router.isServer) return renderScripts(router, getScripts(router.stores.matches.get()));
	return renderScripts(router, (0, _tanstack_react_store.useStore)(router.stores.matches, getScripts, _tanstack_router_core.deepEqual));
};
function renderScripts(router, scripts) {
	if ((_tanstack_router_core_isServer.isServer ?? router.isServer) && router.serverSsr) {
		const serverBufferedScript = router.serverSsr.takeBufferedScripts();
		if (serverBufferedScript) scripts.unshift(serverBufferedScript);
	}
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: scripts.map((asset, i) => /* @__PURE__ */ (0, react.createElement)(require_Asset.Asset, {
		...asset,
		key: `tsr-scripts-${asset.tag}-${i}`
	})) });
}
//#endregion
exports.Scripts = Scripts;

//# sourceMappingURL=Scripts.cjs.map