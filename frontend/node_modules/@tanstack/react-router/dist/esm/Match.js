"use client";
import { nonRouteComponentContext, wrapInNonRouteComponentContext } from "./nonRouteComponentContext.js";
import { CatchBoundary, ErrorComponent } from "./CatchBoundary.js";
import { ClientOnly } from "./ClientOnly.js";
import { matchContext } from "./matchContext.js";
import { useRouter } from "./useRouter.js";
import { CatchNotFound } from "./not-found.js";
import { SafeFragment } from "./SafeFragment.js";
import { renderRouteNotFound } from "./renderRouteNotFound.js";
import { ScrollRestoration } from "./scroll-restoration.js";
import { isNotFound, rootRouteId } from "@tanstack/router-core";
import * as React$1 from "react";
import { isServer } from "@tanstack/router-core/isServer";
import { jsx, jsxs } from "react/jsx-runtime";
import { useStore } from "@tanstack/react-store";
//#region src/Match.tsx
function renderPending(router, route) {
	const PendingComponent = route?.options.pendingComponent ?? router.options.defaultPendingComponent;
	if (!PendingComponent) return null;
	const pendingElement = /* @__PURE__ */ jsx(PendingComponent, {});
	return process.env.NODE_ENV !== "production" ? wrapInNonRouteComponentContext(pendingElement, "pendingComponent") : pendingElement;
}
var outletMatchSelectionEqual = (a, b) => a[0] === b[0] && a[1] === b[1];
var canWrapInSuspense = (router, route, ssr) => !route.isRoot || route.options.shellComponent || route.options.wrapInSuspense || ssr === false || ssr === "data-only" || !((isServer ?? router.isServer) || router.ssr);
var Match = React$1.memo(function MatchImpl({ routeId }) {
	const router = useRouter();
	if (isServer ?? router.isServer) return /* @__PURE__ */ jsx(MatchView, {
		router,
		match: router.stores.byRoute.get(routeId).get()
	});
	return /* @__PURE__ */ jsx(MatchView, {
		router,
		match: useStore(router.stores.getMatchStore(routeId), (value) => value)
	});
});
function MatchView({ router, match }) {
	const route = router.routesById[match.routeId];
	const pendingElement = renderPending(router, route);
	const routeErrorComponent = route.options.errorComponent ?? router.options.defaultErrorComponent;
	const routeOnCatch = route.options.onCatch ?? router.options.defaultOnCatch;
	const routeNotFoundComponent = route.isRoot ? route.options.notFoundComponent ?? router.options.notFoundRoute?.options.component : route.options.notFoundComponent;
	const resolvedNoSsr = match.ssr === false || match.ssr === "data-only";
	const ResolvedSuspenseBoundary = canWrapInSuspense(router, route, match.ssr) && (route.options.wrapInSuspense ?? pendingElement ?? (route.options.errorComponent?.preload || resolvedNoSsr)) ? React$1.Suspense : SafeFragment;
	const ResolvedCatchBoundary = routeErrorComponent ? CatchBoundary : SafeFragment;
	const ResolvedNotFoundBoundary = routeNotFoundComponent ? CatchNotFound : SafeFragment;
	return /* @__PURE__ */ jsxs(route.isRoot ? route.options.shellComponent ?? SafeFragment : SafeFragment, { children: [/* @__PURE__ */ jsx(matchContext.Provider, {
		value: match.routeId,
		children: /* @__PURE__ */ jsx(ResolvedSuspenseBoundary, {
			fallback: pendingElement,
			children: /* @__PURE__ */ jsx(ResolvedCatchBoundary, {
				getResetKey: () => match,
				errorComponent: routeErrorComponent,
				onCatch: (error, errorInfo) => {
					if (isNotFound(error)) {
						error.routeId ??= match.routeId;
						throw error;
					}
					if (process.env.NODE_ENV !== "production") console.warn(`Warning: Error in route match: ${match.id}`);
					routeOnCatch?.(error, errorInfo);
				},
				children: /* @__PURE__ */ jsx(ResolvedNotFoundBoundary, {
					fallback: (error) => {
						error.routeId ??= match.routeId;
						if (error.routeId !== match.routeId) throw error;
						const notFoundElement = React$1.createElement(routeNotFoundComponent, error);
						return process.env.NODE_ENV !== "production" ? wrapInNonRouteComponentContext(notFoundElement, "notFoundComponent") : notFoundElement;
					},
					children: resolvedNoSsr ? /* @__PURE__ */ jsx(ClientOnly, {
						fallback: pendingElement,
						children: /* @__PURE__ */ jsx(MatchInner, { match })
					}) : /* @__PURE__ */ jsx(MatchInner, { match })
				})
			})
		})
	}), (isServer ?? router.isServer) && route.parentRoute?.id === rootRouteId && router.options.scrollRestoration ? /* @__PURE__ */ jsx(ScrollRestoration, {}) : null] });
}
var MatchInner = React$1.memo(function MatchInnerImpl({ match }) {
	const router = useRouter();
	const routeId = match.routeId;
	const route = router.routesById[routeId];
	const key = React$1.useMemo(() => {
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
	const out = React$1.useMemo(() => {
		const Comp = route.options.component ?? router.options.defaultComponent;
		return Comp ? /* @__PURE__ */ jsx(Comp, {}, key) : /* @__PURE__ */ jsx(Outlet, {});
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
	if (match.status === "notFound") return renderRouteNotFound(router, route, match.error);
	if (match.status === "error") {
		if (isServer ?? router.isServer) {
			const errorElement = /* @__PURE__ */ jsx((route.options.errorComponent ?? router.options.defaultErrorComponent) || ErrorComponent, {
				error: match.error,
				reset: void 0,
				info: { componentStack: "" }
			});
			return process.env.NODE_ENV !== "production" ? wrapInNonRouteComponentContext(errorElement, "errorComponent") : errorElement;
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
var Outlet = React$1.memo(function OutletImpl() {
	if (process.env.NODE_ENV !== "production") {
		const nonRouteComponent = React$1.useContext(nonRouteComponentContext);
		if (nonRouteComponent) console.warn(`Warning: An <Outlet /> was rendered inside a ${nonRouteComponent}. <Outlet /> should only be rendered inside a route component.`);
	}
	const router = useRouter();
	const routeId = React$1.useContext(matchContext);
	let parentGlobalNotFound;
	let parentNotFoundError;
	let childRouteId;
	if (isServer ?? router.isServer) {
		const matches = router.stores.matches.get();
		const parentIndex = matches.findIndex((match) => match.routeId === routeId);
		const parentMatch = matches[parentIndex];
		parentGlobalNotFound = !!parentMatch._notFound;
		parentNotFoundError = parentMatch.error;
		childRouteId = matches[parentIndex + 1]?.routeId;
	} else {
		const parentMatchStore = router.stores.getMatchStore(routeId);
		[parentGlobalNotFound, parentNotFoundError] = useStore(parentMatchStore, (match) => [!!match._notFound, match.error], outletMatchSelectionEqual);
		childRouteId = useStore(router.stores.ids, (ids) => {
			return ids[ids.indexOf(routeId) + 1];
		});
	}
	if (parentGlobalNotFound) return renderRouteNotFound(router, router.routesById[routeId], parentNotFoundError);
	if (!childRouteId) return null;
	const nextMatch = /* @__PURE__ */ jsx(Match, { routeId: childRouteId });
	if (routeId === rootRouteId) return /* @__PURE__ */ jsx(React$1.Suspense, {
		fallback: renderPending(router),
		children: nextMatch
	});
	return nextMatch;
});
//#endregion
export { Match, Outlet, renderPending };

//# sourceMappingURL=Match.js.map