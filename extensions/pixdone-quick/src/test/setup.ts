import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Minimal Chrome API shim so modules that reference `chrome.*` at import time
// don't throw. Tests override specific pieces via vi.spyOn / vi.fn.
interface ChromeShim {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: { addListener: ReturnType<typeof vi.fn> };
    onMessageExternal: { addListener: ReturnType<typeof vi.fn> };
    onInstalled: { addListener: ReturnType<typeof vi.fn> };
    lastError: chrome.runtime.LastError | undefined;
    getManifest: ReturnType<typeof vi.fn>;
    getURL: ReturnType<typeof vi.fn>;
    id: string;
  };
  tabs: {
    sendMessage: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
  };
  scripting: { executeScript: ReturnType<typeof vi.fn> };
  storage: {
    local: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
      remove: ReturnType<typeof vi.fn>;
    };
    onChanged: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
  };
  alarms: {
    create: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    onAlarm: { addListener: ReturnType<typeof vi.fn> };
  };
  commands: { onCommand: { addListener: ReturnType<typeof vi.fn> } };
  contextMenus: {
    create: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    onClicked: { addListener: ReturnType<typeof vi.fn> };
  };
  windows: { create: ReturnType<typeof vi.fn> };
}

const shim: ChromeShim = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    onMessageExternal: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    lastError: undefined,
    getManifest: vi.fn(() => ({
      content_scripts: [{ js: ['assets/content.js'], matches: ['<all_urls>'] }],
    })),
    getURL: vi.fn((path: string) => `chrome-extension://test-ext-id/${path}`),
    id: 'test-ext-id',
  },
  tabs: { sendMessage: vi.fn(), query: vi.fn() },
  scripting: { executeScript: vi.fn() },
  storage: {
    local: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
    onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  alarms: { create: vi.fn(), clear: vi.fn(), onAlarm: { addListener: vi.fn() } },
  commands: { onCommand: { addListener: vi.fn() } },
  contextMenus: { create: vi.fn(), remove: vi.fn(), onClicked: { addListener: vi.fn() } },
  windows: { create: vi.fn() },
};

// Expose on the global so modules that reference `chrome.*` work in tests.
(globalThis as unknown as { chrome: ChromeShim }).chrome = shim;
