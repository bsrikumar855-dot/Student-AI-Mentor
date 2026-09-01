const require_runtime = require("./_virtual/_rolldown/runtime.cjs");
const require_utils = require("./utils.cjs");
let _tanstack_router_core = require("@tanstack/router-core");
let react = require("react");
react = require_runtime.__toESM(react, 1);
let _tanstack_router_core_isServer = require("@tanstack/router-core/isServer");
//#region src/lazyRouteComponent.tsx
/**
* Wrap a dynamic import to create a route component that supports
* `.preload()` and friendly reload-on-module-missing behavior.
*
* @param importer Function returning a module promise
* @param exportName Named export to use (default: `default`)
* @returns A lazy route component compatible with TanStack Router
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/lazyRouteComponentFunction
*/
function lazyRouteComponent(importer, exportName) {
	let loadPromise;
	let comp;
	let error;
	const load = () => {
		if (!loadPromise) {
			error = void 0;
			loadPromise = importer().then((res) => {
				if (!(_tanstack_router_core_isServer.isServer ?? typeof window === "undefined")) {
					loadPromise = void 0;
					lazyComp.preload = void 0;
				}
				comp = res[exportName ?? "default"];
			}).catch((err) => {
				loadPromise = void 0;
				error = err;
			});
		}
		return loadPromise;
	};
	const lazyComp = function Lazy(props) {
		if (error) {
			if ((0, _tanstack_router_core.isModuleNotFoundError)(error) && !(_tanstack_router_core_isServer.isServer ?? typeof window === "undefined") && typeof sessionStorage !== "undefined") {
				const storageKey = `tanstack_router_reload:${error.message}`;
				if (!sessionStorage.getItem(storageKey)) {
					sessionStorage.setItem(storageKey, "1");
					window.location.reload();
					throw new Promise(() => {});
				}
			}
			throw error;
		}
		if (!comp) if (require_utils.reactUse) require_utils.reactUse(load());
		else throw load();
		return react.createElement(comp, props);
	};
	lazyComp.preload = load;
	return lazyComp;
}
//#endregion
exports.lazyRouteComponent = lazyRouteComponent;

//# sourceMappingURL=lazyRouteComponent.cjs.map