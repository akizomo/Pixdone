import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ThemeKey } from '../design-system/themes/themeRegistry';
import { Badge, Button, PixelIcon } from '../design-system';
import { ThemeContext } from '../design-system/theme/ThemeProvider';
import { AgentIcon } from './AgentIcon';
import { TaskItem } from './TaskItem';
import type { Task } from '../types/task';
import { runVanillaCompletionEffect } from '../services/taskAnimations';
import {
  buildTutorialDrawPool,
  weightedRandomEffect,
  EFFECTS_REGISTRY,
  type EffectDef,
} from '../data/effectsRegistry';
import { playSound } from '../services/sound';
import { FIRST_CHALLENGE_EFFECT_KEY } from '../services/firstChallenge';
import './OnboardingTutorial.css';

export type OnboardingStep = 'splash' | 'intro' | 'smash' | 'mission' | 'firstTask';
type Step = OnboardingStep;

/** 最初の任務（最初のチャレンジ）の対象。条件の件数は registry から引く */
const FIRST_CHALLENGE = EFFECTS_REGISTRY.find((e) => e.key === FIRST_CHALLENGE_EFFECT_KEY);
const FIRST_CHALLENGE_THRESHOLD =
  (FIRST_CHALLENGE?.unlockCondition?.kind === 'challenge'
    ? FIRST_CHALLENGE.unlockCondition.threshold
    : FIRST_CHALLENGE?.challengeUnlockThreshold) ?? 10;

const DUMMY_TASKS: Task[] = [
  { id: 'ob-task-1', title: 'Monday Meeting', completed: false, dueDate: null, listId: 'onboarding' },
  { id: 'ob-task-2', title: 'Overdue Report', completed: false, dueDate: null, listId: 'onboarding' },
  { id: 'ob-task-3', title: 'That Email',    completed: false, dueDate: null, listId: 'onboarding' },
];

/** All copy is i18n'd via {en, ja} maps. Picked at render time by `lang` prop. */
type Lang = 'en' | 'ja';

const INTRO_PANELS: Record<Lang, { dialogue: string }[]> = {
  en: [
    { dialogue: 'Decades after the golden age of pixels,\ntasks still rule the world.' },
    { dialogue: "We are T.A.S.K. — built to destroy them.\nYou're an Agent now." },
  ],
  ja: [
    { dialogue: 'ピクセルの時代から数十年経った今も、\n人類はタスクに追われ続けている。' },
    { dialogue: 'T.A.S.K.はそのために存在する。\n（Task Annihilation Strike Kommand）\n\nあなたもその一員。' },
  ],
};

const SPLASH_DURATION_MS = 1800;

const SMASH_DIALOGUES: Record<Lang, string[]> = {
  en: [
    'Warm-up first.\nSmash this task.',
    'It vanishes differently every time.\nYou never know until you smash it.',
    'Some vanishings are rarely seen.',
    'Now make your own tasks\nvanish just as satisfyingly.',
  ],
  ja: [
    'まずは練習だ。\nこのタスクを消してみよう。',
    '消え方は毎回ちがう。\n何が起きるかは、消すまでわからない。',
    '中には、めったに見られない消え方もある。',
    'さあ、あなたの\nタスクも気持ちよく\n片付けよう。',
  ],
};

const COPY: Record<Lang, {
  splashSub: string;
  firstTaskDialogue: string;
  missionDialogue: (threshold: number) => string;
  missionAccept: string;
  missionProgressLabel: string;
  tapToContinue: string;
}> = {
  en: {
    splashSub: 'Welcome to PixDone.',
    firstTaskDialogue: 'Now add your first task.',
    missionDialogue: (n) => `Your first mission:\ncomplete ${n} of your\nown tasks.\nThe reward: this punch.`,
    missionAccept: 'Accept mission',
    missionProgressLabel: 'Mission progress',
    tapToContinue: 'TAP TO CONTINUE',
  },
  ja: {
    splashSub: 'PixDoneへようこそ。',
    firstTaskDialogue: '最初のタスクを\n追加しよう。',
    missionDialogue: (n) => `これが最初の任務。\nあなたのタスクを\n${n}件、完了させよう。\n報酬はこのパンチだ。`,
    missionAccept: '任務を受ける',
    missionProgressLabel: '任務の進み具合',
    tapToContinue: 'タップで続ける',
  },
};

