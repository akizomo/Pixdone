import { useCallback, useEffect, useRef, useState } from 'react';
import type { ThemeKey } from '../design-system/themes/themeRegistry';
import { Button, PixelIcon } from '../design-system';
import { AgentIcon } from './AgentIcon';
import { TaskItem } from './TaskItem';
import type { Task } from '../types/task';
import { runVanillaCompletionEffect } from '../services/taskAnimations';
import {
  buildTutorialDrawPool,
  weightedRandomEffect,
  type EffectDef,
} from '../data/effectsRegistry';
import { playSound } from '../services/sound';
import './OnboardingTutorial.css';

type Step = 'splash' | 'intro' | 'smash' | 'upgrade' | 'firstTask';

const DUMMY_TASKS: Task[] = [
  { id: 'ob-task-1', title: 'Monday Meeting', completed: false, dueDate: null, listId: 'onboarding' },
  { id: 'ob-task-2', title: 'Overdue Report', completed: false, dueDate: null, listId: 'onboarding' },
  { id: 'ob-task-3', title: 'That Email',    completed: false, dueDate: null, listId: 'onboarding' },
];

const INTRO_PANELS: { dialogue: string }[] = [
  { dialogue: 'Decades after the golden age of pixels,\ntasks still rule the world.' },
  { dialogue: "We are T.A.S.K. — built to destroy them.\nYou're an Agent now." },
];

const SPLASH_DURATION_MS = 1800;

const SMASH_DIALOGUES = [
  'Your first mission starts here.\nSmash this task.',
  'Something happens\nevery time you smash a task.',
  'Some are rarer than others.',
  'Complete monthly challenges\nto unlock more.',
];

const PLUS_BENEFITS = [
  'Unlock all themes — build your own pixel world',
  'Grow your theme as you complete tasks',
  'Collect Rare & Epic effects',
  "Request your own effect — we'll make it (once a month)",
  'Unlimited task lists',
];

export type BillingCycle = 'monthly' | 'yearly';

export interface OnboardingTutorialProps {
  themeKey: ThemeKey;
  isPremium: boolean;
  /** Called when the tutorial finishes without purchase (Later / first-task) — parent closes overlay. */
  onDone: () => void;
  /** Triggers the Stripe checkout flow for the selected billing cycle. May navigate away; may reject. */
  onUpgrade: (cycle: BillingCycle) => Promise<void> | void;
  /** Fires once when the user reaches the PixDone+ step — parent marks hasSeenTutorial. */
  onReachCta?: () => void;
  /** Fires once when the user reaches the first-task tour step — parent navigates to the Today view. */
  onEnterFirstTask?: () => void;
}

