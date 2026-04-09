import { useEffect, useRef, useState } from 'react';
import '../styles/pacman-progress.css';
import type { FocusTimerState } from '../hooks/useFocusTimer';

interface PacmanProgressProps {
  remaining: number;
  totalSeconds: number;
  timerState: FocusTimerState;
}

// Layout constants (px)
const PAC_SIZE   = 24; // 8 pixels × 3px each
const DOT_SIZE   = 6;
const DOT_COUNT  = 25;
const FLAG_AREA  = 22;
const GROUND_BTM = 6;
const HEIGHT     = 52;
const PX         = 3;  // px per pixel-art unit (8×3 = 24)

// Pixel art frames: 0=empty, 1=body, 2=eye (dark)
// 8×8 grid, Pac-Man facing right
const FRAME_OPEN: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 2, 1, 1, 0], // eye at col 4
  [1, 1, 1, 1, 1, 0, 0, 0], // mouth top edge
  [1, 1, 1, 0, 0, 0, 0, 0], // mouth wide open
  [1, 1, 1, 0, 0, 0, 0, 0], // mouth wide open
  [1, 1, 1, 1, 1, 0, 0, 0], // mouth bottom edge
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

const FRAME_CLOSED: number[][] = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 2, 1, 1, 0], // eye at col 4
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

// Pixel art flag: 4 cols × 4 rows → renders at 12×12px (flagPx=3)
// Alternating green / dark for checkered look
const FLAG_GRID = 4;
const FLAG_PX   = 3;

function PacmanSprite({ frame, arriving }: { frame: number[][]; arriving: boolean }) {
  return (
    <svg
      width={PAC_SIZE}
      height={PAC_SIZE}
      viewBox={`0 0 ${PAC_SIZE} ${PAC_SIZE}`}
      className={arriving ? 'pxd-pacman--arrive' : undefined}
      shapeRendering="crispEdges"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {frame.flatMap((row, ry) =>
        row.map((cell, cx) => {
          if (cell === 0) return null;
          return (
            <rect
              key={`${ry}-${cx}`}
              x={cx * PX}
              y={ry * PX}
              width={PX}
              height={PX}
              fill={
                cell === 2
                  ? 'var(--pxd-color-surface-background)'
                  : 'var(--pxd-color-action-primary)'
              }
            />
          );
        })
      )}
    </svg>
  );
}

function FlagSprite({
  flagClass,
  totalHeight,
}: {
  flagClass?: string;
  totalHeight: number;
}) {
  const poleH = totalHeight - 2;
  const flagOffX = 4; // px from left edge (after 3px pole + 1px gap)
  const flagOffY = 2; // px from top

  return (
    <svg
      width={FLAG_AREA}
      height={totalHeight}
      viewBox={`0 0 ${FLAG_AREA} ${totalHeight}`}
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {/* Pole */}
      <rect
        x="1" y={flagOffY}
        width="3"
        height={poleH}
        fill="var(--pxd-color-border-outline)"
        opacity="0.5"
      />
      {/* Checkered flag head */}
      <g className={flagClass} style={{ transformOrigin: `${flagOffX}px ${flagOffY + FLAG_GRID * FLAG_PX / 2}px` }}>
        {Array.from({ length: FLAG_GRID }, (_, ry) =>
          Array.from({ length: FLAG_GRID }, (_, cx) => (
            <rect
              key={`${ry}-${cx}`}
              x={flagOffX + cx * FLAG_PX}
              y={flagOffY + ry * FLAG_PX}
              width={FLAG_PX}
              height={FLAG_PX}
              fill={
                (ry + cx) % 2 === 0
                  ? 'var(--pxd-color-feedback-success)'
                  : 'var(--pxd-color-text-primary)'
              }
              opacity="0.85"
            />
          ))
        )}
      </g>
    </svg>
  );
}

export function PacmanProgress({ remaining, totalSeconds, timerState }: PacmanProgressProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(280);
  const [mouthOpen, setMouthOpen] = useState(true);

  // Track eating animation state: set of dot indices currently animating
  const [eatingSet, setEatingSet] = useState<Set<number>>(new Set());
  const prevEatenRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width || 280);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pixel-art chomp: toggle open/closed at ~5 chomps/sec when running
  useEffect(() => {
    if (timerState !== 'running') {
      setMouthOpen(true); // idle = mouth open, ready to eat
      return;
    }
    const id = setInterval(() => setMouthOpen(v => !v), 200);
    return () => clearInterval(id);
  }, [timerState]);

  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(1, 1 - remaining / totalSeconds))
    : 0;

  const isRunning  = timerState === 'running';
  const isComplete = remaining === 0;

  const travelZone = Math.max(0, containerWidth - PAC_SIZE - FLAG_AREA);
  const charX      = Math.round(progress * travelZone);
  const eatenCount = Math.round(progress * DOT_COUNT);

  // Trigger eating animation for newly consumed dots
  useEffect(() => {
    const prev = prevEatenRef.current;
    prevEatenRef.current = eatenCount;
    if (eatenCount <= prev) return;

    const batch = new Set<number>();
    for (let i = prev; i < eatenCount; i++) batch.add(i);

    setEatingSet(s => new Set([...s, ...batch]));

    const t = setTimeout(() => {
      setEatingSet(s => {
        const next = new Set(s);
        batch.forEach(i => next.delete(i));
        return next;
      });
    }, 280);

    return () => clearTimeout(t);
  }, [eatenCount]);

  const frame    = isComplete || !mouthOpen ? FRAME_CLOSED : FRAME_OPEN;
  const flagH    = HEIGHT - GROUND_BTM;
  const flagClass =
    isComplete          ? 'pxd-flag--complete'
    : timerState === 'idle' ? 'pxd-flag--idle'
    : undefined;

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', position: 'relative', height: `${HEIGHT}px` }}
      aria-hidden="true"
    >
      {/* Ground line */}
      <div style={{
        position:   'absolute',
        bottom:     `${GROUND_BTM - 1}px`,
        left:       0,
        right:      0,
        height:     '2px',
        background: 'var(--pxd-color-border-outline-variant)',
        opacity:    0.3,
      }} />

      {/* Dots */}
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        const dotX  = PAC_SIZE / 2 + ((i + 0.5) / DOT_COUNT) * travelZone;
        const eaten = i < eatenCount;
        const eating = eatingSet.has(i);
        return (
          <div
            key={i}
            className={eating ? 'pxd-dot--eating' : undefined}
            style={{
              position:     'absolute',
              left:         `${dotX - DOT_SIZE / 2}px`,
              bottom:       `${GROUND_BTM + 3}px`,
              width:        `${DOT_SIZE}px`,
              height:       `${DOT_SIZE}px`,
              borderRadius: '1px',
              background:   'var(--pxd-color-text-secondary)',
              opacity:      eating ? undefined : (eaten ? 0 : 0.45),
            }}
          />
        );
      })}

      {/* Pac-Man */}
      <div
        style={{
          position:   'absolute',
          left:       `${charX}px`,
          bottom:     `${GROUND_BTM}px`,
          width:      `${PAC_SIZE}px`,
          height:     `${PAC_SIZE}px`,
          transition: isRunning ? 'left 0.65s linear' : 'none',
        }}
      >
        <PacmanSprite frame={frame} arriving={isComplete} />
      </div>

      {/* Goal flag */}
      <div style={{ position: 'absolute', right: '1px', bottom: `${GROUND_BTM}px` }}>
        <FlagSprite flagClass={flagClass} totalHeight={flagH} />
      </div>
    </div>
  );
}
