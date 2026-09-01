"use client";
import { useLayoutEffect } from "./utils.js";
import { useRouter } from "./useRouter.js";
import { getLocationChangeInfo, trimPathRight } from "@tanstack/router-core";
import * as React$1 from "react";
//#region src/Transitioner.tsx
function settleOwner(owner, rendered) {
	const settle = owner[1];
	owner.length = 0;
	settle?.(rendered);
}
function Transitioner({ t }) {
	const router = useRouter();
	const acknowledgement = router._rendered ??= [];
	const mounted = process.env.NODE_ENV !== "production" ? React$1.useRef(false) : void 0;
	router.startTransition = (fn, expected) => new Promise((resolve) => {
		settleOwner(acknowledgement, false);
		acknowledgement.push(expected, resolve);
		t(router);
		React$1.startTransition(fn);
	});
	useLayoutEffect(() => {
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
		if (trimPathRight(location.publicHref) !== trimPathRight(nextLocation.publicHref)) {
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
				...getLocationChangeInfo(resolvedLocation, resolvedLocation)
			});
		});
		else if (!router._tx) router.load({ sync: true }).catch(console.error);
		return unsub;
	}, [router, router.history]);
	return null;
}
//#endregion
export { Transitioner, settleOwner };

//# sourceMappingURL=Transitioner.js.map