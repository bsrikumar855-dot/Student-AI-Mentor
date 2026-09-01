import * as React from 'react';
export type NonRouteComponent = 'pendingComponent' | 'errorComponent' | 'notFoundComponent';
export declare const nonRouteComponentContext: React.Context<NonRouteComponent | undefined> | undefined;
export declare function wrapInNonRouteComponentContext(element: React.ReactElement, component: NonRouteComponent): React.ReactElement;
