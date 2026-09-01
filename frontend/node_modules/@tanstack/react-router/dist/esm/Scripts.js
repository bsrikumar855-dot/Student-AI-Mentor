import { useRouter } from "./useRouter.js";
import { Asset } from "./Asset.js";
import { _getAssetMatches, deepEqual } from "@tanstack/router-core";
import { createElement } from "react";
import { isServer } from "@tanstack/router-core/isServer";
import { Fragment, jsx } from "react/jsx-runtime";
import { useStore } from "@tanstack/react-store";
//#region src/Scripts.tsx
/**
* Render body script tags collected from route matches and SSR manifests.
* Should be placed near the end of the document body.
*/
var Scripts = () => {
	const router = useRouter();
	const nonce = router.options.ssr?.nonce;
	const getScripts = (matches) => {
		matches = _getAssetMatches(matches);
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
	if (isServer ?? router.isServer) return renderScripts(router, getScripts(router.stores.matches.get()));
	return renderScripts(router, useStore(router.stores.matches, getScripts, deepEqual));
};
function renderScripts(router, scripts) {
	if ((isServer ?? router.isServer) && router.serverSsr) {
		const serverBufferedScript = router.serverSsr.takeBufferedScripts();
		if (serverBufferedScript) scripts.unshift(serverBufferedScript);
	}
	return /* @__PURE__ */ jsx(Fragment, { children: scripts.map((asset, i) => /* @__PURE__ */ createElement(Asset, {
		...asset,
		key: `tsr-scripts-${asset.tag}-${i}`
	})) });
}
//#endregion
export { Scripts };

//# sourceMappingURL=Scripts.js.map