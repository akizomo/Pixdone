import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureContentScript } from './ensureContentScript';

function mockLastError(message: string | undefined) {
  (chrome.runtime as unknown as { lastError: chrome.runtime.LastError | undefined }).lastError =
    message ? { message } : undefined;
}

describe('ensureContentScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLastError(undefined);
  });

  it('returns true without injecting when the content script is already alive', async () => {
    // Ping succeeds (no lastError, response received)
    (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_tabId: number, _msg: unknown, cb?: (resp: unknown) => void) => {
        mockLastError(undefined);
        cb?.({ alive: true, mounted: true });
      },
    );

    const ok = await ensureContentScript(123);

    expect(ok).toBe(true);
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  it('injects the content script when the initial ping fails', async () => {
    const sendMessage = chrome.tabs.sendMessage as ReturnType<typeof vi.fn>;
    let callCount = 0;
    sendMessage.mockImplementation(
      (_tabId: number, _msg: unknown, cb?: (resp: unknown) => void) => {
        callCount += 1;
        if (callCount === 1) {
          // First ping: no content script, lastError is set
          mockLastError('Could not establish connection. Receiving end does not exist.');
          cb?.(undefined);
        } else {
          // Second ping after injection succeeds
          mockLastError(undefined);
          cb?.({ alive: true });
        }
      },
    );
    (chrome.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const ok = await ensureContentScript(456);

    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 456 },
      files: ['assets/content.js'],
    });
    expect(ok).toBe(true);
  });

  it('returns false when executeScript rejects (e.g. chrome:// page)', async () => {
    (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_tabId: number, _msg: unknown, cb?: (resp: unknown) => void) => {
        mockLastError('Could not establish connection.');
        cb?.(undefined);
      },
    );
    (chrome.scripting.executeScript as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Cannot access a chrome:// URL'),
    );

    const ok = await ensureContentScript(789);
    expect(ok).toBe(false);
  });

  it('returns false when injection succeeds but subsequent ping still fails', async () => {
    (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_tabId: number, _msg: unknown, cb?: (resp: unknown) => void) => {
        mockLastError('Could not establish connection.');
        cb?.(undefined);
      },
    );
    (chrome.scripting.executeScript as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const ok = await ensureContentScript(999);
    expect(ok).toBe(false);
  });
});
