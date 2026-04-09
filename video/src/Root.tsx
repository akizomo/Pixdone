import { Composition } from "remotion";
import { PixDonePromo } from "./PixDonePromo";
import { PixDonePromoEN } from "./PixDonePromoEN";

// 縦型 9:16 (TikTok / X / Instagram Reels 対応)
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_SEC = 20;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PixDonePromo"
        component={PixDonePromo}
        durationInFrames={DURATION_SEC * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="PixDonePromoEN"
        component={PixDonePromoEN}
        durationInFrames={DURATION_SEC * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
