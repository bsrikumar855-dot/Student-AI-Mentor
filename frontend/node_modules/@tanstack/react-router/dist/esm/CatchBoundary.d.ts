import { ErrorRouteComponent } from './route.js';
import { ErrorInfo } from 'react';
import * as React from 'react';
export declare class CatchBoundary extends React.Component<{
    getResetKey: () => unknown;
    children: React.ReactNode;
    errorComponent?: ErrorRouteComponent;
    onCatch?: (error: Error, errorInfo: ErrorInfo) => void;
}> {
    state: {
        error: Error | null;
        resetKey?: unknown;
    };
    static getDerivedStateFromProps(props: {
        getResetKey: () => unknown;
    }, state: {
        resetKey?: unknown;
        error: Error | null;
    }): {
        resetKey: unknown;
        error: null;
    } | {
        resetKey: unknown;
        error?: undefined;
    };
    static getDerivedStateFromError(error: Error): {
        error: Error;
    };
    reset: () => void;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | React.FunctionComponentElement<import('@tanstack/router-core').ErrorComponentProps> | null | undefined;
}
export declare function ErrorComponent({ error }: {
    error: any;
}): import("react/jsx-runtime").JSX.Element;
