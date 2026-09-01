"use client";
const require_runtime = require("./_virtual/_rolldown/runtime.cjs");
const require_nonRouteComponentContext = require("./nonRouteComponentContext.cjs");
const require_CatchBoundary = require("./CatchBoundary.cjs");
const require_ClientOnly = require("./ClientOnly.cjs");
const require_matchContext = require("./matchContext.cjs");
const require_useRouter = require("./useRouter.cjs");
const require_not_found = require("./not-found.cjs");
const require_SafeFragment = require("./SafeFragment.cjs");
const require_renderRouteNotFound = require("./renderRouteNotFound.cjs");
const require_scroll_restoration = require("./scroll-restoration.cjs");
let _tanstack_router_core = require("@tanstack/router-core");
let react = require("react");
react = require_runtime.__toESM(react, 1);
let _tanstack_router_core_isServer = require("@tanstack/router-core/isServer");
let react_jsx_runtime = require("react/jsx-runtime");
let _tanstack_react_store = require("@tanstack/react-store");
//#region src/Match.tsx
function renderPending(router, route) {
	const PendingComponent = route?.options.pendingComponent ?? router.options.defaultPendingComponent;
	if (!PendingComponent) return null;
	const pendingElement = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PendingComponent, {});
	return process.env.NODE_ENV !== "production" ? require_nonRouteComponentContext.wrapInNonRouteComponentContext(pendingElement, "pendingComponent") : pendingElement;
}
var outletMatchSelectionEqual = (a, b) => a[0] === b[0] && a[1] === b[1];
var canWrapInSuspense = (router, route, ssr) => !route.isRoot || route.options.shellComponent || route.options.wrapInSuspense || ssr === false || ssr === "data-only" || !((_tanstack_router_core_isServer.isServer ?? router.isServer) || router.ssr);
var Match = react.memo(function MatchImpl({ routeId }) {
	const router = require_useRouter.useRouter();
	if (_tanstack_router_core_isServer.isServer ?? router.isServer) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MatchView, {
		router,
		match: router.stores.byRoute.get(routeId).get()
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MatchView, {
		router,
		match: (0, _tanstack_react_store.useStore)(router.stores.getMatchStore(routeId), (value) => value)
	});
});
function MatchView({ router, match }) {
	const route = router.routesById[match.routeId];
	const pendingElement = renderPending(router, route);
	const routeErrorComponent = route.options.errorComponent ?? router.options.defaultErrorComponent;
	const routeOnCatch = route.options.onCatch ?? router.options.defaultOnCatch;
	const routeNotFoundComponent = route.isRoot ? route.options.notFoundComponent ?? router.options.notFoundRoute?.options.component : route.options.notFoundComponent;
	const resolvedNoSsr = match.ssr === false || match.ssr === "data-only";
	const ResolvedSuspenseBoundary = canWrapInSuspense(router, route, match.ssr) && (route.options.wrapInSuspense ?? pendingElement ?? (route.options.errorComponent?.preload || resolvedNoSsr)) ? react.Suspense : require_SafeFragment.SafeFragment;
	const ResolvedCatchBoundary = routeErrorComponent ? require_CatchBoundary.CatchBoundary : require_SafeFragment.SafeFragment;
	const ResolvedNotFoundBoundary = routeNotFoundComponent ? require_not_found.CatchNotFound : require_SafeFragment.SafeFragment;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(route.isRoot ? route.options.shellComponent ?? require_SafeFragment.SafeFragment : require_SafeFragment.SafeFragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_matchContext.matchContext.Provider, {
		value: match.routeId,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResolvedSuspenseBoundary, {
			fallback: pendingElement,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResolvedCatchBoundary, {
				getResetKey: () => match,
				errorComponent: routeErrorComponent,
				onCatch: (error, errorInfo) => {
					if ((0, _tanstack_router_core.isNotFound)(error)) {
						error.routeId ??= match.routeId;
						throw error;
					}
					if (process.env.NODE_ENV !== "production") console.warn(`Warning: Error in route match: ${match.id}`);
					routeOnCatch?.(error, errorInfo);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResolvedNotFoundBoundary, {
					fallback: (error) => {
						error.routeId ??= match.routeId;
						if (error.routeId !== match.routeId) throw error;
						const notFoundElement = react.createElement(routeNotFoundComponent, error);
						return process.env.NODE_ENV !== "production" ? require_nonRouteComponentContext.wrapInNonRouteComponentContext(notFoundElement, "notFoundComponent") : notFoundElement;
					},
					children: resolvedNoSsr ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_ClientOnly.ClientOnly, {
						fallback: pendingElement,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MatchInner, { match })
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MatchInner, { match })
				})
			})
		})
	}), (_tanstack_router_core_isServer.isServer ?? router.isServer) && route.parentRoute?.id === _tanstack_router_core.rootRouteId && router.options.scrollRestoration ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(require_scroll_restoration.ScrollRestoration, {}) : null] });
}
var MatchInner = react.memo(function MatchInnerImpl({ match }) {
	const router = require_useRouter.useRouter();
	const routeId = match.routeId;
	const route = router.routesById[routeId];
	const key = react.useMemo(() => {
		const remountDeps = (route.options.remountDeps ?? router.options.defaultRemountDeps)?.({
			routeId,
			loaderDeps: match.loaderDeps,
			params: match._strictParams,
			search: match._strictSearch
		});
		return remountDeps ? JSON.stringify(remountDeps) : void 0;
	}, [
		routeId,
		match.loaderDeps,
		match._strictParams,
		match._strictSearch,
		route.options.remountDeps,
		router.options.defaultRemountDeps
	]);
	const out = react.useMemo(() => {
		const Comp = route.options.component ?? router.options.defaultComponent;
		return Comp ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Comp, {}, key) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Outlet, {});
	}, [
		key,
		route.options.component,
		router.options.defaultComponent
	]);
	if (match.status === "pending") {
		if (router.ssr && !canWrapInSuspense(router, route, match.ssr)) return out;
		if (router._tx) throw router._tx[5];
		return renderPending(router, route);
	}
	if (match.status === "notFound") return require_renderRouteNotFound.renderRouteNotFound(router, route, match.error);
	if (match.status === "error") {
		if (_tanstack_router_core_isServer.isServer ?? router.isServer) {
			const errorElement = /* @__PURE__ */ (0, react_jsx_runtime.jsx)((route.options.errorComponent ?? router.options.defaultErrorComponent) || require_CatchBoundary.ErrorComponent, {
				error: match.error,
				reset: void 0,
				info: { componentStack: "" }
			});
			return process.env.NODE_ENV !== "production" ? require_nonRouteComponentContext.wrapInNonRouteComponentContext(errorElement, "errorComponent") : errorElement;
		}
		throw match.error;
	}
	return out;
});
/**
* Render the next child match in the route tree. Typically used inside
* a route component to render nested routes.
*
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/outletComponent
*/
var Outlet = react.memo(function OutletImpl() {
	if (process.env.NODE_ENV !== "production") {
		const nonRouteComponent = react.useContext(require_nonRouteComponentContext.nonRouteComponentContext);
		if (nonRouteComponent) console.warn(`Warning: An <Outlet /> was rendered inside a ${nonRouteComponent}. <Outlet /> should only be rendered inside a route component.`);
	}
	const router = require_useRouter.useRouter();
	const routeId = react.useContext(require_matchContext.matchContext);
	let parentGlobalNotFound;
	let parentNotFoundError;
	let childRouteId;
	if (_tanstack_router_core_isServer.isServer ?? router.isServer) {
		const matches = router.stores.matches.get();
		const parentIndex = matches.findIndex((match) => match.routeId === routeId);
		const parentMatch = matches[parentIndex];
		parentGlobalNotFound = !!parentMatch._notFound;
		parentNotFoundError = parentMatch.error;
		childRouteId = matches[parentIndex + 1]?.routeId;
	} else {
		const parentMatchStore = router.stores.getMatchStore(routeId);
		[parentGlobalNotFound, parentNotFoundError] = (0, _tanstack_react_store.useStore)(parentMatchStore, (match) => [!!match._notFound, match.error], outletMatchSelectionEqual);
		childRouteId = (0, _tanstack_react_store.useStore)(router.stores.ids, (ids) => {
			return ids[ids.indexOf(routeId) + 1];
		});
	}
	if (parentGlobalNotFound) return require_renderRouteNotFound.renderRouteNotFound(router, router.routesById[routeId], parentNotFoundError);
	if (!childRouteId) return null;
	const nextMatch = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Match, { routeId: childRouteId });
	if (routeId === _tanstack_router_core.rootRouteId) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react.Suspense, {
		fallback: renderPending(router),
		children: nextMatch
	});
	return nextMatch;
});
//#endregion
exports.Match = Match;
exports.Outlet = Outlet;
exports.renderPending = renderPending;

//# sourceMappingURL=Match.cjs.map