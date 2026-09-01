"use client";
import * as React$1 from "react";
import { jsx } from "react/jsx-runtime";
//#region src/nonRouteComponentContext.tsx
var nonRouteComponentContext = process.env.NODE_ENV !== "production" ? React$1.createContext(void 0) : void 0;
function wrapInNonRouteComponentContext(element, component) {
	return /* @__PURE__ */ jsx(nonRouteComponentContext.Provider, {
		value: component,
		children: element
	});
}
//#endregion
export { nonRouteComponentContext, wrapInNonRouteComponentContext };

//# sourceMappingURL=nonRouteComponentContext.js.map