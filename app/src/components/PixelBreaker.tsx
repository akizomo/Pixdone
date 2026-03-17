import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '../design-system';

export interface PixelBreakerProps {
  lang: 'en' | 'ja';
  onEnd?: () => void;
}

const COLS = 7;
const ROWS = 4;
const BLOCK_H = 14;
const BLOCK_GAP = 3;
const BLOCK_TOP = 24;
const PADDLE_H = 8;
const BALL_SIZE = 7;
const GAME_SECS = 60;

const ROW_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'];

interface Block  { x: number; y: number; w: number; alive: boolean; color: string }
interface Ball   { x: number; y: number; vx: number; vy: number }
interface Paddle { x: number; w: number }

function initBlocks(cw: number): Block[] {
  const pad = 8;
  const bw = Math.floor((cw - pad * 2 - BLOCK_GAP * (COLS - 1)) / COLS);
  return Array.from({ length: ROWS * COLS }, (_, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    return { x: pad + c * (bw + BLOCK_GAP), y: BLOCK_TOP + r * (BLOCK_H + BLOCK_GAP), w: bw, alive: true, color: ROW_COLORS[r] };
  });
}

function drawStatic(ctx: CanvasRenderingContext2D, cw: number, ch: number, blocks: Block[], paddleX: number, paddleW: number) {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--pd-color-background-default') || '#111';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cw, ch);
  for (const b of blocks) {
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, BLOCK_H);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(b.x, b.y, b.w, 2);
  }
  const pd = getComputedStyle(document.documentElement).getPropertyValue('--pd-color-accent-default') || '#00e676';
  ctx.fillStyle = pd;
  ctx.fillRect(paddleX, ch - PADDLE_H - 12, paddleW, PADDLE_H);
}

export function PixelBreaker({ lang }: PixelBreakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const gameRef  = useRef<{ blocks: Block[]; ball: Ball; paddle: Paddle; running: boolean; timeLeft: number; cw: number; ch: number; speed: number; paddleW: number } | null>(null);
  const rafRef   = useRef<number>(0);
  const tickRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [timeLeft, setTimeLeft] = useState(GAME_SECS);

  // Draw static initial frame on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = wrap.clientWidth || 300;
    const ch = Math.round(cw * 0.65);
    canvas.width = cw;
    canvas.height = ch;
    const paddleW = Math.round(cw * 0.22);
    drawStatic(ctx, cw, ch, initBlocks(cw), cw / 2 - paddleW / 2, paddleW);
  }, []);

  const stopRound = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (gameRef.current) gameRef.current.running = false;
  }, []);

  const endGame = useCallback(() => {
    stopRound();
    setPhase('ended');
  }, [stopRound]);

  const startRound = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stopRound();

    const cw = canvas.width || wrap.clientWidth || 300;
    const ch = canvas.height || Math.round(cw * 0.65);
    const speed = cw * 0.012;
    const paddleW = Math.round(cw * 0.22);

    gameRef.current = {
      blocks: initBlocks(cw),
      ball: { x: cw / 2, y: ch * 0.6, vx: speed * (Math.random() > 0.5 ? 1 : -1), vy: -speed },
      paddle: { x: cw / 2 - paddleW / 2, w: paddleW },
      running: true, timeLeft: GAME_SECS, cw, ch, speed, paddleW,
    };
    setTimeLeft(GAME_SECS);
    setPhase('playing');

    tickRef.current = setInterval(() => {
      const g = gameRef.current;
      if (!g?.running) return;
      g.timeLeft -= 1;
      setTimeLeft(g.timeLeft);
      if (g.timeLeft <= 0) endGame();
    }, 1000);

    const loop = () => {
      const g = gameRef.current;
      if (!g?.running) return;

      g.ball.x += g.ball.vx;
      g.ball.y += g.ball.vy;

      if (g.ball.x <= 0)              { g.ball.x = 0; g.ball.vx *= -1; }
      if (g.ball.x + BALL_SIZE >= g.cw) { g.ball.x = g.cw - BALL_SIZE; g.ball.vx *= -1; }
      if (g.ball.y <= 0)              { g.ball.y = 0; g.ball.vy *= -1; }
      if (g.ball.y > g.ch + BALL_SIZE) { endGame(); return; }

      const py = g.ch - PADDLE_H - 12;
      if (g.ball.vy > 0 && g.ball.y + BALL_SIZE >= py && g.ball.y <= py + PADDLE_H &&
          g.ball.x + BALL_SIZE >= g.paddle.x && g.ball.x <= g.paddle.x + g.paddle.w) {
        g.ball.vy *= -1;
        g.ball.y = py - BALL_SIZE;
        const hit = (g.ball.x + BALL_SIZE / 2 - g.paddle.x) / g.paddle.w;
        g.ball.vx = g.speed * (hit * 2 - 1) * 1.5;
      }

      let alive = 0;
      for (const b of g.blocks) {
        if (!b.alive) continue;
        alive++;
        if (g.ball.x + BALL_SIZE > b.x && g.ball.x < b.x + b.w &&
            g.ball.y + BALL_SIZE > b.y && g.ball.y < b.y + BLOCK_H) {
          b.alive = false; alive--;
          const minH = Math.min(g.ball.x + BALL_SIZE - b.x, b.x + b.w - g.ball.x);
          const minV = Math.min(g.ball.y + BALL_SIZE - b.y, b.y + BLOCK_H - g.ball.y);
          if (minH < minV) g.ball.vx *= -1; else g.ball.vy *= -1;
        }
      }
      if (alive === 0) { endGame(); return; }

      drawStatic(ctx, g.cw, g.ch, g.blocks, g.paddle.x, g.paddle.w);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(g.ball.x, g.ball.y, BALL_SIZE, BALL_SIZE);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopRound, endGame]);

  // Paddle input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.width || 300;
    const handleMouseMove = (e: MouseEvent) => {
      const g = gameRef.current;
      if (!g?.running) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (cw / rect.width);
      g.paddle.x = Math.max(0, Math.min(cw - g.paddle.w, mx - g.paddle.w / 2));
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const g = gameRef.current;
      if (!g?.running) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.touches[0].clientX - rect.left) * (cw / rect.width);
      g.paddle.x = Math.max(0, Math.min(cw - g.paddle.w, mx - g.paddle.w / 2));
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => () => stopRound(), [stopRound]);

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontFamily: 'var(--pd-font-brand)', fontSize: '0.875rem', color: 'var(--pd-color-text-secondary)', letterSpacing: '0.1em' }}>
        <span>PIXEL BREAKER</span>
        {phase === 'playing' && <span style={{ color: timeLeft <= 10 ? '#ff6b6b' : undefined }}>{timeLeft}s</span>}
      </div>
      <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', imageRendering: 'pixelated', cursor: phase === 'playing' ? 'none' : 'default' }} />
        {phase === 'ready' && (
          <div style={overlayStyle}>
            <Button variant="secondary" size="sm" onClick={startRound}>
              {lang === 'ja' ? 'スタート' : 'START'}
            </Button>
          </div>
        )}
        {phase === 'ended' && (
          <div style={overlayStyle}>
            <Button variant="secondary" size="sm" onClick={startRound}>
              {lang === 'ja' ? 'もう一度' : 'RESTART'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
