import React from "react";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";

type Props = {
  videoFile?: string; // public/ 内のファイル名 (未指定時はmockを表示)
  mock?: React.ReactNode;
};

export const PHONE_W = 720;
export const PHONE_H = 1440;

export const PhoneFrame: React.FC<Props> = ({ videoFile, mock }) => {
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 64,
        border: "10px solid #2a2a3a",
        background: "#000",
        overflow: "hidden",
        position: "relative",
        boxShadow:
          "0 0 0 3px #444, 0 40px 120px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.5)",
        flexShrink: 0,
      }}
    >
      {/* ノッチ */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 160,
          height: 36,
          background: "#111",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          zIndex: 10,
        }}
      />

      {videoFile ? (
        <Video
          src={staticFile(videoFile)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "#0d0d1a" }}>
          {mock}
        </div>
      )}
    </div>
  );
};
