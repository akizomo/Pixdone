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

const analytics = vi.hoisted(() => ({ trackFocusLiveActivityStart: vi.fn() }));
vi.mock('./analytics', () => analytics);

const opts = { title: 'Focusing', text: 'Tap', endAt: 1_000_000 };

describe('backgroundTimer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    Object.values(plugin).forEach((f) => f.mockClear());
    analytics.trackFocusLiveActivityStart.mockClear();
    platform.current = 'android';
  });
  afterEach(() => vi.useRealTimers());

  it('does nothing on the web', async () => {
    const m = await import('./backgroundTimer');
    platform.current = 'web';
    await m.startBackgroundTimer(opts);
    m.stopBackgroundTimer();
    expect(plugin.start).not.toHaveBeenCalled();
    expect(plugin.stop).not.toHaveBeenCalled();
  });

  it('runs on iOS too, passing the iOS-specific fields through', async () => {
    platform.current = 'ios';
    const m = await import('./backgroundTimer');
    const ios = { ...opts, keepAlive: true, endTitle: 'Done', endText: 'Take a break' };
    await m.startBackgroundTimer(ios);
    expect(plugin.start).toHaveBeenCalledWith(ios);
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

  describe('iOS Live Activity', () => {
    it('tracks a started activity once, with the mode', async () => {
      platform.current = 'ios';
      plugin.start.mockResolvedValueOnce({ liveActivity: 'started' });
      const m = await import('./backgroundTimer');
      await m.startBackgroundTimer({ ...opts, liveMode: 'break' });
      expect(analytics.trackFocusLiveActivityStart).toHaveBeenCalledWith({ mode: 'break', enabled: true });
    });

    it('does not track a resume after pause', async () => {
      platform.current = 'ios';
      plugin.start.mockResolvedValueOnce({ liveActivity: 'resumed' });
      const m = await import('./backgroundTimer');
      await m.startBackgroundTimer(opts);
      expect(analytics.trackFocusLiveActivityStart).not.toHaveBeenCalled();
    });

    it('tracks "disabled" only once per session', async () => {
      platform.current = 'ios';
      plugin.start.mockResolvedValue({ liveActivity: 'disabled' });
      const m = await import('./backgroundTimer');
      await m.startBackgroundTimer(opts);
      await m.startBackgroundTimer(opts);
      expect(analytics.trackFocusLiveActivityStart).toHaveBeenCalledTimes(1);
      expect(analytics.trackFocusLiveActivityStart).toHaveBeenCalledWith({ mode: 'focus', enabled: false });
      plugin.start.mockResolvedValue(undefined);
    });

    it('pause keeps the activity by passing the remaining seconds to stop', async () => {
      platform.current = 'ios';
      const m = await import('./backgroundTimer');
      m.pauseBackgroundTimer(754.6);
      expect(plugin.stop).toHaveBeenCalledWith({ pausedRemaining: 755 });
    });

    it('does nothing on the web', async () => {
      platform.current = 'web';
      const m = await import('./backgroundTimer');
      m.pauseBackgroundTimer(10);
      expect(plugin.stop).not.toHaveBeenCalled();
    });
  });
});
