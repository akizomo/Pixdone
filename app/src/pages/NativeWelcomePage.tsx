import { useCallback, useEffect, useRef } from 'react';
import { Button, PixelIcon } from '../design-system';
import { playSound } from '../services/sound';
import {
  EFFECTS_REGISTRY,
  weightedRandomEffectTutorial,
  pickGuaranteedRareOrEpic,
} from '../data/effectsRegistry';
import { runVanillaCompletionEffect } from '../services/taskAnimations';
import { DemoTaskItem } from './CollectionPage/DemoTaskItem';
import type { Lang } from '../lib/i18n';
import './NativeWelcomePage.css';

interface NativeWelcomePageProps {
  lang: Lang;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

/**
 * Logged-out entry screen for the iOS / Android app. The web LP is a marketing
 * page (pricing, feature sections); in a store app the user has already chosen
 * to install, so this is a single, non-scrolling screen: try a smash, then sign in.
 */
export function NativeWelcomePage({ lang, onOpenLogin, onOpenSignup }: NativeWelcomePageProps) {
  const isJa = lang === 'ja';
  const taskRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    const el = taskRef.current;
    if (el) el.style.visibility = '';
  }, []);

  const handleSmash = useCallback(() => {
    const el = taskRef.current;
    if (!el) return;
    el.style.visibility = '';
    playSound('taskComplete');
    // Same first-impression bias as the LP hero: mostly Rare/Epic.
    const chosen = Math.random() < 0.8
      ? pickGuaranteedRareOrEpic(EFFECTS_REGISTRY)
      : weightedRandomEffectTutorial(EFFECTS_REGISTRY);
    runVanillaCompletionEffect(el, () => {}, chosen.key);
  }, []);

  return (
    <div className="nw-root">
      <main className="nw-main">
        <div className="nw-brand">
          <img src="/app-icon.svg" alt="" className="nw-brand__icon" draggable={false} />
          <span className="nw-brand__name">PixDone</span>
        </div>

        <div className="nw-demo">
          <DemoTaskItem ref={taskRef} lang={lang} onSmash={handleSmash} />
          <div className="nw-hint" aria-hidden="true">
            <span className="nw-hint__arrow"><PixelIcon name="arrow_upward" size="md" /></span>
            <span>{isJa ? 'タップしてスマッシュ！' : 'Smash me!'}</span>
          </div>
        </div>

        <h1 className="nw-headline">
          {isJa ? (
            <>
              「終わった」を<br />
              <span className="nw-nowrap">
                <span className="nw-accent">一番気持ちいい</span>瞬間に。
              </span>
            </>
          ) : (
            <>
              Make finishing tasks the <span className="nw-accent">best part</span> of your day.
            </>
          )}
        </h1>
      </main>

      <footer className="nw-actions">
        <Button variant="primary" size="lg" fullWidth onClick={onOpenSignup}>
          {isJa ? 'はじめる' : 'Get started'}
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={onOpenLogin}>
          {isJa ? 'アカウントをお持ちの方はログイン' : 'I already have an account'}
        </Button>
      </footer>
    </div>
  );
}
