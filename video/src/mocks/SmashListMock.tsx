import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { pd } from "./appTokens";
import { AppHeader } from "./AppHeader";

const TASKS = [
  "Fix the bug 🐛",
  "Reply to emails",
  "Update docs",
];

export const SmashListMock = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1枚目をスマッシュ (frame 50)
  const card1X = interpolate(frame, [50, 72], [0, 500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card1Opacity = interpolate(frame, [50, 68], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2枚目が前に出る
  const card2Scale = interpolate(frame, [50, 68], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card2Y = interpolate(frame, [50, 68], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // SMASH! ラベル
  const smashScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 6, stiffness: 500, mass: 0.3 },
    durationInFrames: 8,
  });
  const smashOpacity = interpolate(frame, [50, 54, 78, 88], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: pd.color.pageBg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <AppHeader
        tabs={[
          { label: "My Tasks", count: 3 },
          { label: "Work",     count: 2 },
          { label: "💥",       count: 3, active: true },
        ]}
      />

      <div style={{ flex: 1, padding: "8px 12px 12px", overflowY: "hidden", position: "relative" }}>
        {/* セクションタイトル */}
        <div style={{ padding: "8px 4px 10px" }}>
          <span style={{ fontFamily: pd.font.pixel, fontSize: 9, color: pd.color.textPrimary, letterSpacing: "0.04em" }}>
            💥 SMASH LIST
          </span>
        </div>

        {/* スマッシュバナー */}
        <div
          style={{
            border: `2px solid ${pd.color.smashBorder}`,
            background: "linear-gradient(135deg, rgba(255,156,150,0.12), rgba(244,92,203,0.08))",
            padding: "10px 12px",
            marginBottom: 16,
            boxShadow: pd.shadow.pixelSm,
          }}
        >
          <div style={{ fontFamily: pd.font.body, fontSize: 12, fontWeight: 700, color: pd.color.smashBorder, lineHeight: 1.4 }}>
            今日やることに集中！
          </div>
          <div style={{ fontFamily: pd.font.body, fontSize: 11, color: pd.color.textMuted, marginTop: 3 }}>
            タップしてタスクをスマッシュ 💥
          </div>
        </div>

        {/* カードスタック */}
        <div style={{ position: "relative", height: 200 }}>
          {/* 3枚目 (奥) */}
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 8,
              right: 8,
              padding: "12px 14px",
              border: `2px solid ${pd.color.border}`,
              background: pd.color.surface,
              opacity: 0.45,
            }}
          >
            <span style={{ fontFamily: pd.font.body, fontSize: 13, color: pd.color.textMuted }}>
              {TASKS[2]}
            </span>
          </div>

          {/* 2枚目 */}
          <div
            style={{
              position: "absolute",
              top: card2Y + 14,
              left: 4,
              right: 4,
              padding: "12px 14px",
              border: `2px solid ${pd.color.border}`,
              background: pd.color.surface,
              transform: `scale(${card2Scale})`,
              transformOrigin: "center top",
              boxShadow: pd.shadow.pixelSm,
              opacity: 0.75,
            }}
          >
            <span style={{ fontFamily: pd.font.body, fontSize: 13, color: pd.color.textSecondary }}>
              {TASKS[1]}
            </span>
          </div>

          {/* 1枚目 (手前) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "12px 14px",
              border: `2px solid ${pd.color.accent}`,
              background: pd.color.surface,
              transform: `translateX(${card1X}px)`,
              opacity: card1Opacity,
              boxShadow: `${pd.shadow.rewardPurple}, ${pd.shadow.pixelMd}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontFamily: pd.font.body, fontSize: 14, fontWeight: 700, color: pd.color.textPrimary }}>
              {TASKS[0]}
            </span>
            <div
              style={{
                width: 26,
                height: 26,
                background: pd.color.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: pd.shadow.pixelSm,
              }}
            >
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>
            </div>
          </div>
        </div>

        {/* SMASH! テキスト */}
        {frame >= 50 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${smashScale})`,
              opacity: smashOpacity,
              fontFamily: pd.font.pixel,
              fontSize: 22,
              color: pd.color.yellow,
              textShadow: `2px 2px 0 ${pd.color.smashBorder}`,
              whiteSpace: "nowrap",
              letterSpacing: "0.04em",
              pointerEvents: "none",
            }}
          >
            SMASH!
          </div>
        )}
      </div>
    </div>
  );
};
