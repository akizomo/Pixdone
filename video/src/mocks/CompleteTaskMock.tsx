import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { pd } from "./appTokens";
import { AppHeader } from "./AppHeader";

// 各タスクの完了フレーム
const TASKS = [
  { id: "1", title: "Morning workout 🏃", doneAt: 25  },
  { id: "2", title: "Review PR #24",       doneAt: 65  },
  { id: "3", title: "Buy groceries 🛒",    doneAt: 105 },
  { id: "4", title: "Prepare presentation",doneAt: 999 },
];

// ピクセルバースト (チェック時)
const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const BURST_COLORS = ["#F5B82E", "#7B61FF", "#35C26B", "#F45CCB", "#F5B82E", "#43CBEA", "#7B61FF", "#F5B82E"];

const Burst: React.FC<{ triggerFrame: number }> = ({ triggerFrame }) => {
  const frame = useCurrentFrame();
  const f = frame - triggerFrame;
  if (f < 0 || f > 30) return null;

  return (
    <>
      {BURST_ANGLES.map((angle, i) => {
        const dist = interpolate(f, [0, 28], [0, 28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const rad = (angle * Math.PI) / 180;
        const opacity = interpolate(f, [0, 4, 22, 30], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 18 + Math.cos(rad) * dist,
              top: 10 + Math.sin(rad) * dist,
              width: 6,
              height: 6,
              background: BURST_COLORS[i],
              opacity,
            }}
          />
        );
      })}
    </>
  );
};

export const CompleteTaskMock = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const completedCount = TASKS.filter((t) => frame >= t.doneAt).length;
  const xp = completedCount * 100;

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
          { label: "My Tasks", count: Math.max(0, 4 - completedCount), active: true },
          { label: "Work",     count: 2 },
          { label: "💥",       count: 3 },
        ]}
      />

      <div style={{ flex: 1, padding: "8px 12px 12px", overflowY: "hidden" }}>
        {/* セクションタイトル + XP */}
        <div
          style={{
            padding: "8px 4px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: pd.font.pixel, fontSize: 9, color: pd.color.textPrimary, letterSpacing: "0.04em" }}>
            MY TASKS
          </span>
          <span style={{ fontFamily: pd.font.pixel, fontSize: 8, color: pd.color.yellow }}>
            {xp > 0 ? `+${xp} XP` : "0 XP"}
          </span>
        </div>

        {/* タスクリスト */}
        {TASKS.map((task) => {
          const isDone = frame >= task.doneAt;
          const checkScale = spring({
            frame: frame - task.doneAt,
            fps,
            config: { damping: 8, stiffness: 350, mass: 0.4 },
            durationInFrames: 10,
          });

          return (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                marginBottom: 6,
                border: `2px solid ${isDone ? pd.color.success : pd.color.border}`,
                background: isDone ? "rgba(53,194,107,0.06)" : pd.color.surface,
                boxShadow: isDone ? pd.shadow.rewardGreen : pd.shadow.pixelSm,
                position: "relative",
                overflow: "visible",
              }}
            >
              {/* チェックボックス */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: `2px solid ${isDone ? pd.color.success : pd.color.border}`,
                  background: isDone ? pd.color.success : "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${isDone ? checkScale : 1})`,
                  position: "relative",
                }}
              >
                {isDone && (
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>
                )}
                {isDone && <Burst triggerFrame={task.doneAt} />}
              </div>

              <span
                style={{
                  fontFamily: pd.font.body,
                  fontSize: 13,
                  color: isDone ? pd.color.textMuted : pd.color.textPrimary,
                  textDecoration: isDone ? "line-through" : "none",
                }}
              >
                {task.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
