import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { pixelFont, bodyFont } from "../fonts";

// エフェクト定義 (10種 + 隠し2種)
const EFFECTS = [
  { name: "RAINBOW",   color: "#ff6ec7", delay: 4  },
  { name: "FREEZE",    color: "#00eeff", delay: 10 },
  { name: "LIGHTNING", color: "#ffd700", delay: 16 },
  { name: "FIRE",      color: "#ff6b35", delay: 22 },
  { name: "CRYSTAL",   color: "#7fffaa", delay: 28 },
  { name: "VORTEX",    color: "#b06aff", delay: 34 },
  { name: "STAR",      color: "#fff066", delay: 40 },
  { name: "BLOOM",     color: "#ff9de2", delay: 46 },
  { name: "MEGA",      color: "#ff4040", delay: 52 },
  { name: "WAVE",      color: "#40c4ff", delay: 58 },
  { name: "???",       color: "#888",    delay: 70, hidden: true },
  { name: "???",       color: "#666",    delay: 80, hidden: true },
] as const;

// ピクセルドット (各タイルの装飾)
const PixelDot: React.FC<{ color: string; frame: number; delay: number; hidden?: boolean }> = ({
  color,
  frame,
  delay,
  hidden,
}) => {
  const f = frame - delay;
  if (f < 0) return null;

  const DOTS = [
    { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 8, y: 0 },
    { x: 0, y: 4 }, { x: 8, y: 4 },
    { x: 0, y: 8 }, { x: 4, y: 8 }, { x: 8, y: 8 },
  ];

  return (
    <div style={{ position: "relative", width: 12, height: 12 }}>
      {DOTS.map((d, i) => {
        const blink = hidden
          ? 0.3 + 0.2 * Math.sin((frame + i * 7) * 0.15)
          : interpolate(f, [i * 2, i * 2 + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: d.x,
              top: d.y,
              width: 3,
              height: 3,
              background: hidden ? "#666" : color,
              opacity: blink,
            }}
          />
        );
      })}
    </div>
  );
};

// エフェクトタイル
const EffectTile: React.FC<{
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
    config: { damping: 12, stiffness: 260, mass: 0.6 },
    durationInFrames: 18,
  });

  const opacity = interpolate(f, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (f < 0) return <div style={{ width: "100%", height: 72 }} />;

  const glowOpacity = hidden
    ? 0.3 + 0.15 * Math.sin(frame * 0.1)
    : 0.6 + 0.2 * Math.sin((frame + delay) * 0.08);

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        height: 72,
        border: `2px solid ${hidden ? "#333" : color}`,
        background: hidden ? "rgba(255,255,255,0.02)" : `${color}14`,
        boxShadow: hidden
          ? "none"
          : `0 0 12px ${color}${Math.round(glowOpacity * 99).toString(16).padStart(2, "0")}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* コーナーアクセント */}
      {!hidden && (
        <>
          <div style={{ position: "absolute", top: 3, left: 3, width: 4, height: 4, background: color, opacity: 0.7 }} />
          <div style={{ position: "absolute", bottom: 3, right: 3, width: 4, height: 4, background: color, opacity: 0.7 }} />
        </>
      )}

      <PixelDot color={color} frame={frame} delay={delay} hidden={hidden} />

      <span
        style={{
          fontFamily: pixelFont,
          fontSize: hidden ? 9 : 8,
          color: hidden ? "#555" : color,
          letterSpacing: 0.5,
        }}
      >
        {name}
      </span>
    </div>
  );
};

export const RareEffectMock: React.FC = () => {
  const frame = useCurrentFrame();

  // ヘッダーのフェードイン
  const headerOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "10+ EFFECTS" カウントアップ
  const effectCount = Math.min(
    10,
    EFFECTS.filter((e) => !e.hidden && frame >= e.delay + 8).length
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0d0d1a",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px 16px",
        gap: 14,
        overflow: "hidden",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          opacity: headerOpacity,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: pixelFont,
            fontSize: 8,
            color: "#6c63ff",
            letterSpacing: 2,
          }}
        >
          RARE EFFECTS
        </div>
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 26,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: -0.5,
          }}
        >
          {effectCount > 0 ? `${effectCount}+` : ""}
          {effectCount > 0 && (
            <span style={{ fontWeight: 400, fontSize: 18, color: "rgba(255,255,255,0.5)" }}>
              {" "}種類
            </span>
          )}
        </div>
      </div>

      {/* エフェクトグリッド (2列) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          flex: 1,
        }}
      >
        {EFFECTS.map((effect) => (
          <EffectTile
            key={effect.name + effect.delay}
            name={effect.name}
            color={effect.color}
            delay={effect.delay}
            hidden={"hidden" in effect ? effect.hidden : false}
          />
        ))}
      </div>
    </div>
  );
};
