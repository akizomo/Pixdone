import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Preview } from '@storybook/react-vite';
import { ThemeProvider } from '../src/design-system';
import '../src/index.css';

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

const preview: Preview = {
  decorators: [
    (Story) => (
      <StoryErrorBoundary>
        <ThemeProvider>
          <div
            style={{
              minHeight: '100vh',
              padding: '1rem',
              background: 'var(--pd-color-background-default)',
              color: 'var(--pd-color-text-primary)',
            }}
          >
            <Story />
          </div>
        </ThemeProvider>
      </StoryErrorBoundary>
    ),
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
  },
};

export default preview;
