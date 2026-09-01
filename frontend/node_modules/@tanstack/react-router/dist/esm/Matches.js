"use client";
import { useLayoutEffect } from "./utils.js";
import { CatchBoundary } from "./CatchBoundary.js";
import { matchContext } from "./matchContext.js";
import { useRouter } from "./useRouter.js";
import { useStructuralSharing } from "./useMatch.js";
import { Transitioner, settleOwner } from "./Transitioner.js";
import { SafeFragment } from "./SafeFragment.js";
import { Match, renderPending } from "./Match.js";
import { rootRouteId } from "@tanstack/router-core";
import * as React$1 from "react";
import { isServer } from "@tanstack/router-core/isServer";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useStore } from "@tanstack/react-store";
//#region src/Matches.tsx
/**
* Internal component that renders the router's active match tree with
* suspense, error, and not-found boundaries. Rendered by `RouterProvider`.
*/
function Matches() {
	const router = useRouter();
	const rootRoute = router.routesById[rootRouteId];
	const pendingElement = renderPending(router, rootRoute);
	const ResolvedSuspense = (isServer ?? router.isServer) || router.ssr ? SafeFragment : React$1.Suspense;
	const inner = /* @__PURE__ */ jsxs(Fragment, { children: [!(isServer ?? router.isServer) && /* @__PURE__ */ jsx(Transitioner, { t: React$1.useState()[1] }), /* @__PURE__ */ jsx(ResolvedSuspense, {
		fallback: pendingElement,
		children: /* @__PURE__ */ jsx(MatchesInner, {})
	})] });
	return router.options.InnerWrap ? /* @__PURE__ */ jsx(router.options.InnerWrap, { children: inner }) : inner;
}
function MatchesInner() {
	const router = useRouter();
	const acknowledgement = router._rendered;
	const matches = isServer ?? router.isServer ? router.stores.matches.get() : useStore(router.stores.matches, (value) => acknowledgement[0] ?? value);
	const match = matches[0];
	const routeId = match?.routeId;
	useLayoutEffect(() => {
		if (acknowledgement[0] === matches) settleOwner(acknowledgement, true);
	}, [acknowledgement, matches]);
	const matchComponent = routeId ? /* @__PURE__ */ jsx(Match, { routeId }) : null;
	return /* @__PURE__ */ jsx(matchContext.Provider, {
		value: routeId,
		children: router.options.disableGlobalCatchBoundary ? matchComponent : /* @__PURE__ */ jsx(CatchBoundary, {
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
	const router = useRouter();
	if (isServer ?? router.isServer) return (opts) => {
		const { pending, caseSensitive, fuzzy, includeSearch, ...rest } = opts;
		return router.matchRoute(rest, {
			pending,
			caseSensitive,
			fuzzy,
			includeSearch
		});
	};
	return React$1.useCallback((opts) => {
		const { pending, caseSensitive, fuzzy, includeSearch, ...rest } = opts;
		return router.matchRoute(rest, {
			pending,
			caseSensitive,
			fuzzy,
			includeSearch
		});
	}, [
		router,
		useStore(router.stores.location, (location) => location.href),
		useStore(router.stores.resolvedLocation, (location) => location?.href),
		useStore(router.stores.status, (status) => status)
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
	const router = useRouter();
	if (isServer ?? router.isServer) {
		const matches = router.stores.matches.get();
		return opts?.select ? opts.select(matches) : matches;
	}
	return useStore(router.stores.matches, useStructuralSharing(opts, router));
}
/**
* Read the presented route matches above the current match, or select a
* derived value from them.
*/
function useParentMatches(opts) {
	const contextRouteId = React$1.useContext(matchContext);
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
	const contextRouteId = React$1.useContext(matchContext);
	return useMatches({
		select: (matches) => {
			matches = matches.slice(matches.findIndex((d) => d.routeId === contextRouteId) + 1);
			return opts?.select ? opts.select(matches) : matches;
		},
		structuralSharing: opts?.structuralSharing
	});
}
//#endregion
export { MatchRoute, Matches, useChildMatches, useMatchRoute, useMatches, useParentMatches };

//# sourceMappingURL=Matches.js.map