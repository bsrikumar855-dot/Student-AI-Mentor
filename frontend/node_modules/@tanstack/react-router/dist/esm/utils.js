"use client";
import * as React$1 from "react";
import { isServer } from "@tanstack/router-core/isServer";
/**
* React.use if available (React 19+), undefined otherwise.
* Use dynamic lookup to avoid Webpack compilation errors with React 18.
*/
var reactUse = React$1["use"];
var useLayoutEffect = isServer ?? typeof window === "undefined" ? React$1.useEffect : React$1.useLayoutEffect;
/**
* React hook to wrap `IntersectionObserver`.
*
* This hook will create an `IntersectionObserver` and observe the ref passed to it.
*
* When the intersection changes, the callback will be called with the `IntersectionObserverEntry`.
*
* @param ref - The ref to observe
* @param callback - The callback to call when the intersection changes
* @param disabled - Whether observation is disabled
* @returns The IntersectionObserver instance
* @example
* ```tsx
* const MyComponent = () => {
* const ref = React.useRef<HTMLDivElement>(null)
* useIntersectionObserver(
*  ref,
*  (entry) => { doSomething(entry) },
*  false
* )
* return <div ref={ref} />
* ```
*/
function useIntersectionObserver(ref, callback, disabled) {
	React$1.useEffect(() => {
		if (!ref.current || disabled || typeof IntersectionObserver !== "function") return () => callback();
		const observer = new IntersectionObserver((entries) => {
			callback(entries.pop());
		}, { rootMargin: "100px" });
		observer.observe(ref.current);
		return () => {
			observer.disconnect();
			callback();
		};
	}, [
		callback,
		disabled,
		ref
	]);
}
/**
* React hook to take a `React.ForwardedRef` and returns a `ref` that can be used on a DOM element.
*
* @param ref - The forwarded ref
* @returns The inner ref returned by `useRef`
* @example
* ```tsx
* const MyComponent = React.forwardRef((props, ref) => {
*  const innerRef = useForwardedRef(ref)
*  return <div ref={innerRef} />
* })
* ```
*/
function useForwardedRef(ref) {
	const innerRef = React$1.useRef(null);
	React$1.useImperativeHandle(ref, () => innerRef.current, []);
	return innerRef;
}
//#endregion
export { reactUse, useForwardedRef, useIntersectionObserver, useLayoutEffect };

//# sourceMappingURL=utils.js.map