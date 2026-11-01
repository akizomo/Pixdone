import { Capacitor } from '@capacitor/core';
import type { TopAppBarPlatform } from './TopAppBar.types';

/** iOS = native iOS app or Safari/WebView on iPhone/iPad. Everything else uses Material. */
export function resolveTopAppBarPlatform(platform: TopAppBarPlatform): 'ios' | 'material' {
  if (platform !== 'auto') return platform;
  const native = Capacitor.getPlatform();
  if (native === 'ios') return 'ios';
  if (native === 'android') return 'material';
  if (typeof navigator === 'undefined') return 'material';
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a Mac UA; distinguish it by touch support.
  const isIPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || isIPad ? 'ios' : 'material';
}
