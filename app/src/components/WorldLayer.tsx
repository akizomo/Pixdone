import { useRef, useEffect, useCallback } from 'react';
import type { ThemeKey } from '../design-system/themes/themeRegistry';
import './WorldLayer.css';

/* Global vanilla-JS modules loaded via <script> in index.html */
declare const WorldEngine: {
  getWorldColors: (prefix: string) => {
    wall: string; floor: string; trim: string; bitBody: string; bitEye: string;
  };
  setupCanvas: (canvas: HTMLCanvasElement, w: number, h: number) => CanvasRenderingContext2D;
};
interface WorldModule {
  preloadImages: (onReady?: () => void) => void;
  getStopPositions: (level: number, canvasW: number) => number[];
  draw: (
    ctx: CanvasRenderingContext2D, w: number, h: number,
    colors: { wall: string; floor: string; trim: string; bitBody: string; bitEye: string },
    level: number,
    agents: Array<{ x: number; frame: number; facingLeft: boolean }>,
  ) => void;
}
declare const ArcadeWorld: WorldModule;
declare const ForestBitWorld: WorldModule;
declare const WorldAgents: {
  createAgents: (count: number, positions: number[]) => any[];
  update: (agents: any[], positions: number[], dt: number, canvasW?: number) => void;
  getRenderData: (agents: any[]) => Array<{ x: number; frame: number; facingLeft: boolean }>;
};

interface WorldLayerProps {
  themeKey: ThemeKey;
  level: number;
  agentCount: number;
}

function resolveWorld(themeKey: ThemeKey): { module: WorldModule; colorPrefix: string } | null {
  if (themeKey === 'arcade') return { module: ArcadeWorld, colorPrefix: 'arcade' };
  if (themeKey === 'forestbit') return { module: ForestBitWorld, colorPrefix: 'forestbit' };
  return null;
}

export function WorldLayer({ themeKey, level, agentCount }: WorldLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const agentsRef = useRef<any[]>([]);
  const prevTimeRef = useRef<number>(0);

  const world = resolveWorld(themeKey);

  // Rebuild agents when counts change
  const rebuildAgents = useCallback((canvasW: number) => {
    if (!world) return;
    const positions = world.module.getStopPositions(level, canvasW);
    agentsRef.current = WorldAgents.createAgents(agentCount, positions);
  }, [world, level, agentCount]);

  useEffect(() => {
    if (!world) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let running = true;

    world.module.preloadImages(() => {
      if (!running) return;

      const rect = canvas.getBoundingClientRect();
      rebuildAgents(rect.width);
      prevTimeRef.current = performance.now();

      const loop = (now: number) => {
        if (!running) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w === 0 || h === 0) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const dt = Math.min((now - prevTimeRef.current) / 1000, 0.1); // cap dt at 100ms
        prevTimeRef.current = now;

        // Update agent state machines
        const positions = world.module.getStopPositions(level, w);
        WorldAgents.update(agentsRef.current, positions, dt, w);

        // Draw
        const ctx = WorldEngine.setupCanvas(canvas, w, h);
        const colors = WorldEngine.getWorldColors(world.colorPrefix);
        const renderData = WorldAgents.getRenderData(agentsRef.current);
        world.module.draw(ctx, w, h, colors, level, renderData);

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    });

    // Rebuild agents on resize
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      rebuildAgents(rect.width);
    };
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [world, level, agentCount, rebuildAgents]);

  if (!world) return null;
  if (level <= 0 && agentCount === 0) return null;

  const themeClass = themeKey === 'forestbit' ? 'pd-world-canvas--forestbit' : '';
  return <canvas ref={canvasRef} className={['pd-world-canvas', themeClass].filter(Boolean).join(' ')} />;
}
