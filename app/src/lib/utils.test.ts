import { describe, it, expect, afterEach } from 'vitest';
import { isEditingText } from './utils';

describe('isEditingText', () => {
  afterEach(() => {
    // Reset focus
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
  });

  it('returns false when no element is focused', () => {
    // jsdom: activeElement is body by default
    expect(isEditingText()).toBe(false);
  });

  it('returns true when an input is focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(isEditingText()).toBe(true);
    document.body.removeChild(input);
  });

  it('returns true when a textarea is focused', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();
    expect(isEditingText()).toBe(true);
    document.body.removeChild(textarea);
  });

  it('returns true when a select is focused', () => {
    const select = document.createElement('select');
    document.body.appendChild(select);
    select.focus();
    expect(isEditingText()).toBe(true);
    document.body.removeChild(select);
  });

  it('does not return true for plain div even with contenteditable (jsdom limitation)', () => {
    // jsdom does not implement isContentEditable, so this branch can only be tested
    // in a real browser. We document the limitation and ensure no crash occurs.
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    div.focus();
    // In jsdom isContentEditable is not implemented; the function should not throw
    expect(() => isEditingText()).not.toThrow();
    document.body.removeChild(div);
  });

  it('returns true when an element with role=textbox is focused', () => {
    const div = document.createElement('div');
    div.setAttribute('role', 'textbox');
    div.setAttribute('tabindex', '0');
    document.body.appendChild(div);
    div.focus();
    expect(isEditingText()).toBe(true);
    document.body.removeChild(div);
  });

  it('returns false when a regular button is focused', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();
    expect(isEditingText()).toBe(false);
    document.body.removeChild(btn);
  });

  it('returns false when a div without special attributes is focused', () => {
    const div = document.createElement('div');
    div.setAttribute('tabindex', '0');
    document.body.appendChild(div);
    div.focus();
    expect(isEditingText()).toBe(false);
    document.body.removeChild(div);
  });
});
