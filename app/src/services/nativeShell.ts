/**
 * Native app shell behaviour (Capacitor). No-op on the web.
 * - html[data-native] for native-only CSS (global.css)
 * - Status bar icon colour follows the current theme background
 * - Hides the iOS keyboard accessory bar (‹ › Done)
 * - Android back button: close the top overlay → press the visible back button → minimize
 */
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

/** Relative luminance of an `rgb()` / `rgba()` computed colour, 0–1. */
function luminance(rgb: string): number | null {
  const m = rgb.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function syncSystemBarsStyle(): void {
  const bg = getComputedStyle(document.body).backgroundColor;
  const lum = luminance(bg);
  if (lum == null) return;
  // Dark = light icons for a dark background.
  const style = lum < 0.4 ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
  SystemBars.setStyle({ style }).catch(() => {});
}

function watchThemeForSystemBars(): void {
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    // Wait a frame so ThemeProvider's CSS variables have been applied.
    frame = requestAnimationFrame(syncSystemBarsStyle);
  };
  // ThemeProvider writes data-theme / data-visual-theme / inline CSS variables on <html>.
  new MutationObserver(schedule).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-visual-theme', 'style'],
  });
  // body animates background-color; re-read once the transition settles.
  document.body.addEventListener('transitionend', (e) => {
    if (e.target === document.body && e.propertyName === 'background-color') schedule();
  });
  schedule();
}

/** Overlays that already close on Escape (ModalDialog, BottomSheet, FocusZenMode, PopoverMenu, ...). */
const ESCAPABLE_OVERLAY = '[aria-modal="true"], [role="menu"]';

function handleAndroidBack(): void {
  if (document.querySelector(ESCAPABLE_OVERLAY)) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return;
  }
  // SubPageHeader / DetailViewHeader mark their back button; the last one is the topmost screen.
  const backButtons = document.querySelectorAll<HTMLElement>('[data-pd-back]');
  const back = backButtons[backButtons.length - 1];
  if (back) {
    back.click();
    return;
  }
  App.minimizeApp().catch(() => {});
}

export function initNativeShell(): void {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.dataset.native = Capacitor.getPlatform();

  watchThemeForSystemBars();

  if (Capacitor.getPlatform() === 'ios') {
    Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
  }

  if (Capacitor.getPlatform() === 'android') {
    App.addListener('backButton', handleAndroidBack).catch(() => {});
  }
}
