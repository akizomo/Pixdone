import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Preview } from '@storybook/react-vite';
import { ThemeProvider } from '../src/design-system';
import type { ThemeMode } from '../src/design-system/tokens';
import type { ThemeKey } from '../src/design-system/themes/themeRegistry';
import { initSoundEngine } from '../src/services/soundEngine';
import '../src/index.css';

initSoundEngine();

class StoryErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Storybook story error:', error, info);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: '#e8eaed', background: '#202124' }}>
          <h3 style={{ color: '#ea4335' }}>Error in story</h3>
          <pre style={{ overflow: 'auto', fontSize: 12 }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/** iPhone 12/13/14-class portrait insets (status bar 47pt, home indicator 34pt). */
const SAFE_AREA_PRESETS = {
  none: null,
  iphone: { top: 47, right: 0, bottom: 34, left: 0 },
} as const;

const preview: Preview = {
  globalTypes: {
    colorMode: {
      description: 'Color mode (light / dark)',
      defaultValue: 'dark',
      toolbar: {
        title: 'Color Mode',
        icon: 'circlehollow',
        items: [
          { value: 'dark', icon: 'moon', title: 'Dark' },
          { value: 'light', icon: 'sun', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
    visualTheme: {
      description: 'Visual theme',
      defaultValue: 'arcade',
      toolbar: {
        title: 'Visual Theme',
        icon: 'paintbrush',
        items: [
          { value: 'arcade', title: '🕹️ Arcade' },
          { value: 'synthwave', title: '🌆 Synthwave' },
          { value: 'forestbit', title: '🌲 Forest Bit' },
        ],
        dynamicTitle: true,
      },
    },
    safeArea: {
      description: 'Simulate native safe-area insets (status bar / home indicator)',
      defaultValue: 'none',
      toolbar: {
        title: 'Safe Area',
        icon: 'mobile',
        items: [
          { value: 'none', title: 'None (browser)' },
          { value: 'iphone', title: 'iPhone (notch)' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const colorMode = (context.globals.colorMode ?? 'dark') as ThemeMode;
      const visualTheme = (context.globals.visualTheme ?? 'arcade') as ThemeKey;

      // env(safe-area-inset-*) is always 0 in a desktop browser; overriding the
      // tokens shows what the edge-to-edge native app will look like.
      const inset = SAFE_AREA_PRESETS[(context.globals.safeArea ?? 'none') as keyof typeof SAFE_AREA_PRESETS];
      const rootStyle = document.documentElement.style;
      (['top', 'right', 'bottom', 'left'] as const).forEach((edge) => {
        if (inset) rootStyle.setProperty(`--pd-layout-safe-${edge}`, `${inset[edge]}px`);
        else rootStyle.removeProperty(`--pd-layout-safe-${edge}`);
      });

      return (
        <StoryErrorBoundary>
          {/*
           * key forces a full remount when mode/theme changes so ThemeProvider
           * re-initialises with the new defaultTheme value.
           */}
          <ThemeProvider
            key={`${colorMode}-${visualTheme}`}
            defaultTheme={colorMode}
            defaultVisualTheme={visualTheme}
          >
            <div
              style={{
                padding: '24px',
                background: 'var(--pxd-color-surface-page)',
                color: 'var(--pxd-color-text-primary)',
                boxSizing: 'border-box',
              }}
            >
              <Story />
            </div>
          </ThemeProvider>
        </StoryErrorBoundary>
      );
    },
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    docs: {
      toc: true,
      layout: 'fullscreen',
    },
  },
};

export default preview;
