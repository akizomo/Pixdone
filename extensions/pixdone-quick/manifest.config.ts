import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'PixDone Quick',
  version: pkg.version,
  description: 'Capture and smash tasks without leaving the page.',
  action: {
    default_icon: {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      // `document_start` ensures our `window.addEventListener('message', ...)`
      // auth-relay listener is attached before any host-page script runs.
      // Previously `document_idle` raced ExtensionLinkPage's auto-sign-in
      // postMessage (fires from a useEffect that completes well before idle
      // when Firebase has a cached session) — the message landed before the
      // listener existed, so the panel never got the auth update. Mount runs
      // against `document.documentElement` (always present at document_start),
      // so this change is safe.
      run_at: 'document_start',
    },
    // MAIN-world pair: vanilla animations engine + our bridge that listens for
    // `pixdone-quick:play-effect` CustomEvents from the isolated-world React
    // panel. Keeping these in MAIN world (a) avoids re-bundling the 7k-line
    // animations script inside our React chunk, and (b) lets particle overlays
    // render on the host page's document.body correctly.
    {
      matches: ['<all_urls>'],
      js: ['src/main-world/animations.js', 'src/main-world/bridge.js'],
      run_at: 'document_idle',
      world: 'MAIN',
    },
  ],
  permissions: ['storage', 'activeTab', 'scripting', 'contextMenus', 'alarms'],
  web_accessible_resources: [
    {
      resources: [
        'world/**/*',
        'pixdone-logo-black.svg',
        'pixdone-symbol-black.svg',
        // Content-scripts CSS bundle (auto-emitted by @crxjs from
        // @fontsource imports). The runtime font reinjector in
        // src/content/index.ts fetches this from the extension origin,
        // rewrites `url(/assets/...)` paths to chrome-extension:// URLs,
        // and re-injects so @font-face actually resolves. Without this
        // entry, Chrome blocks the fetch as "not in web_accessible_resources".
        'assets/*.css',
        // Bundled pixel fonts — content_scripts.css references these via
        // absolute paths (`/assets/...woff2`) which would resolve against the
        // host page unless declared here.
        'assets/*.woff2',
        'assets/*.woff',
      ],
      matches: ['<all_urls>'],
    },
  ],
  host_permissions: [
    'https://pixdone.akizony.com/*',
    'https://pixdone.vercel.app/*',
    'http://localhost:5173/*',
    'https://securetoken.googleapis.com/*',
    'https://firestore.googleapis.com/*',
  ],
  externally_connectable: {
    matches: [
      'https://pixdone.akizony.com/*',
      'https://pixdone.vercel.app/*',
      'http://localhost:5173/*',
    ],
  },
  commands: {
    'toggle-panel': {
      suggested_key: {
        default: 'Ctrl+Shift+Y',
        mac: 'Command+Shift+Y',
      },
      description: 'Toggle PixDone Quick panel',
    },
  },
  icons: {
    16: 'icons/icon-16.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
});
