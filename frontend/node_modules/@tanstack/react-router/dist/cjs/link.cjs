"use client";
const require_runtime = require("./_virtual/_rolldown/runtime.cjs");
const require_utils = require("./utils.cjs");
const require_ClientOnly = require("./ClientOnly.cjs");
const require_useRouter = require("./useRouter.cjs");
let _tanstack_router_core = require("@tanstack/router-core");
let react = require("react");
react = require_runtime.__toESM(react, 1);
let _tanstack_router_core_isServer = require("@tanstack/router-core/isServer");
let react_jsx_runtime = require("react/jsx-runtime");
let _tanstack_react_store = require("@tanstack/react-store");
//#region src/link.tsx
function useValueStable(value) {
	const ref = react.useRef(value);
	if (!(0, _tanstack_router_core.deepEqual)(ref.current, value, { ignoreUndefined: false })) ref.current = value;
	return ref.current;
}
function compareLinkState(a, b) {
	return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
function resolveExternalLink(hrefOption, to, protocolAllowlist) {
	if (hrefOption?.external) {
		if ((0, _tanstack_router_core.isDangerousProtocol)(hrefOption.href, protocolAllowlist)) {
			if (process.env.NODE_ENV !== "production") console.warn(`Blocked Link with dangerous protocol: ${hrefOption.href}`);
			return;
		}
		return hrefOption.href;
	}
	if (isSafeInternal(to)) return;
	if (typeof to !== "string" || to.indexOf(":") === -1) return;
	try {
		new URL(to);
		if ((0, _tanstack_router_core.isDangerousProtocol)(to, protocolAllowlist)) {
			if (process.env.NODE_ENV !== "production") console.warn(`Blocked Link with dangerous protocol: ${to}`);
			return;
		}
		return to;
	} catch {}
}
function resolveIsActive(location, next, activeOptions, basepath, isHydrated, isExternal) {
	if (isExternal) return false;
	if (activeOptions?.exact) {
		if (!(0, _tanstack_router_core.exactPathTest)(location.pathname, next.pathname, basepath)) return false;
	} else {
		const currentPathSplit = (0, _tanstack_router_core.removeTrailingSlash)(location.pathname, basepath);
		const nextPathSplit = (0, _tanstack_router_core.removeTrailingSlash)(next.pathname, basepath);
		if (!(currentPathSplit.startsWith(nextPathSplit) && (currentPathSplit.length === nextPathSplit.length || currentPathSplit[nextPathSplit.length] === "/"))) return false;
	}
	if (activeOptions?.includeSearch ?? true) {
		if (!(0, _tanstack_router_core.deepEqual)(location.search, next.search, {
			partial: !activeOptions?.exact,
			ignoreUndefined: !activeOptions?.explicitUndefined
		})) return false;
	}
	if (activeOptions?.includeHash) return isHydrated && location.hash === next.hash;
	return true;
}
/**
* Build anchor-like props for declarative navigation and preloading.
*
* Returns stable `href`, event handlers and accessibility props derived from
* router options and active state. Used internally by `Link` and custom links.
*
* Options cover `to`, `params`, `search`, `hash`, `state`, `preload`,
* `activeProps`, `inactiveProps`, and more.
*
* @returns React anchor props suitable for `<a>` or custom components.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useLinkPropsHook
*/
function useLinkProps(options, forwardedRef) {
	const router = require_useRouter.useRouter();
	const innerRef = require_utils.useForwardedRef(forwardedRef);
	const { activeProps, inactiveProps, activeOptions, to, preload: userPreload, preloadDelay: userPreloadDelay, preloadIntentProximity: _preloadIntentProximity, hashScrollIntoView, replace, startTransition, resetScroll, viewTransition, children, target, disabled, style, className, onClick, onBlur, onFocus, onMouseEnter, onMouseLeave, onTouchStart, ignoreBlocker, params: _params, search: _search, hash: _hash, state: _state, mask: _mask, reloadDocument: _reloadDocument, unsafeRelative: _unsafeRelative, from: _from, _fromLocation, ...propsSafeToSpread } = options;
	if (_tanstack_router_core_isServer.isServer ?? router.isServer) {
		const safeInternal = isSafeInternal(to);
		if (typeof to === "string" && !safeInternal && to.indexOf(":") > -1) try {
			new URL(to);
			if ((0, _tanstack_router_core.isDangerousProtocol)(to, router.protocolAllowlist)) {
				if (process.env.NODE_ENV !== "production") console.warn(`Blocked Link with dangerous protocol: ${to}`);
				return {
					...propsSafeToSpread,
					ref: innerRef,
					href: void 0,
					...children && { children },
					...target && { target },
					...disabled && { disabled },
					...style && { style },
					...className && { className }
				};
			}
			return {
				...propsSafeToSpread,
				ref: innerRef,
				href: to,
				...children && { children },
				...target && { target },
				...disabled && { disabled },
				...style && { style },
				...className && { className }
			};
		} catch {}
		const next = router.buildLocation({
			...options,
			from: options.from
		});
		const hrefOption = getHrefOption(next.maskedLocation ? next.maskedLocation.publicHref : next.publicHref, next.maskedLocation ? next.maskedLocation.external : next.external, router.history, disabled);
		const externalLink = (() => {
			if (hrefOption?.external) {
				if ((0, _tanstack_router_core.isDangerousProtocol)(hrefOption.href, router.protocolAllowlist)) {
					if (process.env.NODE_ENV !== "production") console.warn(`Blocked Link with dangerous protocol: ${hrefOption.href}`);
					return;
				}
				return hrefOption.href;
			}
			if (safeInternal) return void 0;
			if (typeof to === "string" && to.indexOf(":") > -1) try {
				new URL(to);
				if ((0, _tanstack_router_core.isDangerousProtocol)(to, router.protocolAllowlist)) {
					if (process.env.NODE_ENV !== "production") console.warn(`Blocked Link with dangerous protocol: ${to}`);
					return;
				}
				return to;
			} catch {}
		})();
		const isActive = (() => {
			if (externalLink) return false;
			const currentLocation = router.stores.location.get();
			const exact = activeOptions?.exact ?? false;
			if (exact) {
				if (!(0, _tanstack_router_core.exactPathTest)(currentLocation.pathname, next.pathname, router.basepath)) return false;
			} else {
				const currentPathSplit = (0, _tanstack_router_core.removeTrailingSlash)(currentLocation.pathname, router.basepath);
				const nextPathSplit = (0, _tanstack_router_core.removeTrailingSlash)(next.pathname, router.basepath);
				if (!(currentPathSplit.startsWith(nextPathSplit) && (currentPathSplit.length === nextPathSplit.length || currentPathSplit[nextPathSplit.length] === "/"))) return false;
			}
			if (activeOptions?.includeSearch ?? true) {
				if (currentLocation.search !== next.search) {
					const currentSearchEmpty = !currentLocation.search || typeof currentLocation.search === "object" && !(0, _tanstack_router_core.hasKeys)(currentLocation.search);
					const nextSearchEmpty = !next.search || typeof next.search === "object" && !(0, _tanstack_router_core.hasKeys)(next.search);
					if (!(currentSearchEmpty && nextSearchEmpty)) {
						if (!(0, _tanstack_router_core.deepEqual)(currentLocation.search, next.search, {
							partial: !exact,
							ignoreUndefined: !activeOptions?.explicitUndefined
						})) return false;
					}
				}
			}
			if (activeOptions?.includeHash) return false;
			return true;
		})();
		if (externalLink) return {
			...propsSafeToSpread,
			ref: innerRef,
			href: externalLink,
			...children && { children },
			...target && { target },
			...disabled && { disabled },
			...style && { style },
			...className && { className }
		};
		const resolvedActiveProps = isActive ? (0, _tanstack_router_core.functionalUpdate)(activeProps, {}) ?? STATIC_ACTIVE_OBJECT : STATIC_EMPTY_OBJECT;
		const resolvedInactiveProps = isActive ? STATIC_EMPTY_OBJECT : (0, _tanstack_router_core.functionalUpdate)(inactiveProps, {}) ?? STATIC_EMPTY_OBJECT;
		const resolvedStyle = (() => {
			const baseStyle = style;
			const activeStyle = resolvedActiveProps.style;
			const inactiveStyle = resolvedInactiveProps.style;
			if (!baseStyle && !activeStyle && !inactiveStyle) return;
			if (baseStyle && !activeStyle && !inactiveStyle) return baseStyle;
			if (!baseStyle && activeStyle && !inactiveStyle) return activeStyle;
			if (!baseStyle && !activeStyle && inactiveStyle) return inactiveStyle;
			return {
				...baseStyle,
				...activeStyle,
				...inactiveStyle
			};
		})();
		const resolvedClassName = (() => {
			const baseClassName = className;
			const activeClassName = resolvedActiveProps.className;
			const inactiveClassName = resolvedInactiveProps.className;
			if (!baseClassName && !activeClassName && !inactiveClassName) return "";
			let out = "";
			if (baseClassName) out = baseClassName;
			if (activeClassName) out = out ? `${out} ${activeClassName}` : activeClassName;
			if (inactiveClassName) out = out ? `${out} ${inactiveClassName}` : inactiveClassName;
			return out;
		})();
		return {
			...propsSafeToSpread,
			...resolvedActiveProps,
			...resolvedInactiveProps,
			href: hrefOption?.href,
			ref: innerRef,
			disabled: !!disabled,
			target,
			...resolvedStyle && { style: resolvedStyle },
			...resolvedClassName && { className: resolvedClassName },
			...disabled && STATIC_DISABLED_PROPS,
			...isActive && STATIC_ACTIVE_PROPS
		};
	}
	const isHydrated = require_ClientOnly.useHydrated();
	const stableSearch = useValueStable(options.search);
	const stableParams = useValueStable(options.params);
	const stableActiveOptions = useValueStable(activeOptions);
	const _options = react.useMemo(() => options, [
		router,
		options.from,
		options._fromLocation,
		options.hash,
		options.to,
		stableSearch,
		stableParams,
		options.state,
		options.mask,
		options.unsafeRelative
	]);
	const selectLinkState = react.useCallback((location) => {
		const next = router.buildLocation({
			_fromLocation: location,
			..._options
		});
		const hrefOption = getHrefOption(next.maskedLocation ? next.maskedLocation.publicHref : next.publicHref, next.maskedLocation ? next.maskedLocation.external : next.external, router.history, disabled);
		const externalLink = resolveExternalLink(hrefOption, to, router.protocolAllowlist);
		return [
			hrefOption?.href,
			externalLink,
			resolveIsActive(location, next, stableActiveOptions, router.basepath, isHydrated, externalLink !== void 0)
		];
	}, [
		stableActiveOptions,
		disabled,
		isHydrated,
		_options,
		router,
		to
	]);
	const [href, externalLink, isActive] = (0, _tanstack_react_store.useStore)(router.stores.location, selectLinkState, compareLinkState);
	const resolvedActiveProps = isActive ? (0, _tanstack_router_core.functionalUpdate)(activeProps, {}) ?? STATIC_ACTIVE_OBJECT : STATIC_EMPTY_OBJECT;
	const resolvedInactiveProps = isActive ? STATIC_EMPTY_OBJECT : (0, _tanstack_router_core.functionalUpdate)(inactiveProps, {}) ?? STATIC_EMPTY_OBJECT;
	const resolvedClassName = [
		className,
		resolvedActiveProps.className,
		resolvedInactiveProps.className
	].filter(Boolean).join(" ");
	const resolvedStyle = (style || resolvedActiveProps.style || resolvedInactiveProps.style) && {
		...style,
		...resolvedActiveProps.style,
		...resolvedInactiveProps.style
	};
	const hasRenderFetched = react.useRef(false);
	const preload = options.reloadDocument || externalLink || disabled ? false : userPreload ?? router.options.defaultPreload;
	const preloadDelay = userPreloadDelay ?? router.options.defaultPreloadDelay ?? 0;
	const doPreload = react.useCallback(() => {
		router.preloadRoute(_options).catch((err) => {
			console.warn(err);
			console.warn(_tanstack_router_core.preloadWarning);
		});
	}, [router, _options]);
	const enqueuePreload = react.useCallback((e) => {
		if (!e) {
			cancelPreload(innerRef);
			return;
		}
		if (!(e.isIntersecting ?? preload === "intent")) {
			if (e.isIntersecting === false) cancelPreload(innerRef);
			return;
		}
		if (!preloadDelay) {
			doPreload();
			return;
		}
		if (timeoutMap.has(innerRef)) return;
		timeoutMap.set(innerRef, setTimeout(() => {
			timeoutMap.delete(innerRef);
			doPreload();
		}, preloadDelay));
	}, [
		doPreload,
		innerRef,
		preload,
		preloadDelay
	]);
	require_utils.useIntersectionObserver(innerRef, enqueuePreload, preload !== "viewport");
	react.useEffect(() => {
		if (hasRenderFetched.current) return;
		if (preload === "render") {
			doPreload();
			hasRenderFetched.current = true;
		}
	}, [doPreload, preload]);
	const handleClick = (e) => {
		const elementTarget = e.currentTarget.getAttribute("target");
		const effectiveTarget = target !== void 0 ? target : elementTarget;
		if (!disabled && !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) && !e.defaultPrevented && (!effectiveTarget || effectiveTarget === "_self") && e.button === 0) {
			e.preventDefault();
			router.navigate({
				..._options,
				replace,
				resetScroll,
				hashScrollIntoView,
				startTransition,
				viewTransition,
				ignoreBlocker
			});
		}
	};
	if (externalLink) return {
		...propsSafeToSpread,
		ref: innerRef,
		href: externalLink,
		...children && { children },
		...target && { target },
		...disabled && { disabled },
		...style && { style },
		...className && { className },
		...onClick && { onClick },
		...onBlur && { onBlur },
		...onFocus && { onFocus },
		...onMouseEnter && { onMouseEnter },
		...onMouseLeave && { onMouseLeave },
		...onTouchStart && { onTouchStart }
	};
	const handleTouchStart = () => {
		if (preload !== "intent") return;
		doPreload();
	};
	const handleLeave = () => {
		if (preload === "intent") cancelPreload(innerRef);
	};
	return {
		...propsSafeToSpread,
		...resolvedActiveProps,
		...resolvedInactiveProps,
		href,
		ref: innerRef,
		onClick: composeHandlers([onClick, handleClick]),
		onBlur: composeHandlers([onBlur, handleLeave]),
		onFocus: composeHandlers([onFocus, enqueuePreload]),
		onMouseEnter: composeHandlers([onMouseEnter, enqueuePreload]),
		onMouseLeave: composeHandlers([onMouseLeave, handleLeave]),
		onTouchStart: composeHandlers([onTouchStart, handleTouchStart]),
		disabled: !!disabled,
		target,
		...resolvedStyle && { style: resolvedStyle },
		...resolvedClassName && { className: resolvedClassName },
		...disabled && STATIC_DISABLED_PROPS,
		...isActive && STATIC_ACTIVE_PROPS
	};
}
var STATIC_EMPTY_OBJECT = {};
var STATIC_ACTIVE_OBJECT = { className: "active" };
var STATIC_DISABLED_PROPS = {
	role: "link",
	"aria-disabled": true
};
var STATIC_ACTIVE_PROPS = {
	"data-status": "active",
	"aria-current": "page"
};
var timeoutMap = /* @__PURE__ */ new WeakMap();
var cancelPreload = (eventTarget) => {
	clearTimeout(timeoutMap.get(eventTarget));
	timeoutMap.delete(eventTarget);
};
var composeHandlers = (handlers) => (e) => {
	for (const handler of handlers) {
		if (!handler) continue;
		if (e.defaultPrevented) return;
		handler(e);
	}
};
function getHrefOption(publicHref, external, history, disabled) {
	if (disabled) return void 0;
	if (external) return {
		href: publicHref,
		external: true
	};
	return {
		href: history.createHref(publicHref) || "/",
		external: false
	};
}
function isSafeInternal(to) {
	if (typeof to !== "string") return false;
	const zero = to.charCodeAt(0);
	if (zero === 47) return to.charCodeAt(1) !== 47;
	return zero === 46;
}
/**
* Creates a typed Link-like component that preserves TanStack Router's
* navigation semantics and type-safety while delegating rendering to the
* provided host component.
*
* Useful for integrating design system anchors/buttons while keeping
* router-aware props (eg. `to`, `params`, `search`, `preload`).
*
* @param Comp The host component to render (eg. a design-system Link/Button)
* @returns A router-aware component with the same API as `Link`.
* @link https://tanstack.com/router/latest/docs/framework/react/guide/custom-link
*/
function createLink(Comp) {
	return react.forwardRef(function CreatedLink(props, ref) {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Link, {
			...props,
			_asChild: Comp,
			ref
		});
	});
}
/**
* A strongly-typed anchor component for declarative navigation.
* Handles path, search, hash and state updates with optional route preloading
* and active-state styling.
*
* Props:
* - `preload`: Controls route preloading (eg. 'intent', 'render', 'viewport', true/false)
* - `preloadDelay`: Delay in ms before preloading on focus, hover, or viewport entry
* - `activeProps`/`inactiveProps`: Additional props merged when link is active/inactive
* - `resetScroll`/`hashScrollIntoView`: Control scroll behavior on navigation
* - `viewTransition`/`startTransition`: Use View Transitions/React transitions for navigation
* - `ignoreBlocker`: Bypass registered blockers
*
* @returns An anchor-like element that navigates without full page reloads.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/linkComponent
*/
var Link = react.forwardRef((props, ref) => {
	const { _asChild, ...rest } = props;
	const { type: _type, ...linkProps } = useLinkProps(rest, ref);
	const children = typeof rest.children === "function" ? rest.children({ isActive: linkProps["data-status"] === "active" }) : rest.children;
	if (!_asChild) {
		const { disabled: _, ...rest } = linkProps;
		return react.createElement("a", rest, children);
	}
	return react.createElement(_asChild, linkProps, children);
});
/**
* Validate and reuse navigation options for `Link`, `navigate` or `redirect`.
* Accepts a literal options object and returns it typed for later spreading.
* @example
* const opts = linkOptions({ to: '/dashboard', search: { tab: 'home' } })
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/linkOptions
*/
var linkOptions = (options) => {
	return options;
};
/**
* Type-check a literal object for use with `Link`, `navigate` or `redirect`.
* Use to validate and reuse navigation options across your app.
* @example
* const opts = linkOptions({ to: '/dashboard', search: { tab: 'home' } })
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/linkOptions
*/
//#endregion
exports.Link = Link;
exports.createLink = createLink;
exports.linkOptions = linkOptions;
exports.useLinkProps = useLinkProps;

//# sourceMappingURL=link.cjs.map