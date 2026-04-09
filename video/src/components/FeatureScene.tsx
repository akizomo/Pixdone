import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { bodyFont, pixelFont } from "../fonts";
import { PhoneFrame } from "./PhoneFrame";
import { PixelParticles } from "./PixelParticles";
import { PixelScore } from "./PixelScore";

// テキストエリアの高さ (上から何pxまでテキスト)
const TEXT_AREA_H = 480;

type Props = {
  accentColor: string;
  tagLabel: string;
  headline: string;
  subtext: string;
  videoFile?: string;
  mock?: React.ReactNode;
  scoreLabel?: string;
  scoreFromFrame?: number;
};

export const FeatureScene: React.FC<Props> = ({
  accentColor,
  tagLabel,
  headline,
  subtext,
  videoFile,
  mock,
  scoreLabel,
  scoreFromFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // フォンがy方向から上昇しながら表示
  const phoneY = interpolate(frame, [0, 35], [280, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phoneOpacity = interpolate(frame, [0, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // テキストのフェードイン
  const textOpacity = interpolate(frame, [12, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [12, 34], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // タグのスライドイン
  const tagX = interpolate(frame, [3, 20], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagOpacity = interpolate(frame, [3, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#0d0d1a",
        opacity: containerOpacity,
        overflow: "hidden",
      }}
    >
      {/* ピクセルグリッド */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* アクセントグロー */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <PixelParticles />

      {/* フォン — 画面下部を占有 */}
      <div
        style={{
          position: "absolute",
          top: TEXT_AREA_H + phoneY,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: phoneOpacity,
          boxShadow: `0 0 120px ${accentColor}55`,
          borderRadius: 64,
        }}
      >
        <div style={{ position: "relative" }}>
          <PhoneFrame videoFile={videoFile} mock={mock} />

          {scoreLabel && scoreFromFrame !== undefined && (
            <div
              style={{
                position: "absolute",
                top: 120,
                right: -40,
                zIndex: 20,
              }}
            >
              <PixelScore
                label={scoreLabel}
                color="#ffd700"
                fromFrame={scoreFromFrame}
              />
            </div>
          )}
        </div>
      </div>

      {/* テキストエリアのグラデーション（フォンとの境界をなじませる） */}
      <div
        style={{
          position: "absolute",
          top: TEXT_AREA_H - 60,
          left: 0,
          right: 0,
          height: 220,
          background: "linear-gradient(to bottom, #0d0d1a 30%, transparent)",
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* テキスト — 画面上部 */}
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
        {/* フィーチャータグ */}
        <div
          style={{
            opacity: tagOpacity,
            transform: `translateX(${tagX}px)`,
            display: "inline-flex",
            alignItems: "center",
            background: `${accentColor}22`,
            border: `2px solid ${accentColor}`,
            padding: "12px 28px",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontFamily: pixelFont,
              fontSize: 15,
              color: accentColor,
              letterSpacing: 2,
            }}
          >
            {tagLabel}
          </span>
        </div>

        {/* ヘッドライン */}
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            fontFamily: bodyFont,
            fontSize: 96,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.05,
            marginBottom: 20,
            textShadow: `4px 4px 0 ${accentColor}44`,
          }}
        >
          {headline}
        </div>

        {/* サブテキスト */}
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            fontFamily: bodyFont,
            fontSize: 48,
            fontWeight: 400,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.4,
          }}
        >
          {subtext}
        </div>
      </div>
    </AbsoluteFill>
  );
};
