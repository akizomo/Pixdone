import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const logEvent = vi.fn();
const getPlatform = vi.fn(() => 'web');

vi.mock('firebase/analytics', () => ({
  logEvent: (...args: unknown[]) => logEvent(...args),
  setUserId: vi.fn(),
}));
vi.mock('../lib/firebase', () => ({ analytics: {} }));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => getPlatform() } }));

async function load() {
  vi.resetModules();
  return import('./analytics');
}

describe('analytics', () => {
  beforeEach(() => {
    logEvent.mockClear();
    getPlatform.mockReturnValue('web');
    window.localStorage.clear();
    vi.stubEnv('VITE_INTERNAL_UIDS', 'dev-uid-1, dev-uid-2');
    vi.stubEnv('VITE_GA_DEBUG', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('adds traffic_type=internal for internal uids', async () => {
    const a = await load();
    a.setAnalyticsUserId('dev-uid-2');
    a.trackTaskAdd({ list_type: 'custom', is_repeat: false });
    expect(logEvent).toHaveBeenCalledWith({}, 'task_add', { list_type: 'custom', is_repeat: false, traffic_type: 'internal' });
  });

  it('does not tag other users or logged-out sessions', async () => {
    const a = await load();
    a.trackTaskAdd({ list_type: 'custom', is_repeat: false });
    a.setAnalyticsUserId('someone-else');
    a.trackTaskAdd({ list_type: 'smash', is_repeat: false });
    expect(logEvent.mock.calls[0][2]).not.toHaveProperty('traffic_type');
    expect(logEvent.mock.calls[1][2]).not.toHaveProperty('traffic_type');
  });

  it('stops tagging after logout', async () => {
    const a = await load();
    a.setAnalyticsUserId('dev-uid-1');
    a.setAnalyticsUserId(null);
    a.trackTaskAdd({ list_type: 'custom', is_repeat: false });
    expect(logEvent.mock.calls[0][2]).not.toHaveProperty('traffic_type');
  });

  it('respects pd_no_track', async () => {
    const a = await load();
    window.localStorage.setItem('pd_no_track', '1');
    a.trackPricingView({ source: 'account' });
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('adds debug_mode when pd_ga_debug is set', async () => {
    const a = await load();
    window.localStorage.setItem('pd_ga_debug', '1');
    a.trackPurchaseCancel();
    expect(logEvent).toHaveBeenCalledWith({}, 'purchase_cancel', { platform: 'web', debug_mode: true });
  });

  it('sends funnel events with platform', async () => {
    getPlatform.mockReturnValue('ios');
    const a = await load();
    a.trackUpsellView({ source: 'list_limit' });
    a.trackPricingView({ source: 'evolution' });
    a.trackPurchaseStart({ plan: 'yearly' });
    a.trackPurchaseSuccess({ plan: 'yearly', is_trial: true });
    a.trackPurchaseCancel();
    expect(logEvent.mock.calls.map((c) => [c[1], c[2]])).toEqual([
      ['upsell_view', { source: 'list_limit' }],
      ['pricing_view', { source: 'evolution', platform: 'ios' }],
      ['purchase_start', { plan: 'yearly', platform: 'ios' }],
      ['purchase_success', { plan: 'yearly', is_trial: true, platform: 'ios' }],
      ['purchase_cancel', { platform: 'ios' }],
    ]);
  });

  it('never throws when logging fails', async () => {
    logEvent.mockImplementationOnce(() => { throw new Error('boom'); });
    const a = await load();
    expect(() => a.trackPurchaseCancel()).not.toThrow();
  });

  it('parses pricing source and builds paths', async () => {
    const a = await load();
    expect(a.parsePricingSource('collection_theme')).toBe('collection_theme');
    expect(a.parsePricingSource('bogus')).toBe('other');
    expect(a.parsePricingSource(null)).toBe('other');
    expect(a.pricingPath('onboarding')).toBe('/pricing?source=onboarding');
  });
});
