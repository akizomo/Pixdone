import { createContext, useContext, type ReactNode } from 'react';

/**
 * Portal target for DS components that use `createPortal`.
 *
 * Default: `undefined` (consumers fall back to `document.body`).
 *
 * Override by wrapping part of the React tree in `<PortalContainerProvider>`.
 * The Chrome extension uses this to portal popovers INTO its shadow root so
 * shadow-scoped styles (including CSS tokens) apply to the floating menu.
 */
const PortalContainerContext = createContext<Element | DocumentFragment | undefined>(undefined);

export function usePortalContainer(): Element | DocumentFragment | undefined {
  return useContext(PortalContainerContext);
}

export interface PortalContainerProviderProps {
  container: Element | DocumentFragment;
  children: ReactNode;
}

export function PortalContainerProvider({ container, children }: PortalContainerProviderProps) {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  );
}
