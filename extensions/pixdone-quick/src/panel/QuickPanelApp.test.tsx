import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QuickPanelApp } from './QuickPanelApp';

/**
 * QuickPanelApp — critical user-visible behavior.
 *
 * These tests describe the contract between the content script (which
 * dispatches `pixdone-quick:message` events on the window) and the React
 * panel that must respond.
 */

function fireWindowMessage(
  type: 'TOGGLE_PANEL' | 'OPEN_ADD_TASK',
  extra: Record<string, unknown> = {},
) {
  act(() => {
    window.dispatchEvent(
      new CustomEvent('pixdone-quick:message', {
        detail: { type, ...extra },
      }),
    );
  });
}

function renderPanel() {
  // Shadow root isn't actually needed for these tests; we pass a stub.
  const host = document.createElement('div');
  host.attachShadow({ mode: 'open' });
  const shadow = host.shadowRoot!;
  return render(<QuickPanelApp shadowRoot={shadow} />);
}

describe('QuickPanelApp initial mount', () => {
  beforeEach(() => {
    // Default to a signed-in state for existing tests; auth-aware tests
    // override this to verify the signed-out UI.
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (_key: string, cb?: (result: Record<string, unknown>) => void) => {
        const result = {
          pixdoneAuth: { idToken: 'test', uid: 'uid-1', email: 'test@example.com' },
        };
        if (cb) cb(result);
        return Promise.resolve(result);
      },
    );
  });

  it('renders nothing visible before a TOGGLE_PANEL message is received', () => {
    renderPanel();
    expect(screen.queryByRole('dialog', { name: /PixDone Quick/i })).toBeNull();
  });

  it('shows the panel dialog after a TOGGLE_PANEL window event', () => {
    renderPanel();
    fireWindowMessage('TOGGLE_PANEL');
    expect(screen.getByRole('dialog', { name: /PixDone Quick/i })).toBeInTheDocument();
  });

  it('closes the panel on a second TOGGLE_PANEL event', () => {
    renderPanel();
    fireWindowMessage('TOGGLE_PANEL');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireWindowMessage('TOGGLE_PANEL');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the add-task form on OPEN_ADD_TASK', () => {
    const { container } = renderPanel();
    fireWindowMessage('OPEN_ADD_TASK', {
      selection: 'Selected text',
      pageTitle: 'Page Title',
      pageUrl: 'https://example.com',
    });
    // DS TaskForm uses RichTextField (contenteditable) with data-placeholder.
    const titleField = container.querySelector(
      '[data-placeholder="Task name"], [data-placeholder="タスク名"]',
    );
    expect(titleField).not.toBeNull();
  });
});

describe('QuickPanelApp keyboard shortcut', () => {
  beforeEach(() => {
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (_key: string, cb?: (result: Record<string, unknown>) => void) => {
        const result = {
          pixdoneAuth: { idToken: 'test', uid: 'uid-1', email: 'test@example.com' },
        };
        if (cb) cb(result);
        return Promise.resolve(result);
      },
    );
  });

  it('opens the panel on Cmd+Shift+Y (macOS)', () => {
    renderPanel();
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Y',
          shiftKey: true,
          metaKey: true,
          bubbles: true,
        }),
      );
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens the panel on Ctrl+Shift+Y (Linux/Windows)', () => {
    renderPanel();
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'y',
          shiftKey: true,
          ctrlKey: true,
          bubbles: true,
        }),
      );
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes the panel on Escape when open', () => {
    renderPanel();
    fireWindowMessage('TOGGLE_PANEL');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('QuickPanelApp auth-aware UI', () => {
  function mockAuth(auth: { idToken?: string; email?: string; uid?: string } | null) {
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (_key: string, cb?: (result: Record<string, unknown>) => void) => {
        const result = auth ? { pixdoneAuth: auth } : {};
        if (cb) cb(result);
        return Promise.resolve(result);
      },
    );
  }

  it('shows a Sign-in action when there is no stored auth', async () => {
    mockAuth(null);
    renderPanel();
    fireWindowMessage('TOGGLE_PANEL');
    // Give the auth-check effect time to read chrome.storage
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const btn = screen.queryByRole('button', { name: /Sign in/i });
    expect(btn).not.toBeNull();
  });

  it('shows the account menu trigger when signed in', async () => {
    mockAuth({ idToken: 'test-token', email: 'user@example.com', uid: 'uid-123' });
    renderPanel();
    fireWindowMessage('TOGGLE_PANEL');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const trigger = screen.queryByRole('button', { name: /Account menu/i });
    expect(trigger).not.toBeNull();
  });
});

describe('QuickPanelApp click-outside behavior (real Shadow DOM)', () => {
  beforeEach(() => {
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (_key: string, cb?: (result: Record<string, unknown>) => void) => {
        const result = {
          pixdoneAuth: { idToken: 'test', uid: 'uid-1', email: 'test@example.com' },
        };
        if (cb) cb(result);
        return Promise.resolve(result);
      },
    );
  });

  /**
   * Renders QuickPanelApp INSIDE a real Shadow DOM so `e.target` for document-level
   * listeners is retargeted to the shadow host — exactly as it is in the extension
   * content script.
   */
  async function renderInShadow(): Promise<{
    host: HTMLElement;
    shadow: ShadowRoot;
    reactHost: HTMLElement;
  }> {
    const host = document.createElement('div');
    host.id = 'test-pixdone-quick-root';
    const shadow = host.attachShadow({ mode: 'open' });
    const reactHost = document.createElement('div');
    shadow.appendChild(reactHost);
    document.body.appendChild(host);

    const { createRoot } = await import('react-dom/client');
    const { StrictMode } = await import('react');
    await act(async () => {
      createRoot(reactHost).render(
        <StrictMode>
          <QuickPanelApp shadowRoot={shadow} />
        </StrictMode>,
      );
    });
    return { host, shadow, reactHost };
  }

  function findDialog(shadow: ShadowRoot): HTMLElement | null {
    return shadow.querySelector<HTMLElement>('[role="dialog"]');
  }

  it('does NOT close the panel when clicking an element inside it', async () => {
    const { host, shadow } = await renderInShadow();
    act(() => {
      window.dispatchEvent(
        new CustomEvent('pixdone-quick:message', { detail: { type: 'TOGGLE_PANEL' } }),
      );
    });
    const dialog = findDialog(shadow);
    expect(dialog).not.toBeNull();

    // Wait for the click-outside listener to attach (setTimeout 0 inside the effect)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Dispatch mousedown on an element inside the dialog. Because the panel is in a
    // shadow root, a document-level listener will see `e.target === host` (retarget).
    // `composed: true` lets the event cross the shadow boundary.
    const inside = (dialog?.querySelector('header') ?? dialog) as HTMLElement;
    act(() => {
      inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    });

    expect(findDialog(shadow)).not.toBeNull();
    host.remove();
  });

  it('closes the panel when clicking on the host page outside the shadow', async () => {
    const { host, shadow } = await renderInShadow();
    act(() => {
      window.dispatchEvent(
        new CustomEvent('pixdone-quick:message', { detail: { type: 'TOGGLE_PANEL' } }),
      );
    });
    expect(findDialog(shadow)).not.toBeNull();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Simulate clicking on the host page (not inside our shadow DOM).
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    act(() => {
      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    });

    expect(findDialog(shadow)).toBeNull();
    outside.remove();
    host.remove();
  });
});
