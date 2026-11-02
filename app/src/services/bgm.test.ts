import { describe, it, expect, beforeEach, vi } from 'vitest';

const plugin = vi.hoisted(() => ({
  playBgm: vi.fn().mockResolvedValue(undefined),
  stopBgm: vi.fn().mockResolvedValue(undefined),
}));
const platform = vi.hoisted(() => ({ current: 'ios' }));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => platform.current,
    isNativePlatform: () => platform.current !== 'web',
  },
  registerPlugin: () => plugin,
}));

describe('bgm on iOS (native playback)', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(plugin).forEach((f) => f.mockClear());
    platform.current = 'ios';
    localStorage.clear();
  });

  it('plays the pre-rendered loop natively at the default level, ignoring a saved web volume', async () => {
    localStorage.setItem('pixdone-bgm-volume', '0.9');
    const { startBgm, getBgmVolume } = await import('./bgm');
    const { NATIVE_BGM_GAIN } = await import('./bgmNativeTracks');
    startBgm('chill');
    expect(plugin.playBgm).toHaveBeenCalledWith({ track: 'chill', volume: 0.06 * NATIVE_BGM_GAIN.chill! });
    expect(getBgmVolume()).toBe(0.06);
  });

  it('does not restart the same track, and stops natively only while playing', async () => {
    const { startBgm, stopBgm } = await import('./bgm');
    stopBgm();
    expect(plugin.stopBgm).not.toHaveBeenCalled();
    startBgm('retro');
    startBgm('retro');
    expect(plugin.playBgm).toHaveBeenCalledTimes(1);
    stopBgm();
    stopBgm();
    expect(plugin.stopBgm).toHaveBeenCalledTimes(1);
  });

  it('switches tracks', async () => {
    const { startBgm } = await import('./bgm');
    startBgm('retro');
    startBgm('rain');
    expect(plugin.playBgm).toHaveBeenLastCalledWith(expect.objectContaining({ track: 'rain' }));
  });

  it('uses the saved volume on the web', async () => {
    platform.current = 'web';
    localStorage.setItem('pixdone-bgm-volume', '0.3');
    const { getBgmVolume } = await import('./bgm');
    expect(getBgmVolume()).toBe(0.3);
  });
});
