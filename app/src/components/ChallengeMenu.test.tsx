import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';

afterEach(cleanup);

// ── matchMedia mock (jsdom doesn't have it) ─────────────────────────────────

let mqMatches = true; // default: desktop
const mqListeners: Array<(e: { matches: boolean }) => void> = [];

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: mqMatches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => mqListeners.push(cb),
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      const idx = mqListeners.indexOf(cb);
      if (idx >= 0) mqListeners.splice(idx, 1);
    },
    dispatchEvent: vi.fn(),
  })),
});

// ── Mock dependencies ───────────────────────────────────────────────────────

vi.mock('../design-system/foundations/sound.tokens', () => ({
  playSound: vi.fn(),
}));

import type { ActiveChallenge } from '../hooks/useActiveChallenge';
const mockOnPreviewEffect = vi.fn();

const makeChallenge = (overrides: Partial<ActiveChallenge> = {}): ActiveChallenge => ({
  effect: {
    key: 'fighter',
    name: 'Fighter',
    rarity: 'RARE',
    themes: ['arcade'],
    access: 'challenge',
    description: { en: "A fighter's punch sends it flying.", ja: 'ファイターのパンチで吹き飛ぶ。' },
    evolutionStages: 1,
    evolutionCondition: null,
    evolutionThreshold: null,
    challengeDeadline: new Date('2026-05-31T23:59:59+09:00'),
    challengeUnlockThreshold: 50,
  },
  progress: 32,
  threshold: 50,
  deadline: new Date('2026-05-31T23:59:59+09:00'),
  daysLeft: 53,
  isUrgent: false,
  isCompleted: false,
  ...overrides,
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ChallengeMenu', () => {
  let ChallengeMenu: React.ComponentType<{
    challenge: ActiveChallenge | null;
    lang: 'en' | 'ja';
    onPreviewEffect?: (effectKey: string) => void;
  }>;

  beforeAll(async () => {
    const mod = await import('./ChallengeMenu');
    ChallengeMenu = mod.ChallengeMenu;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Icon visibility ─────────────────────────────────────────────────────

  describe('header icon', () => {
    it('renders the challenge icon when an active challenge exists', () => {
      render(<ChallengeMenu challenge={makeChallenge()} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      expect(screen.getByLabelText('Challenge')).toBeInTheDocument();
    });

    it('does not render the icon when no challenge exists', () => {
      render(<ChallengeMenu challenge={null} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      expect(screen.queryByLabelText('Challenge')).not.toBeInTheDocument();
    });

    it('applies urgency animation when isUrgent is true', () => {
      render(<ChallengeMenu challenge={makeChallenge({ isUrgent: true })} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      const icon = screen.getByLabelText('Challenge');
      expect(icon.closest('[data-urgent]')).toHaveAttribute('data-urgent', 'true');
    });

    it('shows badge when challenge is completed', () => {
      render(<ChallengeMenu challenge={makeChallenge({ isCompleted: true })} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      expect(screen.getByTestId('challenge-badge')).toBeInTheDocument();
    });

    it('does not show badge when challenge is not completed', () => {
      render(<ChallengeMenu challenge={makeChallenge({ isCompleted: false })} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      expect(screen.queryByTestId('challenge-badge')).not.toBeInTheDocument();
    });
  });

  // ── Sheet / dialog content ──────────────────────────────────────────────

  describe('challenge content', () => {
    it('opens when icon is tapped', () => {
      render(<ChallengeMenu challenge={makeChallenge()} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));
      expect(screen.getByText('Fighter')).toBeInTheDocument();
      expect(screen.getByText('RARE')).toBeInTheDocument();
    });

    it('displays progress bar with correct values', () => {
      render(<ChallengeMenu challenge={makeChallenge({ progress: 32, threshold: 50 })} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));
      expect(screen.getByText('32 / 50')).toBeInTheDocument();
    });

    it('displays mission text with threshold in English', () => {
      render(<ChallengeMenu challenge={makeChallenge({ threshold: 50 })} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));
      expect(screen.getByText(/Complete 50 tasks/)).toBeInTheDocument();
    });

    it('displays mission text with threshold in Japanese', () => {
      render(<ChallengeMenu challenge={makeChallenge({ threshold: 50 })} lang="ja" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('チャレンジ'));
      expect(screen.getByText(/タスクを 50 個完了/)).toBeInTheDocument();
    });

    it('displays effect description', () => {
      render(<ChallengeMenu challenge={makeChallenge()} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));
      expect(screen.getByText("A fighter's punch sends it flying.")).toBeInTheDocument();
    });

    it('shows completion state when challenge is earned', () => {
      render(
        <ChallengeMenu
          challenge={makeChallenge({ isCompleted: true, progress: 50, threshold: 50 })}
          lang="en"
          onPreviewEffect={mockOnPreviewEffect}
        />,
      );
      fireEvent.click(screen.getByLabelText('Challenge'));
      expect(screen.getByText(/Earned/i)).toBeInTheDocument();
    });

    it('navigates to collection with effect key when "Preview effect" is tapped', () => {
      render(<ChallengeMenu challenge={makeChallenge()} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));

      const previewBtn = screen.getByText(/Preview effect/);
      fireEvent.click(previewBtn);

      expect(mockOnPreviewEffect).toHaveBeenCalledWith('fighter');
    });

    // ── New: motivational message + GIF ─────────────────────────────────

    it('shows motivational message in English', () => {
      render(<ChallengeMenu challenge={makeChallenge()} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));
      expect(screen.getByText(/Complete the challenge.*rare effect/i)).toBeInTheDocument();
    });

    it('shows motivational message in Japanese with both lines', () => {
      render(<ChallengeMenu challenge={makeChallenge()} lang="ja" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('チャレンジ'));
      // Both lines rendered inside the same <p>, separated by <br>
      const p = screen.getByText(/チャレンジをクリアして、/);
      expect(p).toBeInTheDocument();
      expect(p.textContent).toContain('レアエフェクトを手に入れよう！');
      // Verify line break exists
      expect(p.querySelector('br')).not.toBeNull();
    });

    it('displays the effect preview GIF', () => {
      render(<ChallengeMenu challenge={makeChallenge()} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));
      const gif = screen.getByAltText('Fighter') as HTMLImageElement;
      expect(gif).toBeInTheDocument();
      expect(gif.src).toContain('fighter-punch.gif');
    });

    it('does not show motivational message when challenge is completed', () => {
      render(
        <ChallengeMenu
          challenge={makeChallenge({ isCompleted: true, progress: 50, threshold: 50 })}
          lang="en"
          onPreviewEffect={mockOnPreviewEffect}
        />,
      );
      fireEvent.click(screen.getByLabelText('Challenge'));
      expect(screen.queryByText(/Complete the challenge/i)).not.toBeInTheDocument();
    });
  });

  // ── Responsive: BottomSheet on mobile, ModalDialog on desktop ─────────

  describe('responsive container', () => {
    it('uses BottomSheet on mobile (narrow viewport)', () => {
      mqMatches = false; // mobile
      render(<ChallengeMenu challenge={makeChallenge()} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));

      expect(screen.getByTestId('challenge-sheet')).toBeInTheDocument();
      expect(screen.queryByTestId('challenge-dialog')).not.toBeInTheDocument();
      mqMatches = true; // restore
    });

    it('uses ModalDialog on desktop (wide viewport)', () => {
      mqMatches = true; // desktop
      render(<ChallengeMenu challenge={makeChallenge()} lang="en" onPreviewEffect={mockOnPreviewEffect} />);
      fireEvent.click(screen.getByLabelText('Challenge'));

      expect(screen.getByTestId('challenge-dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('challenge-sheet')).not.toBeInTheDocument();
    });
  });
});