export function OnboardingTutorial({
  themeKey,
  isPremium,
  onDone: _onDone,
  onUpgrade,
  onReachCta,
  onEnterFirstTask,
}: OnboardingTutorialProps) {
  const [step, setStep] = useState<Step>('splash');
  const [introPanel, setIntroPanel] = useState(0);
  const [smashCount, setSmashCount] = useState(0);
  const [smashedIds, setSmashedIds] = useState<Set<string>>(new Set());
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [smashLocked, setSmashLocked] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  // The fighter-kick.gif has a long hold frame at the end of its loop. We
  // periodically remount the <img> so the GIF restarts at frame 0 and the
  // visible pause between kicks stays short.
  const [kickNonce, setKickNonce] = useState(0);
  const ctaReachedRef = useRef(false);

  useEffect(() => {
    if (step !== 'upgrade') return;
    const id = window.setInterval(() => {
      setKickNonce((n) => n + 1);
    }, 700);
    return () => window.clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== 'splash') return;
    const id = window.setTimeout(() => setStep('intro'), SPLASH_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [step]);

  useEffect(() => {
    if (step !== 'upgrade' || ctaReachedRef.current) return;
    ctaReachedRef.current = true;
    onReachCta?.();
  }, [step, onReachCta]);

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
      ? INTRO_PANELS[introPanel]!.dialogue
      : step === 'smash'
        ? SMASH_DIALOGUES[Math.min(smashCount, SMASH_DIALOGUES.length - 1)]!
        : step === 'firstTask'
          ? 'Now add your first task.'
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
      setStep('upgrade');
    }
  }, [typedChars, dialogueText.length, step, smashComplete]);

  const handleUpgradeClick = useCallback(async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    try {
      await onUpgrade(billingCycle);
    } catch {
      setIsUpgrading(false);
    }
  }, [isUpgrading, onUpgrade, billingCycle]);

  const handleLaterOnUpgrade = useCallback(() => {
    setStep('firstTask');
  }, []);

  if (step === 'splash') {
    return (
      <div className="pd-onboarding pd-onboarding--splash" role="dialog" aria-modal="true" aria-label="PixDone onboarding">
        <div className="pd-onboarding__splash">
          <img
            src="/logo-white.svg"
            alt="PixDone"
            className="pd-onboarding__splash-logo"
          />
          <div className="pd-onboarding__splash-sub">Welcome to PixDone.</div>
        </div>
      </div>
    );
  }

  if (step === 'upgrade') {
    return (
      <div className="pd-onboarding pd-onboarding--upgrade" role="dialog" aria-modal="true" aria-label="PixDone+ upgrade">
        <div className="pd-onboarding__panel">
          <div className="pd-onboarding__panel-lineup" aria-hidden="true">
            <span
              className="pd-onboarding__lineup-sprite pd-onboarding__lineup-sprite--agent"
              aria-hidden="true"
            />
            <img
              key={`kick-${kickNonce}`}
              src="/fighter-kick.gif"
              alt=""
              className="pd-onboarding__lineup-sprite pd-onboarding__lineup-sprite--kick"
              aria-hidden="true"
            />
            <img
              src="/bomb.gif"
              alt=""
              className="pd-onboarding__lineup-sprite"
              aria-hidden="true"
            />
          </div>
          <h2 className="pd-onboarding__panel-title">Ready to go further?</h2>
          <ul className="pd-onboarding__benefits">
            {PLUS_BENEFITS.map((b, i) => (
              <li
                key={b}
                className="pd-onboarding__benefit"
                style={{ animationDelay: `${80 + i * 80}ms` }}
              >
                <span className="pd-onboarding__benefit-bullet" aria-hidden="true">
                  <PixelIcon name="check" size="18px" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="pd-onboarding__panel-buttons">
            {isPremium ? (
              <Button variant="primary" size="lg" fullWidth onClick={handleLaterOnUpgrade} soundKey="buttonClick">
                Next
              </Button>
            ) : (
              <>
                <div
                  className="pd-onboarding__cycle-toggle"
                  role="radiogroup"
                  aria-label="Billing cycle"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={billingCycle === 'monthly'}
                    className="pd-onboarding__cycle-option"
                    data-selected={billingCycle === 'monthly'}
                    onClick={() => { playSound('buttonClick'); setBillingCycle('monthly'); }}
                  >
                    <span className="pd-onboarding__cycle-label">Monthly</span>
                    <span className="pd-onboarding__cycle-price">¥600<small>/mo</small></span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={billingCycle === 'yearly'}
                    className="pd-onboarding__cycle-option"
                    data-selected={billingCycle === 'yearly'}
                    onClick={() => { playSound('buttonClick'); setBillingCycle('yearly'); }}
                  >
                    <span className="pd-onboarding__cycle-badge" aria-hidden="true">SAVE 17%</span>
                    <span className="pd-onboarding__cycle-label">Yearly</span>
                    <span className="pd-onboarding__cycle-price">¥500<small>/mo</small></span>
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isUpgrading}
                  onClick={handleUpgradeClick}
                  soundKey="taskComplete"
                >
                  Try PixDone+
                </Button>
                <Button variant="ghost" size="md" fullWidth onClick={handleLaterOnUpgrade} soundKey="taskCancel">
                  Later
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Steps intro (2 panels) / smash / firstTask share the header+stage layout

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
                      className="pd-onboarding__agent-runner"
                      data-color="arcade"
                      style={{ animationDelay: '80ms' }}
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
                      className="pd-onboarding__agent-runner"
                      data-color="synthwave"
                      style={{ animationDelay: '220ms' }}
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
                      className="pd-onboarding__agent-runner"
                      data-color="forestbit"
                      style={{ animationDelay: '360ms' }}
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

          {/* Step 5 has no dummy CTA — the overlay becomes a transparent
              tour and the real Add button in the Today view handles the tap. */}
        </div>

        {(step === 'intro' || step === 'smash') && (
          <div
            className="pd-onboarding__tap-hint"
            aria-hidden="true"
            data-visible={!isTyping && (step === 'intro' || smashComplete) ? 'true' : 'false'}
          >
            TAP TO CONTINUE
          </div>
        )}
      </div>
    </div>
  );
}
