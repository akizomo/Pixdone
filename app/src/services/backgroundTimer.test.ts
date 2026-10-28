import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const plugin = vi.hoisted(() => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  checkPermissions: vi.fn().mockResolvedValue({ notifications: 'prompt' }),
  requestPermissions: vi.fn().mockResolvedValue({ notifications: 'granted' }),
}));
const platform = vi.hoisted(() => ({ current: 'android' }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => platform.current },
  registerPlugin: () => plugin,
}));

const opts = { title: 'Focusing', text: 'Tap', endAt: 1_000_000 };

describe('backgroundTimer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    Object.values(plugin).forEach((f) => f.mockClear());
    platform.current = 'android';
  });
  afterEach(() => vi.useRealTimers());

  it('does nothing on the web and on iOS', async () => {
    const m = await import('./backgroundTimer');
    for (const p of ['web', 'ios']) {
      platform.current = p;
      await m.startBackgroundTimer(opts);
      m.stopBackgroundTimer();
    }
    expect(plugin.start).not.toHaveBeenCalled();
    expect(plugin.stop).not.toHaveBeenCalled();
  });

  it('asks for the notification permission once, then starts the service with the end time', async () => {
    const m = await import('./backgroundTimer');
    await m.startBackgroundTimer(opts);
    await m.startBackgroundTimer(opts);
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1);
    expect(plugin.start).toHaveBeenCalledTimes(2);
    expect(plugin.start).toHaveBeenCalledWith(opts);
  });

  it('still starts the service when the permission is denied', async () => {
    plugin.requestPermissions.mockResolvedValueOnce({ notifications: 'denied' });
    const m = await import('./backgroundTimer');
    await m.startBackgroundTimer(opts);
    expect(plugin.start).toHaveBeenCalledTimes(1);
  });

  it('does not prompt when the permission is already granted', async () => {
    plugin.checkPermissions.mockResolvedValueOnce({ notifications: 'granted' });
    const m = await import('./backgroundTimer');
    await m.startBackgroundTimer(opts);
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
  });

  it('stops immediately, or after a delay that a new start cancels', async () => {
    const m = await import('./backgroundTimer');
    m.stopBackgroundTimer();
    expect(plugin.stop).toHaveBeenCalledTimes(1);

    plugin.stop.mockClear();
    m.stopBackgroundTimer(8000);
    expect(plugin.stop).not.toHaveBeenCalled();
    vi.advanceTimersByTime(8000);
    expect(plugin.stop).toHaveBeenCalledTimes(1);

    plugin.stop.mockClear();
    m.stopBackgroundTimer(8000);
    await m.startBackgroundTimer(opts); // a new session started: the pending stop must not fire
    vi.advanceTimersByTime(10_000);
    expect(plugin.stop).not.toHaveBeenCalled();
  });

  it('swallows plugin errors (a failing service must never break the timer)', async () => {
    plugin.start.mockRejectedValueOnce(new Error('boom'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = await import('./backgroundTimer');
    await expect(m.startBackgroundTimer(opts)).resolves.toBeUndefined();
    warn.mockRestore();
  });
});
