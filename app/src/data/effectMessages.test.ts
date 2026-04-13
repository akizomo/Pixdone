import { describe, it, expect } from 'vitest';
import { getCompletionToastMessage, getUndoLabel } from './effectMessages';
import { EFFECTS_REGISTRY } from './effectsRegistry';

describe('getCompletionToastMessage', () => {
  it('returns default JA message when effect key is undefined', () => {
    expect(getCompletionToastMessage(undefined, 'ja')).toBe('タスクを完了しました');
  });

  it('returns default EN message when effect key is undefined', () => {
    expect(getCompletionToastMessage(undefined, 'en')).toBe('Task completed');
  });

  it('returns default message for unmapped (common) effect', () => {
    expect(getCompletionToastMessage('explode', 'ja')).toBe('タスクを完了しました');
    expect(getCompletionToastMessage('explode', 'en')).toBe('Task completed');
  });

  it('returns default message for unknown key', () => {
    expect(getCompletionToastMessage('nonexistent-key', 'en')).toBe('Task completed');
  });

  it('returns effect-specific message for bomb (epic)', () => {
    expect(getCompletionToastMessage('bomb', 'en')).toBe('Bombed the task.');
    expect(getCompletionToastMessage('bomb', 'ja')).toBe('タスクを爆破した。');
  });

  it('returns effect-specific message for shatter (rare)', () => {
    expect(getCompletionToastMessage('shatter', 'en')).toBe('Shattered the task.');
  });

  it('has a mapped message for every RARE and EPIC effect in the registry', () => {
    const rareOrEpic = EFFECTS_REGISTRY.filter(e => e.rarity === 'RARE' || e.rarity === 'EPIC');
    for (const ef of rareOrEpic) {
      const en = getCompletionToastMessage(ef.key, 'en');
      const ja = getCompletionToastMessage(ef.key, 'ja');
      expect(en).not.toBe('Task completed');
      expect(ja).not.toBe('タスクを完了しました');
    }
  });
});

describe('getUndoLabel', () => {
  it('returns 元に戻す for ja', () => {
    expect(getUndoLabel('ja')).toBe('元に戻す');
  });
  it('returns Undo for en', () => {
    expect(getUndoLabel('en')).toBe('Undo');
  });
});
