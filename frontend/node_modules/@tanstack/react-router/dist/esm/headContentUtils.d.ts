import { AssetCrossOriginConfig, RouterManagedTag } from '@tanstack/router-core';
/**
 * Build the head/link/meta/script tags from the renderable presented prefix.
 * Used internally by `HeadContent`.
 */
export declare const useTags: (assetCrossOrigin?: AssetCrossOriginConfig) => RouterManagedTag[];
