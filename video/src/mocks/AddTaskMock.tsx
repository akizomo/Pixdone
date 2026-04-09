import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { pd } from "./appTokens";
import { AppHeader } from "./AppHeader";

const TASKS = [
  { id: "1", title: "Morning workout 🏃", completed: false },
  { id: "2", title: "Review PR #24",       completed: false },
  { id: "3", title: "Buy groceries 🛒",    completed: false },
  { id: "4", title: "Call dentist",         completed: false },
];

const TYPING_TEXT = "Prepare presentation";

export const AddTaskMock = () => {
  const frame = useCurrentFrame();

  // "Add a task" ボタンがハイライトされる (frame 20~40)
  const addBtnActive = frame >= 20 && frame < 70;

  // タイピングアニメーション (frame 40~110)
  const charCount = Math.floor(
    interpolate(frame, [40, 110], [0, TYPING_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const showInput = frame >= 30;

  const inputGlow = interpolate(frame, [30, 45], [0, 1], {
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
          { label: "My Tasks", count: 4, active: true },
          { label: "Work",     count: 2 },
          { label: "💥",       count: 3 },
        ]}
      />

      <div style={{ flex: 1, overflowY: "hidden", padding: "8px 12px 12px" }}>
        {/* セクションタイトル */}
        <div
          style={{
            padding: "8px 4px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: pd.font.pixel,
              fontSize: 9,
              color: pd.color.textPrimary,
              letterSpacing: "0.04em",
            }}
          >
            MY TASKS
          </span>
          <span style={{ fontFamily: pd.font.pixel, fontSize: 7, color: pd.color.textMuted }}>
            4 left
          </span>
        </div>

        {/* 入力エリア or Add ボタン */}
        {!showInput ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              marginBottom: 8,
              border: `2px solid ${addBtnActive ? pd.color.accent : pd.color.border}`,
              background: pd.color.surface,
              boxShadow: addBtnActive ? pd.shadow.rewardPurple : pd.shadow.pixelSm,
            }}
          >
            <span style={{ fontSize: 14, color: pd.color.textMuted }}>+</span>
            <span
              style={{
                fontFamily: pd.font.body,
                fontSize: 13,
                color: pd.color.textMuted,
              }}
            >
              Add a task
            </span>
          </div>
        ) : (
          <div
            style={{
              padding: "10px 12px",
              marginBottom: 8,
              border: `2px solid ${pd.color.accent}`,
              background: pd.color.surface,
              boxShadow: `${pd.shadow.rewardPurple}, ${pd.shadow.pixelSm}`,
            }}
          >
            <span style={{ fontFamily: pd.font.body, fontSize: 13, color: pd.color.textPrimary }}>
              {TYPING_TEXT.slice(0, charCount)}
            </span>
            <span
              style={{
                display: "inline-block",
                width: 1.5,
                height: 13,
                background: pd.color.accent,
                marginLeft: 1,
                opacity: Math.floor(frame / 7) % 2 === 0 ? 1 : 0,
                verticalAlign: "middle",
              }}
            />
          </div>
        )}

        {/* タスクリスト */}
        {TASKS.map((task) => (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              marginBottom: 6,
              border: `2px solid ${pd.color.border}`,
              background: pd.color.surface,
              boxShadow: pd.shadow.pixelSm,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                border: `2px solid ${pd.color.border}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: pd.font.body,
                fontSize: 13,
                color: pd.color.textPrimary,
              }}
            >
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
