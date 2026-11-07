import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** Scope text lookups to the visible dialogue layer so the hidden reserve
 *  (which mirrors the same text for layout stability) doesn't create
 *  duplicate matches. */
function getDialogue(): HTMLElement {
  const el = document.querySelector('.pd-onboarding__dialog-visible');
  if (!el) throw new Error('dialog-visible not rendered');
  return el as HTMLElement;
}

vi.mock('../services/taskAnimations', () => ({
  runVanillaCompletionEffect: vi.fn((_el: HTMLElement, onDone: () => void) => {
    onDone();
  }),
}));

vi.mock('../services/sound', () => ({
  playSound: vi.fn(),
}));

import { OnboardingTutorial } from './OnboardingTutorial';
import { runVanillaCompletionEffect } from '../services/taskAnimations';
import { EFFECTS_REGISTRY } from '../data/effectsRegistry';

const mockedRunEffect = vi.mocked(runVanillaCompletionEffect);

const rarityByKey = new Map(EFFECTS_REGISTRY.map((ef) => [ef.key, ef.rarity]));

describe('OnboardingTutorial', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedRunEffect.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  function renderTutorial(overrides: Partial<React.ComponentProps<typeof OnboardingTutorial>> = {}) {
    return render(
      <OnboardingTutorial
        themeKey="arcade"
        onDone={vi.fn()}
        {...overrides}
      />,
    );
  }

  /** Advance past the typewriter's 32ms/char loop to let the full dialogue appear. */
  function flushTypewriter() {
    act(() => { vi.advanceTimersByTime(3000); });
  }

  /** Splash auto-advances to intro (panel 0); then flush its typewriter. */
  function advanceToIntro() {
    act(() => { vi.advanceTimersByTime(2000); });
    flushTypewriter();
  }

  function advanceToSmashStep() {
    advanceToIntro();
    // First tap: once typing is done, advances from panel 0 → panel 1
    const overlay = document.querySelector('.pd-onboarding')!;
    fireEvent.click(overlay);
    flushTypewriter();
    // Second tap: advances from panel 1 → smash
    fireEvent.click(overlay);
    flushTypewriter();
  }

  function smashAll() {
    ['Monday Meeting', 'Overdue Report', 'That Email'].forEach((title) => {
      const row = screen.getByText(title).closest('.task-item-row') as HTMLElement;
      const checkbox = row.querySelector('button[role="checkbox"]') as HTMLButtonElement;
      fireEvent.click(checkbox);
      flushTypewriter();
    });
    // After 3rd smash, user must tap to continue (no auto-advance)
    const overlay = document.querySelector('.pd-onboarding')!;
    fireEvent.click(overlay);
  }

  it('renders the splash screen with PixDone logo image', () => {
    renderTutorial();
    const img = screen.getByAltText('PixDone') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('pixdone-logo-white.svg');
    expect(screen.getByText(/Welcome to PixDone/i)).toBeInTheDocument();
  });

  it('auto-advances from splash to intro (panel 0)', () => {
    renderTutorial();
    expect(screen.queryByText(/Decades after the golden age/i)).toBeNull();
    advanceToIntro();
    expect(within(getDialogue()).getByText(/Decades after the golden age/i)).toBeInTheDocument();
    expect(screen.getByText(/TAP TO CONTINUE/i)).toBeInTheDocument();
  });

  it('tap on intro panel 0 advances to panel 1 (agent declaration)', () => {
    renderTutorial();
    advanceToIntro();
    const overlay = document.querySelector('.pd-onboarding')!;
    fireEvent.click(overlay);
    flushTypewriter();
    const dialogue = getDialogue();
    expect(within(dialogue).getByText(/built to destroy them/i)).toBeInTheDocument();
    expect(within(dialogue).getByText(/You're an Agent now/i)).toBeInTheDocument();
  });

  it('tap on intro panel 1 advances to the smash step', () => {
    renderTutorial();
    advanceToIntro();
    const overlay = document.querySelector('.pd-onboarding')!;
    fireEvent.click(overlay); // → panel 1
    flushTypewriter();
    fireEvent.click(overlay); // → smash
    flushTypewriter();
    expect(within(getDialogue()).getByText(/Warm-up first/i)).toBeInTheDocument();
    expect(screen.getByText('Monday Meeting')).toBeInTheDocument();
  });

  it('2nd smash triggers a guaranteed Rare effect', () => {
    renderTutorial();
    advanceToSmashStep();

    const firstRow = screen.getByText('Monday Meeting').closest('.task-item-row') as HTMLElement;
    fireEvent.click(firstRow.querySelector('button[role="checkbox"]')!);

    const secondRow = screen.getByText('Overdue Report').closest('.task-item-row') as HTMLElement;
    fireEvent.click(secondRow.querySelector('button[role="checkbox"]')!);

    expect(mockedRunEffect).toHaveBeenCalledTimes(2);
    const [, , secondKey] = mockedRunEffect.mock.calls[1]!;
    expect(rarityByKey.get(secondKey!)).toBe('RARE');
  });

  it('3rd smash triggers a guaranteed Epic effect', () => {
    renderTutorial();
    advanceToSmashStep();

    ['Monday Meeting', 'Overdue Report', 'That Email'].forEach((title) => {
      const row = screen.getByText(title).closest('.task-item-row') as HTMLElement;
      fireEvent.click(row.querySelector('button[role="checkbox"]')!);
    });

    expect(mockedRunEffect).toHaveBeenCalledTimes(3);
    const [, , thirdKey] = mockedRunEffect.mock.calls[2]!;
    expect(rarityByKey.get(thirdKey!)).toBe('EPIC');
  });

  it('advances to the first-mission step after 3 smashes and calls onReachMission', () => {
    const onReachMission = vi.fn();
    renderTutorial({ onReachMission });
    advanceToSmashStep();
    smashAll();
    flushTypewriter();

    expect(screen.getByTestId('onboarding-mission')).toBeInTheDocument();
    expect(within(getDialogue()).getByText(/your first mission/i)).toBeInTheDocument();
    expect(within(getDialogue()).getByText(/complete 10 of your/i)).toBeInTheDocument();
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
    expect(screen.getByAltText('Fighter / Punch')).toHaveAttribute('src', '/fighter-punch.gif');
    expect(onReachMission).toHaveBeenCalledTimes(1);
  });

  it('no longer pitches PixDone+ at the end of the tutorial', () => {
    renderTutorial();
    advanceToSmashStep();
    smashAll();
    flushTypewriter();
    expect(screen.queryByText(/free trial/i)).toBeNull();
    expect(screen.queryByText(/PixDone\+/)).toBeNull();
    expect(screen.getAllByRole('button', { name: /Accept mission/i })).toHaveLength(1);
  });

  it('shows the Japanese mission copy', () => {
    renderTutorial({ lang: 'ja' });
    advanceToSmashStep();
    smashAll();
    flushTypewriter();
    expect(within(getDialogue()).getByText(/10件、完了させよう。/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '任務を受ける' })).toBeInTheDocument();
  });

  it('Accept mission advances to the firstTask tour', () => {
    const onEnterFirstTask = vi.fn();
    renderTutorial({ onEnterFirstTask });
    advanceToSmashStep();
    smashAll();
    flushTypewriter();
    fireEvent.click(screen.getByRole('button', { name: /Accept mission/i }));
    flushTypewriter();
    expect(within(getDialogue()).getByText(/Add your first task/i)).toBeInTheDocument();
    // Tour mode: overlay carries data-tour="true" so CSS can make it
    // transparent and let the real Add button underneath receive clicks.
    const overlay = document.querySelector('.pd-onboarding');
    expect(overlay?.getAttribute('data-tour')).toBe('true');
    expect(onEnterFirstTask).toHaveBeenCalledTimes(1);
  });

  it('cycles through smash dialogues as each task is smashed', () => {
    renderTutorial();
    advanceToSmashStep();

    expect(within(getDialogue()).getByText(/Warm-up first/i)).toBeInTheDocument();

    const firstRow = screen.getByText('Monday Meeting').closest('.task-item-row') as HTMLElement;
    fireEvent.click(firstRow.querySelector('button[role="checkbox"]')!);
    flushTypewriter();
    expect(within(getDialogue()).getByText(/vanishes differently every time/i)).toBeInTheDocument();

    const secondRow = screen.getByText('Overdue Report').closest('.task-item-row') as HTMLElement;
    fireEvent.click(secondRow.querySelector('button[role="checkbox"]')!);
    flushTypewriter();
    expect(within(getDialogue()).getByText(/rarely seen/i)).toBeInTheDocument();

    const thirdRow = screen.getByText('That Email').closest('.task-item-row') as HTMLElement;
    fireEvent.click(thirdRow.querySelector('button[role="checkbox"]')!);
    flushTypewriter();
    // Last smash dialogue is shown; user must tap to advance (no auto-advance now).
    expect(within(getDialogue()).getByText(/your own tasks/i)).toBeInTheDocument();
  });

  it('hides smashed tasks from the list', () => {
    renderTutorial();
    advanceToSmashStep();

    const firstRow = screen.getByText('Monday Meeting').closest('.task-item-row') as HTMLElement;
    fireEvent.click(firstRow.querySelector('button[role="checkbox"]')!);

    expect(screen.queryByText('Monday Meeting')).toBeNull();
    expect(screen.getByText('Overdue Report')).toBeInTheDocument();
  });
});
