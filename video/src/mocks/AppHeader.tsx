// アプリのヘッダー部分（タブ含む）の共通コンポーネント
import React from "react";
import { pd } from "./appTokens";

type Tab = { label: string; count?: number; active?: boolean };

export const AppHeader: React.FC<{ tabs: Tab[] }> = ({ tabs }) => (
  <div
    style={{
      background: pd.color.surface,
      borderBottom: `2px solid ${pd.color.border}`,
      paddingTop: 44, // ノッチ分
      flexShrink: 0,
    }}
  >
    {/* タイトル行 */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px 8px",
      }}
    >
      <span
        style={{
          fontFamily: pd.font.pixel,
          fontSize: 13,
          color: pd.color.textPrimary,
          letterSpacing: "0.04em",
        }}
      >
        PixDone
      </span>
      <div
        style={{
          border: `2px solid ${pd.color.accent}`,
          padding: "3px 10px",
          boxShadow: pd.shadow.pixelSm,
        }}
      >
        <span
          style={{
            fontFamily: pd.font.pixel,
            fontSize: 8,
            color: pd.color.accent,
            letterSpacing: "0.04em",
          }}
        >
          SIGN UP
        </span>
      </div>
    </div>

    {/* タブ行 */}
    <div
      style={{
        display: "flex",
        gap: 0,
        overflowX: "hidden",
        padding: "0 16px",
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.label}
          style={{
            padding: "7px 14px",
            borderBottom: tab.active
              ? `3px solid ${pd.color.accent}`
              : "3px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              fontFamily: pd.font.body,
              fontSize: 12,
              fontWeight: tab.active ? 700 : 400,
              color: tab.active ? pd.color.accent : pd.color.textMuted,
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </span>
          {tab.count !== undefined && tab.count > 0 && (
            <span
              style={{
                background: tab.active ? pd.color.accent : pd.color.border,
                color: tab.active ? "#fff" : pd.color.textSecondary,
                fontFamily: pd.font.pixel,
                fontSize: 7,
                padding: "2px 5px",
                minWidth: 16,
                textAlign: "center",
              }}
            >
              {tab.count}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);
