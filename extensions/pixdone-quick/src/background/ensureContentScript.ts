/// <reference types="chrome" />
/**
 * Ensure the PixDone Quick content script is running in a given tab.
 *
 * MV3 does NOT auto-inject content_scripts into tabs that were open before
 * the extension was installed or reloaded. That causes every
 * `chrome.tabs.sendMessage` to fail with "Receiving end does not exist".
 *
 * This helper:
 *  1. Pings the tab.
 *  2. On failure, reads the content_scripts list from the manifest and runs
 *     `chrome.scripting.executeScript` to inject them.
 *  3. Returns true if the tab now has a listener, false otherwise (e.g.
 *     chrome:// pages or the Web Store where scripting is disallowed).
 */
import { ddebug } from '../log';

async function pingTab(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { type: 'PIXDONE_PING' }, () => {
        resolve(!chrome.runtime.lastError);
      });
    } catch {
      resolve(false);
    }
  });
}

function getContentScriptFiles(): { js: string[]; css: string[] } {
  const manifest = chrome.runtime.getManifest();
  const scripts = manifest.content_scripts ?? [];
  const js: string[] = [];
  const css: string[] = [];
  for (const entry of scripts) {
    const e = entry as { js?: string[]; css?: string[] };
    if (Array.isArray(e.js)) js.push(...e.js);
    if (Array.isArray(e.css)) css.push(...e.css);
  }
  return { js, css };
}

export async function ensureContentScript(tabId: number): Promise<boolean> {
  if (await pingTab(tabId)) return true;

  const { js, css } = getContentScriptFiles();
  if (js.length === 0) return false;

  try {
    // CSS first so @font-face registers before the JS can paint. Chrome
    // re-injects static content_scripts.css only on navigation, not on
    // extension reload — so we mirror it here to keep the pixel fonts loaded
    // after a dev reload.
    if (css.length > 0) {
      try {
        await chrome.scripting.insertCSS({ target: { tabId }, files: css });
      } catch (cssErr) {
        ddebug('[PixDone Quick/bg] insertCSS failed (non-fatal):', cssErr);
      }
    }
    await chrome.scripting.executeScript({ target: { tabId }, files: js });
  } catch (e) {
    ddebug('[PixDone Quick/bg] executeScript failed:', e);
    return false;
  }

  // Give the content script a tick to register its message listener.
  await new Promise((r) => setTimeout(r, 50));
  return pingTab(tabId);
}