export interface OnboardingTutorialProps {
  themeKey: ThemeKey;
  /** UI language for dialogue + button copy. @default 'en' */
  lang?: Lang;
  /** Called when the tutorial finishes — parent closes overlay. */
  onDone: () => void;
  /** Fires once when the user reaches the "first mission" step — parent marks hasSeenTutorial. */
  onReachMission?: () => void;
  /** Fires once when the user reaches the first-task tour step — parent navigates to the Today view. */
  onEnterFirstTask?: () => void;
  /** Storybook / tests only: start at a given step. @default 'splash' */
  initialStep?: Step;
}

export function OnboardingTutorial({
  themeKey,
  lang = 'en',
  onDone: _onDone,
  onReachMission,
  onEnterFirstTask,
  initialStep = 'splash',
}: OnboardingTutorialProps) {
  // Follow the resolved app theme mode so the logo variant + hero-bg palette
  // swap automatically when the user (or OS) flips light/dark.
  const { theme: themeMode } = useContext(ThemeContext);
  const isLight = themeMode === 'light';
  const logoSrc = isLight ? '/pixdone-logo-bland.svg' : '/pixdone-logo-white.svg';
  const copy = COPY[lang];
  const introPanels = INTRO_PANELS[lang];
  const smashDialogues = SMASH_DIALOGUES[lang];
  const [step, setStep] = useState<Step>(initialStep);
  const [introPanel, setIntroPanel] = useState(0);
  const [smashCount, setSmashCount] = useState(0);
  const [smashedIds, setSmashedIds] = useState<Set<string>>(new Set());
  const [smashLocked, setSmashLocked] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const missionReachedRef = useRef(false);

  useEffect(() => {
    if (step !== 'splash') return;
    const id = window.setTimeout(() => setStep('intro'), SPLASH_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [step]);

  // Mark the tutorial as seen once the mission is shown, so users who close
  // the app mid-way don't replay the whole story next time.
  useEffect(() => {
    if (step !== 'mission' || missionReachedRef.current) return;
    missionReachedRef.current = true;
    onReachMission?.();
  }, [step, onReachMission]);

  // When the tour reaches the first-task step, ask the shell to navigate to
  // the Today view so the real Add button sits underneath the agent/bubble.
  const firstTaskEnteredRef = useRef(false);
  useEffect(() => {
    if (step !== 'firstTask' || firstTaskEnteredRef.current) return;
    firstTaskEnteredRef.current = true;
    onEnterFirstTask?.();
  }, [step, onEnterFirstTask]);

  const pickEffectForSmash = useCallback((count: number): EffectDef | null => {
    const pool = buildTutorialDrawPool(themeKey);
    if (pool.length === 0) return null;
    // Guaranteed rarity progression across the 3 tutorial smashes.
    if (count === 0) {
      const commons = pool.filter((ef) => ef.rarity === 'COMMON');
      if (commons.length > 0) return commons[Math.floor(Math.random() * commons.length)]!;
    }
    if (count === 1) {
      const rares = pool.filter((ef) => ef.rarity === 'RARE');
      if (rares.length > 0) return rares[Math.floor(Math.random() * rares.length)]!;
    }
    if (count === 2) {
      const epics = pool.filter((ef) => ef.rarity === 'EPIC');
      if (epics.length > 0) return epics[Math.floor(Math.random() * epics.length)]!;
    }
    return weightedRandomEffect(pool);
  }, [themeKey]);

  const handleSmash = useCallback((taskId: string) => {
    if (smashLocked) return;
    const idx = DUMMY_TASKS.findIndex((t) => t.id === taskId);
    if (idx !== smashCount) return;

    const taskEl = document.querySelector(
      `.pd-onboarding [data-task-id="${taskId}"]`,
    ) as HTMLElement | null;
    if (!taskEl) return;

    setSmashLocked(true);
    playSound('taskComplete');

    const selected = pickEffectForSmash(smashCount);

    runVanillaCompletionEffect(
      taskEl,
      () => {
        setSmashedIds((prev) => new Set(prev).add(taskId));
        setSmashCount((prev) => prev + 1);
        setSmashLocked(false);
      },
      selected?.key,
    );
  }, [smashCount, smashLocked, pickEffectForSmash]);

  // --- RPG-style typewriter for the instructor's dialogue -----------------
  const dialogueText =
    step === 'intro'
      ? introPanels[introPanel]!.dialogue
      : step === 'smash'
        ? smashDialogues[Math.min(smashCount, smashDialogues.length - 1)]!
        : step === 'mission'
          ? copy.missionDialogue(FIRST_CHALLENGE_THRESHOLD)
          : step === 'firstTask'
            ? copy.firstTaskDialogue
            : '';

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!dialogueText) return;
    if (prefersReducedMotion) {
      setTypedChars(dialogueText.length);
      return;
    }
    setTypedChars(0);
    const id = window.setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= dialogueText.length) {
          window.clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, 32);
    return () => window.clearInterval(id);
  }, [dialogueText, prefersReducedMotion]);

  const isTyping = typedChars < dialogueText.length;
  const visibleText = dialogueText.slice(0, typedChars);

  const smashComplete = step === 'smash' && smashCount >= DUMMY_TASKS.length;

  const handleTap = useCallback(() => {
    // First tap while typing → complete the text instead of advancing
    if (typedChars < dialogueText.length) {
      setTypedChars(dialogueText.length);
      return;
    }
    playSound('buttonClick');
    if (step === 'intro') {
      setIntroPanel((prev) => {
        if (prev === 0) return 1;
        setStep('smash');
        return prev;
      });
    } else if (smashComplete) {
      setStep('mission');
    }
  }, [typedChars, dialogueText.length, step, smashComplete]);

  const handleAcceptMission = useCallback(() => {
    setStep('firstTask');
  }, []);

  if (step === 'splash') {
    return (
      <div className="pd-onboarding pd-onboarding--splash" role="dialog" aria-modal="true" aria-label="PixDone onboarding">
        <div className="pd-onboarding__splash">
          <img
            src={logoSrc}
            alt="PixDone"
            className="pd-onboarding__splash-logo"
          />
          <div className="pd-onboarding__splash-sub">{copy.splashSub}</div>
        </div>
      </div>
    );
  }

  // Steps intro (2 panels) / smash / mission / firstTask share the header+stage layout

  return (
    <div
      className={`pd-onboarding pd-onboarding--${step}`}
      data-tour={step === 'firstTask' ? 'true' : 'false'}
      role="dialog"
      aria-modal="true"
      aria-label="PixDone onboarding tutorial"
      onClick={(step === 'intro' || smashComplete) ? handleTap : undefined}
    >
      <div className="pd-onboarding__stage">
        <div className="pd-onboarding__header">
          <div className="pd-onboarding__instructor">
            <AgentIcon themeKey={themeKey} size={96} />
          </div>

          <div className="pd-onboarding__dialog" aria-label={dialogueText}>
            {/* Invisible full text reserves the bubble's final height so the
                box doesn't grow as the typewriter fills in. */}
            <div className="pd-onboarding__dialog-reserve" aria-hidden="true">
              {dialogueText.split('\n').map((line, i) => (
                <p key={i} className="pd-onboarding__dialog-line">
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
            {/* Visible typewriter layer, absolutely positioned over the reserve. */}
            <div className="pd-onboarding__dialog-visible" aria-live="polite">
              {visibleText.split('\n').map((line, i, arr) => {
                const isLastLine = i === arr.length - 1;
                return (
                  <p key={i} className="pd-onboarding__dialog-line">
                    {line || '\u00A0'}
                    {isLastLine && !isTyping && (step === 'intro' || smashComplete) && (
                      <span className="pd-onboarding__dialog-cursor" aria-hidden="true">
                        <PixelIcon name="arrow_drop_down" size="16px" />
                      </span>
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pd-onboarding__main">
          {step === 'intro' && (
            <div
              className="pd-onboarding__intro-scene"
              data-panel={introPanel}
              aria-hidden="true"
            >
              {/* Left column: agents run in on panel 1 (introPanel === 1) */}
              <div className="pd-onboarding__agents-cluster">
                {introPanel === 1 && (
                  <>
                    <div
                      className="pd-onboarding__agent-runner onboarding-tutorial__box-1"
                      data-color="arcade"
                    >
                      <div className="pd-onboarding__agent-body">
                        <AgentIcon themeKey="arcade" size={64} />
                        <img
                          className="pd-onboarding__weapon"
                          data-weapon="bomb"
                          src="/sprites/weapons/bomb.png"
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div
                      className="pd-onboarding__agent-runner onboarding-tutorial__box-2"
                      data-color="synthwave"
                    >
                      <div className="pd-onboarding__agent-body">
                        <AgentIcon themeKey="arcade" size={72} />
                        <img
                          className="pd-onboarding__weapon"
                          data-weapon="sword"
                          src="/sprites/weapons/sword.png"
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div
                      className="pd-onboarding__agent-runner onboarding-tutorial__box-3"
                      data-color="forestbit"
                    >
                      <div className="pd-onboarding__agent-body">
                        <img
                          className="pd-onboarding__weapon"
                          data-weapon="drone"
                          src="/sprites/weapons/drone.png"
                          alt=""
                          aria-hidden="true"
                        />
                        <AgentIcon themeKey="arcade" size={64} />
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

          {/* Unified task stack — one set of DOM nodes persists across panel 0,
              panel 1 and smash. `data-mode` drives all three visual states.
              Each item has an inner wrapper so the wobble transform is isolated
              from the layout transform and mode changes stay smooth. */}
          {(step === 'intro' || step === 'smash') && (
            <div
              className="pd-onboarding__task-stack"
              data-mode={
                step === 'smash'
                  ? 'list'
                  : introPanel === 0 ? 'wriggle' : 'pile'
              }
            >
              {(() => {
                // `data-idx` uses the *visible* slot (index among un-smashed
                // tasks) so the remaining cards slide up as earlier ones are
                // smashed. `isActive` compares against the original array idx
                // because that's how smashCount progresses.
                const visible = DUMMY_TASKS.filter((t) => !smashedIds.has(t.id));
                return visible.map((task, visibleIdx) => {
                  const origIdx = DUMMY_TASKS.findIndex((t) => t.id === task.id);
                  const isActive = step === 'smash' && origIdx === smashCount;
                  const enabled = step === 'smash';
                  return (
                    <div
                      key={task.id}
                      className="pd-onboarding__task-stack-item"
                      data-idx={visibleIdx}
                      data-active={isActive}
                      aria-disabled={!isActive}
                    >
                      <div className="pd-onboarding__task-stack-item-inner">
                        <TaskItem
                          task={task}
                          isSmash
                          onComplete={enabled ? () => handleSmash(task.id) : () => {}}
                          onEdit={enabled ? () => handleSmash(task.id) : () => {}}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* 最初の任務 — Fighter のパンチを報酬として見せる。ボタンは1つだけ */}
          {step === 'mission' && (
            <div className="pd-onboarding__mission" data-testid="onboarding-mission">
              <img
                src="/fighter-punch.gif"
                alt={FIRST_CHALLENGE?.name ?? 'Fighter / Punch'}
                className="pd-onboarding__mission-gif"
              />
              <div className="pd-onboarding__mission-name">
                <span>{FIRST_CHALLENGE?.name ?? 'Fighter / Punch'}</span>
                <Badge variant="rare">{FIRST_CHALLENGE?.rarity ?? 'RARE'}</Badge>
              </div>
              <div
                className="pd-onboarding__mission-progress"
                role="progressbar"
                aria-label={copy.missionProgressLabel}
                aria-valuemin={0}
                aria-valuemax={FIRST_CHALLENGE_THRESHOLD}
                aria-valuenow={0}
              >
                <div className="pd-onboarding__mission-progress-track" aria-hidden="true">
                  <div className="pd-onboarding__mission-progress-fill" />
                </div>
                <span className="pd-onboarding__mission-progress-count">0 / {FIRST_CHALLENGE_THRESHOLD}</span>
              </div>
              <Button variant="primary" size="lg" fullWidth onClick={handleAcceptMission}>
                {copy.missionAccept}
              </Button>
            </div>
          )}

          {/* Step 5 has no dummy CTA — the overlay becomes a transparent
              tour and the real Add button in the Today view handles the tap. */}
        </div>

        {(step === 'intro' || step === 'smash') && (
          <div
            className="pd-onboarding__tap-hint"
            aria-hidden="true"
            data-visible={!isTyping && (step === 'intro' || smashComplete) ? 'true' : 'false'}
          >
            {copy.tapToContinue}
          </div>
        )}
      </div>
    </div>
  );
}
