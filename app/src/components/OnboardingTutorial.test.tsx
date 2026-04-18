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
        isPremium={false}
        onDone={vi.fn()}
        onUpgrade={vi.fn()}
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
    expect(within(getDialogue()).getByText(/Smash this task/i)).toBeInTheDocument();
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

  it('advances to the upgrade step after 3 smashes and calls onReachCta', () => {
    const onReachCta = vi.fn();
    renderTutorial({ onReachCta });
    advanceToSmashStep();
    smashAll();

    expect(screen.getByText(/Ready to go further/i)).toBeInTheDocument();
    expect(screen.getByText(/Try PixDone\+/i)).toBeInTheDocument();
    expect(screen.getByText(/^Later$/i)).toBeInTheDocument();
    expect(onReachCta).toHaveBeenCalledTimes(1);
  });

  it('lists the five PixDone+ benefits on the upgrade step', () => {
    renderTutorial();
    advanceToSmashStep();
    smashAll();
    expect(screen.getByText(/Unlock all themes/i)).toBeInTheDocument();
    expect(screen.getByText(/Grow your theme/i)).toBeInTheDocument();
    expect(screen.getByText(/Rare & Epic effects/i)).toBeInTheDocument();
    expect(screen.getByText(/Request your own effect/i)).toBeInTheDocument();
    expect(screen.getByText(/Unlimited task lists/i)).toBeInTheDocument();
  });

  it('Try PixDone+ calls onUpgrade with the default (yearly) billing cycle', () => {
    const onUpgrade = vi.fn().mockResolvedValue(undefined);
    renderTutorial({ onUpgrade });
    advanceToSmashStep();
    smashAll();
    fireEvent.click(screen.getByText(/Try PixDone\+/i));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onUpgrade).toHaveBeenCalledWith('yearly');
  });

  it('Monthly toggle switches the billing cycle passed to onUpgrade', () => {
    const onUpgrade = vi.fn().mockResolvedValue(undefined);
    renderTutorial({ onUpgrade });
    advanceToSmashStep();
    smashAll();

    const monthly = screen.getByRole('radio', { name: /monthly/i });
    fireEvent.click(monthly);
    fireEvent.click(screen.getByText(/Try PixDone\+/i));
    expect(onUpgrade).toHaveBeenCalledWith('monthly');
  });

  it('Later button advances upgrade step → firstTask tour', () => {
    renderTutorial();
    advanceToSmashStep();
    smashAll();
    fireEvent.click(screen.getByText(/^Later$/i));
    flushTypewriter();
    expect(within(getDialogue()).getByText(/Now add your first task/i)).toBeInTheDocument();
    // Tour mode: overlay carries data-tour="true" so CSS can make it
    // transparent and let the real Add button underneath receive clicks.
    const overlay = document.querySelector('.pd-onboarding');
    expect(overlay?.getAttribute('data-tour')).toBe('true');
  });

  it('premium users skip the upgrade CTA and see a single Next button', () => {
    renderTutorial({ isPremium: true });
    advanceToSmashStep();
    smashAll();
    expect(screen.queryByText(/Try PixDone\+/i)).toBeNull();
    expect(screen.queryByText(/^Later$/i)).toBeNull();
    expect(screen.getByText(/^Next$/i)).toBeInTheDocument();
  });

  it('fires onEnterFirstTask when Step 5 starts (tour mode)', () => {
    const onEnterFirstTask = vi.fn();
    renderTutorial({ onEnterFirstTask });
    advanceToSmashStep();
    smashAll();
    // Upgrade step is showing; Later → firstTask starts the tour.
    fireEvent.click(screen.getByText(/^Later$/i));
    flushTypewriter();
    expect(onEnterFirstTask).toHaveBeenCalledTimes(1);
  });

  it('cycles through smash dialogues as each task is smashed', () => {
    renderTutorial();
    advanceToSmashStep();

    expect(within(getDialogue()).getByText(/Smash this task/i)).toBeInTheDocument();

    const firstRow = screen.getByText('Monday Meeting').closest('.task-item-row') as HTMLElement;
    fireEvent.click(firstRow.querySelector('button[role="checkbox"]')!);
    flushTypewriter();
    expect(within(getDialogue()).getByText(/Something happens/i)).toBeInTheDocument();

    const secondRow = screen.getByText('Overdue Report').closest('.task-item-row') as HTMLElement;
    fireEvent.click(secondRow.querySelector('button[role="checkbox"]')!);
    flushTypewriter();
    expect(within(getDialogue()).getByText(/Some are rarer than others/i)).toBeInTheDocument();

    const thirdRow = screen.getByText('That Email').closest('.task-item-row') as HTMLElement;
    fireEvent.click(thirdRow.querySelector('button[role="checkbox"]')!);
    flushTypewriter();
    // 3rd smash dialogue is shown; user must tap to advance (no auto-advance now).
    expect(within(getDialogue()).getByText(/Complete monthly challenges/i)).toBeInTheDocument();
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
