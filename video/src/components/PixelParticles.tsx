import { interpolate, useCurrentFrame } from "remotion";

const PARTICLES = [
  { x: 80,  y: 200, color: "#ffd700", size: 12, speed: 0.8, delay: 0  },
  { x: 950, y: 300, color: "#ff6b35", size: 10, speed: 1.0, delay: 5  },
  { x: 150, y: 600, color: "#6c63ff", size: 14, speed: 0.6, delay: 10 },
  { x: 900, y: 700, color: "#00ff88", size: 8,  speed: 1.2, delay: 3  },
  { x: 60,  y: 1200,color: "#ff4d79", size: 12, speed: 0.9, delay: 8  },
  { x: 1000,y: 1100,color: "#ffd700", size: 16, speed: 0.7, delay: 2  },
  { x: 200, y: 1500,color: "#00eeff", size: 10, speed: 1.1, delay: 6  },
  { x: 850, y: 1400,color: "#ff6b35", size: 8,  speed: 0.8, delay: 12 },
  { x: 100, y: 1750,color: "#6c63ff", size: 14, speed: 1.0, delay: 4  },
  { x: 970, y: 1650,color: "#ffd700", size: 10, speed: 0.7, delay: 9  },
];

export const PixelParticles = () => {
  const frame = useCurrentFrame();

  return (
    <>
      {PARTICLES.map((p, i) => {
        const floatY = Math.sin((frame * p.speed * 0.05) + p.delay) * 20;
        const opacity = interpolate(frame, [p.delay, p.delay + 15], [0, 0.7], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y + floatY,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity,
              // ピクセルアート風の影
              boxShadow: `${p.size}px 0 0 ${p.color}, 0 ${p.size}px 0 ${p.color}`,
            }}
          />
        );
      })}
    </>
  );
};
