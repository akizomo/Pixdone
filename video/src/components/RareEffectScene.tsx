import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { bodyFont, pixelFont } from "../fonts";
import { PixelParticles } from "./PixelParticles";

const ACCENT = "#ffd700";
const TEXT_AREA_H = 460;
const GRID_PADDING = 80;
const GRID_GAP = 16;
const COLS = 2;
const GRID_START = TEXT_AREA_H + 40;
const GRID_END = 1860;
const GRID_H = GRID_END - GRID_START;
const ROWS = 6; // 10 named + 2 hidden = 12 tiles
const TILE_H = Math.floor((GRID_H - (ROWS - 1) * GRID_GAP) / ROWS);
const TILE_W = Math.floor((1080 - GRID_PADDING * 2 - GRID_GAP) / COLS);

const EFFECTS = [
  { name: "RAINBOW",   color: "#ff6ec7", delay: 4  },
  { name: "FREEZE",    color: "#00eeff", delay: 9  },
  { name: "LIGHTNING", color: "#ffd700", delay: 14 },
  { name: "FIRE",      color: "#ff6b35", delay: 19 },
  { name: "CRYSTAL",   color: "#7fffaa", delay: 24 },
  { name: "VORTEX",    color: "#b06aff", delay: 29 },
  { name: "STAR",      color: "#fff066", delay: 34 },
  { name: "BLOOM",     color: "#ff9de2", delay: 39 },
  { name: "MEGA",      color: "#ff4040", delay: 44 },
  { name: "WAVE",      color: "#40c4ff", delay: 49 },
  { name: "???",       color: "#555",    delay: 60, hidden: true },
  { name: "???",       color: "#444",    delay: 68, hidden: true },
] as const;

// ピクセルドットクラスター (各カードの装飾)
const PixelCluster: React.FC<{
  color: string;
  frame: number;
  delay: number;
  hidden?: boolean;
}> = ({ color, frame, delay, hidden }) => {
  const f = frame - delay;
  const GRID = [
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
  ];
  const SIZE = 10;
  const GAP = 4;

  return (
    <div style={{ position: "relative", width: 5 * SIZE + 4 * GAP, height: 5 * SIZE + 4 * GAP }}>
      {GRID.flatMap((row, ri) =>
        row.map((on, ci) => {
          if (!on) return null;
          const i = ri * 5 + ci;
          const blink = hidden
            ? 0.2 + 0.15 * Math.sin((frame + i * 11) * 0.12)
            : interpolate(f - i * 1.5, [0, 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
          return (
            <div
              key={`${ri}-${ci}`}
              style={{
                position: "absolute",
                left: ci * (SIZE + GAP),
                top: ri * (SIZE + GAP),
                width: SIZE,
                height: SIZE,
                background: hidden ? "#444" : color,
                opacity: blink,
                boxShadow: hidden ? "none" : `0 0 6px ${color}88`,
              }}
            />
          );
        })
      )}
    </div>
  );
};

// エフェクトカード
const EffectCard: React.FC<{
  name: string;
  color: string;
  delay: number;
  hidden?: boolean;
}> = ({ name, color, delay, hidden }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;

  const scale = spring({
    frame: f,
    fps,
    config: { damping: 14, stiffness: 240, mass: 0.7 },
    durationInFrames: 20,
  });
  const opacity = interpolate(f, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (f < 0) return <div style={{ width: TILE_W, height: TILE_H }} />;

  const glowAlpha = hidden
    ? 0
    : Math.round((0.5 + 0.2 * Math.sin((frame + delay) * 0.07)) * 255)
        .toString(16)
        .padStart(2, "0");

  return (
    <div
      style={{
        width: TILE_W,
        height: TILE_H,
        opacity,
        transform: `scale(${scale})`,
        border: `3px solid ${hidden ? "#2a2a3a" : color}`,
        background: hidden ? "rgba(255,255,255,0.02)" : `${color}12`,
        boxShadow: hidden ? "none" : `0 0 20px ${color}${glowAlpha}, inset 0 0 20px ${color}08`,
        display: "flex",
        alignItems: "center",
        gap: 32,
        padding: "0 36px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* コーナーアクセント */}
      {!hidden && (
        <>
          <div style={{ position: "absolute", top: 6, left: 6, width: 8, height: 8, background: color, opacity: 0.6 }} />
          <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: color, opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: 6, left: 6, width: 8, height: 8, background: color, opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: 6, right: 6, width: 8, height: 8, background: color, opacity: 0.6 }} />
        </>
      )}

      <PixelCluster color={color} frame={frame} delay={delay} hidden={hidden} />

      <span
        style={{
          fontFamily: pixelFont,
          fontSize: hidden ? 32 : 36,
          color: hidden ? "#444" : color,
          letterSpacing: 2,
        }}
      >
        {name}
      </span>
    </div>
  );
};

export const RareEffectScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagX = interpolate(frame, [3, 20], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagOpacity = interpolate(frame, [3, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(frame, [12, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [12, 34], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 表示済みエフェクト数カウント
  const visibleCount = Math.min(
    10,
    EFFECTS.filter((e) => !("hidden" in e && e.hidden) && frame >= e.delay + 8).length
  );

  return (
    <AbsoluteFill
      style={{
        background: "#0d0d1a",
        opacity: containerOpacity,
        overflow: "hidden",
      }}
    >
      {/* グリッド背景 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* グロー */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}14 0%, transparent 70%)`,
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <PixelParticles />

      {/* テキスト — 上部 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "88px 80px 0",
          zIndex: 10,
        }}
      >
        <div
          style={{
            opacity: tagOpacity,
            transform: `translateX(${tagX}px)`,
            display: "inline-flex",
            alignItems: "center",
            background: `${ACCENT}22`,
            border: `2px solid ${ACCENT}`,
            padding: "16px 36px",
            marginBottom: 28,
          }}
        >
          <span style={{ fontFamily: pixelFont, fontSize: 28, color: ACCENT, letterSpacing: 2 }}>
            FEATURE 02
          </span>
        </div>

        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            fontFamily: bodyFont,
            fontSize: 88,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          10種類以上の
          <br />
          エフェクト。
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: bodyFont,
              fontSize: 44,
              fontWeight: 400,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            ときどき、レア演出。
          </span>
        </div>
      </div>

      {/* エフェクトカードグリッド */}
      <div
        style={{
          position: "absolute",
          top: GRID_START,
          left: GRID_PADDING,
          right: GRID_PADDING,
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: GRID_GAP,
        }}
      >
        {EFFECTS.map((effect) => (
          <EffectCard
            key={effect.name + effect.delay}
            name={effect.name}
            color={effect.color}
            delay={effect.delay}
            hidden={"hidden" in effect ? effect.hidden : false}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
