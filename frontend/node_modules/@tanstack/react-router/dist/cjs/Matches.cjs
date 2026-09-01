"use client";
const require_runtime = require("./_virtual/_rolldown/runtime.cjs");
const require_utils = require("./utils.cjs");
const require_CatchBoundary = require("./CatchBoundary.cjs");
const require_matchContext = require("./matchContext.cjs");
const require_useRouter = require("./useRouter.cjs");
const require_useMatch = require("./useMatch.cjs");
const require_Transitioner = require("./Transitioner.cjs");
const require_SafeFragment = require("./SafeFragment.cjs");
const require_Match = require("./Match.cjs");
let _tanstack_router_core = require("@tanstack/router-core");
let react = require("react");
react = require_runtime.__toESM(react, 1);
let _tanstack_router_core_isServer = require("@tanstack/router-core/isServer");
let react_jsx_runtime = require("react/jsx-runtime");
let _tanstack_react_store = require("@tanstack/react-store");
//#region src/Matches.tsx
/**
* Internal component that renders the router's active match tree with
* suspense, error, and not-found boundaries. Rendered by `RouterProvider`.
*/
function Matches() {
	const router = require_useRouter.useRouter();
	const rootRoute = router.routesById[_tanstack_router_core.rootRouteId];
	const pendingElement = require_Match.renderPending(router, rootRoute);
	const ResolvedSuspense = (_tanstack_router_core_isServer.isServer ?? router.isServer) || router.ssr ? require_SafeFragment.SafeFragment : react.Suspense;
	const inner = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [!(_tanstack_router_core_isServer.isServer ?? router.isServer) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_Transitioner.Transitioner, { t: react.useState()[1] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResolvedSuspense, {
		fallback: pendingElement,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MatchesInner, {})
	})] });
	return router.options.InnerWrap ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(router.options.InnerWrap, { children: inner }) : inner;
}
function MatchesInner() {
	const router = require_useRouter.useRouter();
	const acknowledgement = router._rendered;
	const matches = _tanstack_router_core_isServer.isServer ?? router.isServer ? router.stores.matches.get() : (0, _tanstack_react_store.useStore)(router.stores.matches, (value) => acknowledgement[0] ?? value);
	const match = matches[0];
	const routeId = match?.routeId;
	require_utils.useLayoutEffect(() => {
		if (acknowledgement[0] === matches) require_Transitioner.settleOwner(acknowledgement, true);
	}, [acknowledgement, matches]);
	const matchComponent = routeId ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_Match.Match, { routeId }) : null;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_matchContext.matchContext.Provider, {
		value: routeId,
		children: router.options.disableGlobalCatchBoundary ? matchComponent : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_CatchBoundary.CatchBoundary, {
			getResetKey: () => match,
			onCatch: process.env.NODE_ENV !== "production" ? (error) => {
				console.warn(`Warning: The following error wasn't caught by any route! At the very least, consider setting an 'errorComponent' in your RootRoute!`);
				console.warn(`Warning: ${error.message || error.toString()}`);
			} : void 0,
			children: matchComponent
		})
	});
}
/**
* Create a matcher function for testing locations against route definitions.
*
* The returned function accepts standard navigation options (`to`, `params`,
* `search`, etc.) and returns either `false` (no match) or the matched params
* object when the route matches the current or pending location.
*
* Useful for conditional rendering and active UI states because it subscribes
* the component to the router state used for matching. The returned function's
* identity changes when that state changes. For imperative checks in event
* handlers, get the router with `useRouter` and call `router.matchRoute(...)`
* to avoid that subscription.
*
* @returns A `matchRoute(options)` function that returns `false` or params.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useMatchRouteHook
*/
function useMatchRoute() {
	const router = require_useRouter.useRouter();
	if (_tanstack_router_core_isServer.isServer ?? router.isServer) return (opts) => {
		const { pending, caseSensitive, fuzzy, includeSearch, ...rest } = opts;
		return router.matchRoute(rest, {
			pending,
			caseSensitive,
			fuzzy,
			includeSearch
		});
	};
	return react.useCallback((opts) => {
		const { pending, caseSensitive, fuzzy, includeSearch, ...rest } = opts;
		return router.matchRoute(rest, {
			pending,
			caseSensitive,
			fuzzy,
			includeSearch
		});
	}, [
		router,
		(0, _tanstack_react_store.useStore)(router.stores.location, (location) => location.href),
		(0, _tanstack_react_store.useStore)(router.stores.resolvedLocation, (location) => location?.href),
		(0, _tanstack_react_store.useStore)(router.stores.status, (status) => status)
	]);
}
/**
* Component that conditionally renders its children based on whether a route
* matches the provided `from`/`to` options. If `children` is a function, it
* receives the matched params object.
*
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/matchRouteComponent
*/
function MatchRoute(props) {
	const params = useMatchRoute()(props);
	if (typeof props.children === "function") return props.children(params);
	return params ? props.children : null;
}
function useMatches(opts) {
	const router = require_useRouter.useRouter();
	if (_tanstack_router_core_isServer.isServer ?? router.isServer) {
		const matches = router.stores.matches.get();
		return opts?.select ? opts.select(matches) : matches;
	}
	return (0, _tanstack_react_store.useStore)(router.stores.matches, require_useMatch.useStructuralSharing(opts, router));
}
/**
* Read the presented route matches above the current match, or select a
* derived value from them.
*/
function useParentMatches(opts) {
	const contextRouteId = react.useContext(require_matchContext.matchContext);
	return useMatches({
		select: (matches) => {
			matches = matches.slice(0, matches.findIndex((d) => d.routeId === contextRouteId));
			return opts?.select ? opts.select(matches) : matches;
		},
		structuralSharing: opts?.structuralSharing
	});
}
/**
* Read the presented route matches below the current match, or select a
* derived value from them.
*/
function useChildMatches(opts) {
	const contextRouteId = react.useContext(require_matchContext.matchContext);
	return useMatches({
		select: (matches) => {
			matches = matches.slice(matches.findIndex((d) => d.routeId === contextRouteId) + 1);
			return opts?.select ? opts.select(matches) : matches;
		},
		structuralSharing: opts?.structuralSharing
	});
}
//#endregion
exports.MatchRoute = MatchRoute;
exports.Matches = Matches;
exports.useChildMatches = useChildMatches;
exports.useMatchRoute = useMatchRoute;
exports.useMatches = useMatches;
exports.useParentMatches = useParentMatches;

//# sourceMappingURL=Matches.cjs.map