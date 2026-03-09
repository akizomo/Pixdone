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

export const Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.8 },
    durationInFrames: 28,
  });

  const catchOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const catchY = interpolate(frame, [20, 40], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaScale = spring({
    frame: frame - 35,
    fps,
    config: { damping: 10, stiffness: 260, mass: 0.7 },
    durationInFrames: 22,
  });
  const ctaOpacity = interpolate(frame, [35, 52], [0, 1], {
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
        gap: 56,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(108,99,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <PixelParticles />

      {/* ロゴ — 横長なのでheightのみ指定 */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          zIndex: 1,
        }}
      >
        <Img
          src={staticFile("logo-white.png")}
          style={{
            height: 110,
            width: "auto",
            filter: "drop-shadow(0 0 28px rgba(108,99,255,0.9))",
          }}
        />
      </div>

      {/* キャッチコピー */}
      <div
        style={{
          opacity: catchOpacity,
          transform: `translateY(${catchY}px)`,
          textAlign: "center",
          padding: "0 80px",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 80,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.2,
            letterSpacing: -2,
          }}
        >
          タスクを、ゲームに。
        </div>
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 44,
            fontWeight: 400,
            color: "rgba(255,255,255,0.55)",
            marginTop: 16,
          }}
        >
          Work becomes your favorite game.
        </div>
      </div>

      {/* CTAボタン */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          background: "linear-gradient(135deg, #6c63ff, #3ecfcf)",
          padding: "24px 72px",
          zIndex: 1,
          boxShadow: "6px 6px 0 #3a3070",
        }}
      >
        <span
          style={{
            fontFamily: pixelFont,
            fontSize: 20,
            color: "#fff",
            letterSpacing: 2,
          }}
        >
          FREE DOWNLOAD
        </span>
      </div>

    </AbsoluteFill>
  );
};
