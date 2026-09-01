"use client";
const require_runtime = require("./_virtual/_rolldown/runtime.cjs");
const require_utils = require("./utils.cjs");
const require_useRouter = require("./useRouter.cjs");
let _tanstack_router_core = require("@tanstack/router-core");
let react = require("react");
react = require_runtime.__toESM(react, 1);
//#region src/Transitioner.tsx
function settleOwner(owner, rendered) {
	const settle = owner[1];
	owner.length = 0;
	settle?.(rendered);
}
function Transitioner({ t }) {
	const router = require_useRouter.useRouter();
	const acknowledgement = router._rendered ??= [];
	const mounted = process.env.NODE_ENV !== "production" ? react.useRef(false) : void 0;
	router.startTransition = (fn, expected) => new Promise((resolve) => {
		settleOwner(acknowledgement, false);
		acknowledgement.push(expected, resolve);
		t(router);
		react.startTransition(fn);
	});
	require_utils.useLayoutEffect(() => {
		const unsub = router.history.subscribe(router.load);
		if (mounted?.current) return unsub;
		if (mounted) mounted.current = true;
		router.updateLatestLocation();
		const location = router.latestLocation;
		const nextLocation = router.buildLocation({
			to: location.pathname,
			search: true,
			params: true,
			hash: true,
			state: true,
			_includeValidateSearch: true
		});
		if ((0, _tanstack_router_core.trimPathRight)(location.publicHref) !== (0, _tanstack_router_core.trimPathRight)(nextLocation.publicHref)) {
			router.commitLocation({
				...nextLocation,
				replace: true,
				ignoreBlocker: true
			});
			return unsub;
		}
		const resolvedLocation = router.stores.resolvedLocation.get();
		if (resolvedLocation?.href === location.href && resolvedLocation.state.__TSR_key === location.state.__TSR_key) acknowledgement.push(router.stores.matches.get(), (rendered) => {
			if (rendered) router.emit({
				type: "onRendered",
				...(0, _tanstack_router_core.getLocationChangeInfo)(resolvedLocation, resolvedLocation)
			});
		});
		else if (!router._tx) router.load({ sync: true }).catch(console.error);
		return unsub;
	}, [router, router.history]);
	return null;
}
//#endregion
exports.Transitioner = Transitioner;
exports.settleOwner = settleOwner;

//# sourceMappingURL=Transitioner.cjs.map