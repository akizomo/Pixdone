import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { pixelFont } from "../fonts";

type Props = {
  label: string;
  color?: string;
  fromFrame?: number;
};

export const PixelScore: React.FC<Props> = ({
  label,
  color = "#ffd700",
  fromFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - fromFrame;

  const opacity = interpolate(f, [0, 8, 40, 50], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(f, [0, 50], [0, -100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = spring({
    frame: f,
    fps,
    config: { damping: 10, stiffness: 300, mass: 0.5 },
    durationInFrames: 15,
  });

  if (f < 0) return null;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        fontFamily: pixelFont,
        fontSize: 52,
        color,
        textShadow: `4px 4px 0 #000, -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000`,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
};
