import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize vanilla task completion effects (animations.js loaded via index.html)
declare global {
  interface Window {
    TaskAnimationEffects?: new () => { animateTaskCompletion: (el: HTMLElement, rect: { left: number; top: number; width: number; height: number }) => void };
    taskAnimationEffects?: InstanceType<NonNullable<Window['TaskAnimationEffects']>>;
  }
}
if (typeof window !== 'undefined') {
  const init = () => {
    if (window.TaskAnimationEffects && !window.taskAnimationEffects) {
      window.taskAnimationEffects = new window.TaskAnimationEffects();
    }
  };
  init();
  if (document.readyState !== 'complete') {
    window.addEventListener('load', init);
  }
}

// PWA service worker (minimal, app/public/sw.js)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // ignore
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
