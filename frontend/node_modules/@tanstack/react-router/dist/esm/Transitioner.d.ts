import { AnyRouter } from '@tanstack/router-core';
import * as React from 'react';
export declare function settleOwner(owner: NonNullable<AnyRouter['_rendered']>, rendered: boolean): void;
export declare function Transitioner({ t, }: {
    t: React.Dispatch<React.SetStateAction<AnyRouter | undefined>>;
}): null;
