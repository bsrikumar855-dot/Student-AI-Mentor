import { useRouter } from './useRouter.cjs';
import { AnyRoute, AnyRouteMatch } from '@tanstack/router-core';
import * as React from 'react';
export declare function renderPending(router: ReturnType<typeof useRouter>, route?: AnyRoute): import("react/jsx-runtime").JSX.Element | null;
export declare const Match: React.MemoExoticComponent<({ routeId, }: {
    routeId: string;
}) => import("react/jsx-runtime").JSX.Element>;
export declare const MatchInner: React.MemoExoticComponent<({ match, }: {
    match: AnyRouteMatch;
}) => any>;
/**
 * Render the next child match in the route tree. Typically used inside
 * a route component to render nested routes.
 *
 * @link https://tanstack.com/router/latest/docs/framework/react/api/router/outletComponent
 */
export declare const Outlet: React.MemoExoticComponent<() => import("react/jsx-runtime").JSX.Element | null>;
