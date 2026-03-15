import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playTaskCompleteEffect } from './taskAnimations';

describe('playTaskCompleteEffect', () => {
  let taskEl: HTMLElement;

  beforeEach(() => {
    taskEl = document.createElement('div');
    taskEl.textContent = 'Test task';
    taskEl.style.width = '300px';
    taskEl.style.height = '60px';
    document.body.appendChild(taskEl);
    const mockRect = { top: 100, left: 50, width: 300, height: 60, right: 350, bottom: 160, x: 50, y: 100, toJSON: () => ({}) };
    vi.spyOn(taskEl, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('appends a clone and label to the body on call', () => {
    const onDone = vi.fn();
    playTaskCompleteEffect(taskEl, onDone);

    const clones = document.querySelectorAll('.pd-effect-clone');
    const labels = document.querySelectorAll('.pd-effect-label');
    expect(clones).toHaveLength(1);
    expect(labels).toHaveLength(1);
  });

  it('hides the original element immediately', () => {
    const onDone = vi.fn();
    playTaskCompleteEffect(taskEl, onDone);
    expect(taskEl.style.visibility).toBe('hidden');
  });

  it('calls onDone after the animation duration', () => {
    const onDone = vi.fn();
    playTaskCompleteEffect(taskEl, onDone);

    expect(onDone).not.toHaveBeenCalled();

    // Max effect duration is 1800ms + 50ms buffer
    vi.advanceTimersByTime(1900);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('removes the clone and label from the DOM after animation', () => {
    const onDone = vi.fn();
    playTaskCompleteEffect(taskEl, onDone);

    vi.advanceTimersByTime(1900);

    expect(document.querySelectorAll('.pd-effect-clone')).toHaveLength(0);
    expect(document.querySelectorAll('.pd-effect-label')).toHaveLength(0);
  });

  it('assigns one of the known effect classes to the clone', () => {
    const onDone = vi.fn();
    playTaskCompleteEffect(taskEl, onDone);

    const clone = document.querySelector('.pd-effect-clone') as HTMLElement;
    const knownClasses = [
      'pd-effect-flyaway',
      'pd-effect-bounce',
      'pd-effect-vanish',
      'pd-effect-explode',
      'pd-effect-slideleft',
    ];
    const hasEffect = knownClasses.some((c) => clone.classList.contains(c));
    expect(hasEffect).toBe(true);
  });

  it('label textContent is one of the known effect labels', () => {
    const onDone = vi.fn();
    playTaskCompleteEffect(taskEl, onDone);

    const label = document.querySelector('.pd-effect-label') as HTMLElement;
    const knownLabels = ['GONE!', 'DONE!', 'POOF!', 'BOOM!', 'CLEAR!'];
    expect(knownLabels).toContain(label.textContent);
  });

  it('uses correct position for the clone based on getBoundingClientRect', () => {
    // Mock getBoundingClientRect
    const mockRect = { top: 100, left: 50, width: 300, height: 60, right: 350, bottom: 160, x: 50, y: 100, toJSON: () => ({}) };
    vi.spyOn(taskEl, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);

    const onDone = vi.fn();
    playTaskCompleteEffect(taskEl, onDone);

    const clone = document.querySelector('.pd-effect-clone') as HTMLElement;
    expect(clone.style.top).toBe('100px');
    expect(clone.style.left).toBe('50px');
    expect(clone.style.width).toBe('300px');
    expect(clone.style.height).toBe('60px');
  });
});
