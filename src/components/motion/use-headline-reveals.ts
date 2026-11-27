'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { mountHeadlineReveals } from './text-reveal';

/** Enhance server-rendered headlines inside `rootRef` with line-by-line reveals. */
export function useHeadlineReveals(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    return root ? mountHeadlineReveals(root) : undefined;
  }, [rootRef]);
}
