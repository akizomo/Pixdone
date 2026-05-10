import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import { initPixelCursor } from './utils/pixelCursor'

// Initialize vanilla task completion effects (animations.js loaded via index.html)
declare global {
  interface Window {
    TaskAnimationEffects?: new () => {
      animateTaskCompletion: (el: HTMLElement, rect: { left: number; top: number; width: number; height: number }) => void;
      comicEffects?: { playSound: (k: string) => void; getSoundEnabled: () => boolean };
    };
    /** Used by /perfectTiming.js and perfectTimingEffects.js (vanilla parity with script.js). */
    comicEffects?: { playSound: (k: string) => void; getSoundEnabled?: () => boolean };
  }
}
if (typeof window !== 'undefined') {
  initPixelCursor();
  const init = () => {
    if (window.TaskAnimationEffects && !window.taskAnimationEffects) {
      window.taskAnimationEffects = new window.TaskAnimationEffects();
    }
    const ce = window.taskAnimationEffects?.comicEffects;
    if (ce) {
      window.comicEffects = ce;
    }
  };
  init();
  if (document.readyState !== 'complete') {
    window.addEventListener('load', init);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Analytics />
    </BrowserRouter>
  </StrictMode>,
)
