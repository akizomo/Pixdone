import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { QuickPanelApp } from '../panel/QuickPanelApp';
import { getThemeCSSVariables } from '@app/design-system';

// DS tokens (shared across every DS component).
import tokensCssRaw from '../panel/tokens.css?inline';

// DS component CSS — bundled at build time as inline strings and injected into
// the shadow root so our panel inherits every DS style without leaking the
// page's styles in.
import chipCss from '@app/design-system/components/Chip/Chip.css?inline';
import pixelIconCss from '@app/design-system/components/PixelIcon/PixelIcon.css?inline';
import buttonCss from '@app/design-system/components/Button/Button.css?inline';
import iconButtonCss from '@app/design-system/components/IconButton/IconButton.css?inline';
import checkboxCss from '@app/design-system/components/Checkbox/Checkbox.css?inline';
import badgeCss from '@app/design-system/components/Badge/Badge.css?inline';
import textFieldCss from '@app/design-system/components/TextField/TextField.css?inline';
import textAreaCss from '@app/design-system/components/TextArea/TextArea.css?inline';
import richTextFieldCss from '@app/design-system/components/RichTextField/RichTextField.css?inline';
import richTextAreaCss from '@app/design-system/components/RichTextArea/RichTextArea.css?inline';
import popoverMenuCss from '@app/design-system/components/PopoverMenu/PopoverMenu.css?inline';
import toastCss from '@app/design-system/components/Toast/Toast.css?inline';
import emptyStateCss from '@app/design-system/components/EmptyState/EmptyState.css?inline';
import toggleCss from '@app/design-system/components/Toggle/Toggle.css?inline';
import textLinkCss from '@app/design-system/components/TextLink/TextLink.css?inline';
import modalDialogCss from '@app/design-system/components/ModalDialog/ModalDialog.css?inline';
import bottomSheetCss from '@app/design-system/components/BottomSheet/BottomSheet.css?inline';
import pixelCss from '@app/design-system/theme/pixel.css?inline';

// App-level components (TaskForm / TaskItem / ListTabs) — re-used here verbatim.
import taskFormCss from '@app/components/TaskForm.css?inline';
import taskItemCss from '@app/components/TaskItem.css?inline';
import listTabsCss from '@app/components/ListTabs.css?inline';

// Quick-specific panel shell (the only non-DS CSS — covers layout, not controls).
import shellCss from '../panel/QuickPanelShell.css?inline';

const HOST_ID = 'pixdone-quick-root';

// Pixel fonts are bundled via @fontsource (see content/index.ts). @crxjs
// wires those imports into the manifest's content_scripts.css entry, which
// the browser loads into the host document — so we don't need to fetch from
// Google Fonts at runtime (avoids host-page CSP blocking).

// tokens.css targets `:root`, which doesn't match inside a shadow root.
// Rewriting to `:host, :root` makes the CSS variables apply in both places.
const tokensCss = tokensCssRaw.replace(/:root\b/g, ':host, :root');

/**
 * DS components use a second tier of "legacy" CSS variables (e.g.
 * `--pd-color-accent-default`, `--pd-color-background-hover`) that are
 * normally written to `document.documentElement` by `<ThemeProvider>`. In the
 * shadow DOM we don't want to touch the host page's html element, so we build
 * the same variables as a static CSS block and inject them into the shadow.
 *
 * We pin to 'light' mode for MVP — matches the Storybook default look.
 */
function buildLegacyTokensCss(): string {
  const vars = getThemeCSSVariables('light');
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `:host, :root {\n${lines.join('\n')}\n}`;
}

const EXTRA_RESET = `
:host, #pixdone-quick-react-host {
  font-family: var(--pd-font-body);
  color: var(--pd-color-text-primary);
  font-size: var(--pd-font-size-sm);
  line-height: var(--pd-line-height-normal);
}
*, *::before, *::after { box-sizing: border-box; }
`;

export function mountQuickPanel(): void {
  if (document.getElementById(HOST_ID)) return;
  const host = document.createElement('div');
  host.id = HOST_ID;
  // z-index must stay BELOW animations.js particle layers (9998–100000) so
  // completion effects render above the panel. Previously maxed to
  // 2147483647, which hid all effect particles behind the transparent shadow
  // host. 9997 is still above virtually every host-page element (typical SPA
  // modals rarely exceed ~1000) while letting our own effects punch through.
  host.style.cssText =
    'all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 9997;';
  const shadow = host.attachShadow({ mode: 'open' });

  // Aggregate every stylesheet into one <style> element for a single paint.
  const style = document.createElement('style');
  style.textContent = [
    tokensCss,
    buildLegacyTokensCss(),
    EXTRA_RESET,
    pixelCss,
    pixelIconCss,
    buttonCss,
    iconButtonCss,
    chipCss,
    checkboxCss,
    badgeCss,
    textFieldCss,
    textAreaCss,
    richTextFieldCss,
    richTextAreaCss,
    popoverMenuCss,
    toastCss,
    emptyStateCss,
    toggleCss,
    textLinkCss,
    modalDialogCss,
    bottomSheetCss,
    taskFormCss,
    taskItemCss,
    listTabsCss,
    shellCss,
  ].join('\n');
  shadow.appendChild(style);

  const reactHost = document.createElement('div');
  reactHost.id = 'pixdone-quick-react-host';
  reactHost.style.cssText = 'pointer-events: auto;';
  shadow.appendChild(reactHost);

  // Dedicated portal container for DS components (PopoverMenu, future modals).
  // MUST be a sibling of reactHost (not a child) because React's createRoot
  // wipes reactHost's children on first render. Both children of the shadow
  // root need `pointer-events: auto` explicitly — otherwise they'd inherit
  // `pointer-events: none` from the outer host element.
  const portalContainer = document.createElement('div');
  portalContainer.id = 'pixdone-quick-portal';
  portalContainer.style.cssText = 'pointer-events: auto;';
  shadow.appendChild(portalContainer);

  document.documentElement.appendChild(host);
  console.log('[PixDone Quick/content] shadow host mounted');

  createRoot(reactHost).render(
    <StrictMode>
      <QuickPanelApp shadowRoot={shadow} portalContainer={portalContainer} />
    </StrictMode>,
  );
}
