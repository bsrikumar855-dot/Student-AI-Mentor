"use client";
const require_runtime = require("./_virtual/_rolldown/runtime.cjs");
const require_nonRouteComponentContext = require("./nonRouteComponentContext.cjs");
let react = require("react");
react = require_runtime.__toESM(react, 1);
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/CatchBoundary.tsx
var CatchBoundary = class extends react.Component {
	constructor(..._args) {
		super(..._args);
		this.state = { error: null };
		this.reset = () => {
			this.setState({ error: null });
		};
	}
	static getDerivedStateFromProps(props, state) {
		const resetKey = props.getResetKey();
		if (state.error && state.resetKey !== resetKey) return {
			resetKey,
			error: null
		};
		return { resetKey };
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, errorInfo) {
		this.props.onCatch?.(error, errorInfo);
	}
	render() {
		const error = this.state.error;
		if (error) {
			const element = react.createElement(this.props.errorComponent ?? ErrorComponent, {
				error,
				reset: this.reset
			});
			return process.env.NODE_ENV !== "production" ? require_nonRouteComponentContext.wrapInNonRouteComponentContext(element, "errorComponent") : element;
		}
		return this.props.children;
	}
};
function ErrorComponent({ error }) {
	const [show, setShow] = react.useState(process.env.NODE_ENV !== "production");
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			padding: ".5rem",
			maxWidth: "100%"
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: ".5rem"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
					style: { fontSize: "1rem" },
					children: "Something went wrong!"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					style: {
						appearance: "none",
						fontSize: ".6em",
						border: "1px solid currentColor",
						padding: ".1rem .2rem",
						fontWeight: "bold",
						borderRadius: ".25rem"
					},
					onClick: () => setShow((d) => !d),
					children: show ? "Hide Error" : "Show Error"
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: { height: ".25rem" } }),
			show ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
				style: {
					fontSize: ".7em",
					border: "1px solid red",
					borderRadius: ".25rem",
					padding: ".3rem",
					color: "red",
					overflow: "auto"
				},
				children: error.message ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: error.message }) : null
			}) }) : null
		]
	});
}
//#endregion
exports.CatchBoundary = CatchBoundary;
exports.ErrorComponent = ErrorComponent;

//# sourceMappingURL=CatchBoundary.cjs.map