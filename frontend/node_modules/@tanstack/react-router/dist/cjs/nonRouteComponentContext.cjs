"use client";
const require_runtime = require("./_virtual/_rolldown/runtime.cjs");
let react = require("react");
react = require_runtime.__toESM(react, 1);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/nonRouteComponentContext.tsx
var nonRouteComponentContext = process.env.NODE_ENV !== "production" ? react.createContext(void 0) : void 0;
function wrapInNonRouteComponentContext(element, component) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(nonRouteComponentContext.Provider, {
		value: component,
		children: element
	});
}
//#endregion
exports.nonRouteComponentContext = nonRouteComponentContext;
exports.wrapInNonRouteComponentContext = wrapInNonRouteComponentContext;

//# sourceMappingURL=nonRouteComponentContext.cjs.map