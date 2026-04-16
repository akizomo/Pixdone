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
declare const ArcadeWorld: {
  preloadImages: (onReady?: () => void) => void;
  getCabinetPositions: (count: number, canvasW: number) => number[];
  draw: (
    ctx: CanvasRenderingContext2D, w: number, h: number,
    colors: { wall: string; floor: string; trim: string; bitBody: string; bitEye: string },
    cabinetCount: number,
    agents: Array<{ x: number; frame: number; facingLeft: boolean }>,
  ) => void;
};
declare const ArcadeAgents: {
  createAgents: (count: number, positions: number[]) => any[];
  update: (agents: any[], positions: number[], dt: number) => void;
  getRenderData: (agents: any[]) => Array<{ x: number; frame: number; facingLeft: boolean }>;
};

interface WorldLayerProps {
  themeKey: ThemeKey;
  cabinetCount: number;
  agentCount: number;
}

export function WorldLayer({ themeKey, cabinetCount, agentCount }: WorldLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const agentsRef = useRef<any[]>([]);
  const prevTimeRef = useRef<number>(0);
  const isArcade = themeKey === 'arcade';

  // Rebuild agents when counts change
  const rebuildAgents = useCallback((canvasW: number) => {
    const positions = ArcadeWorld.getCabinetPositions(cabinetCount, canvasW);
    agentsRef.current = ArcadeAgents.createAgents(agentCount, positions);
  }, [cabinetCount, agentCount]);

  useEffect(() => {
    if (!isArcade) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let running = true;

    ArcadeWorld.preloadImages(() => {
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
        const positions = ArcadeWorld.getCabinetPositions(cabinetCount, w);
        ArcadeAgents.update(agentsRef.current, positions, dt);

        // Draw
        const ctx = WorldEngine.setupCanvas(canvas, w, h);
        const colors = WorldEngine.getWorldColors('arcade');
        const renderData = ArcadeAgents.getRenderData(agentsRef.current);
        ArcadeWorld.draw(ctx, w, h, colors, cabinetCount, renderData);

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
  }, [isArcade, cabinetCount, agentCount, rebuildAgents]);

  if (!isArcade || (cabinetCount === 0 && agentCount === 0)) return null;

  return <canvas ref={canvasRef} className="pd-world-canvas" />;
}
