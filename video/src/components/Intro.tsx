import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { bodyFont, pixelFont } from "../fonts";
import { PixelParticles } from "./PixelParticles";

type Props = {
  line1?: string;
  line2?: string;
};

export const Intro = ({
  line1 = "タスクを終わらせる。",
  line2 = "ちょっと楽しい。",
}: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [0, 12], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line2Opacity = interpolate(frame, [18, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Scale = spring({
    frame: frame - 18,
    fps,
    config: { damping: 10, stiffness: 220, mass: 0.8 },
    durationInFrames: 20,
  });

  const logoOpacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = spring({
    frame: frame - 45,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.8 },
    durationInFrames: 25,
  });

  const bgGlow = interpolate(frame, [30, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#0d0d1a",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 48,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(108,99,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: bgGlow,
        }}
      />

      <PixelParticles />

      {/* フック */}
      <div style={{ textAlign: "center", zIndex: 1, padding: "0 80px" }}>
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            fontFamily: bodyFont,
            fontSize: 88,
            fontWeight: 900,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: -2,
            marginBottom: 16,
          }}
        >
          {line1}
        </div>
        <div
          style={{
            opacity: line2Opacity,
            transform: `scale(${line2Scale})`,
            fontFamily: bodyFont,
            fontSize: 112,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: -3,
          }}
        >
          {line2}
        </div>
      </div>

      {/* ロゴ — 横長なのでheightのみ指定 */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          zIndex: 1,
        }}
      >
        <Img
          src={staticFile("logo-white.png")}
          style={{
            height: 90,
            width: "auto",
            filter: "drop-shadow(0 0 24px rgba(108,99,255,0.8))",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
