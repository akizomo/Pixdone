import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";

import { Intro } from "./components/Intro";
import { FeatureScene } from "./components/FeatureScene";
import { RareEffectScene } from "./components/RareEffectScene";
import { Outro } from "./components/Outro";

// タイムライン (合計 600fr = 20s @ 30fps)
// TransitionSeries: 各トランジション15frで合計-60fr
// シーン合計: 90+175+175+145+75 = 660 → 660-60 = 600 ✓
const TRANSITION_FRAMES = 15;

const transitionTiming = springTiming({
  config: { damping: 200 },
  durationInFrames: TRANSITION_FRAMES,
});

export const PixDonePromo = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={600} layout="none">
        <Audio src={staticFile("bgm.mp3")} volume={0.4} loop />
      </Sequence>
      <TransitionSeries>
        {/* Intro: 3s */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <Intro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={transitionTiming}
        />

        {/* タスク完了シーン: ~5.8s */}
        <TransitionSeries.Sequence durationInFrames={175}>
          <FeatureScene
            accentColor="#6c63ff"
            tagLabel="FEATURE 01"
            headline="終わるたびに"
            subtext="小さなご褒美。"
            videoFile="CompleteTask.mp4"
            scoreLabel="+100 XP"
            scoreFromFrame={55}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={transitionTiming}
        />

        {/* レア演出シーン: ~5.8s */}
        <TransitionSeries.Sequence durationInFrames={175}>
          <RareEffectScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={transitionTiming}
        />

        {/* スマッシュリストシーン: ~4.8s */}
        <TransitionSeries.Sequence durationInFrames={145}>
          <FeatureScene
            accentColor="#ff6b35"
            tagLabel="FEATURE 03"
            headline="スマッシュリスト。"
            subtext="管理すら不要。ただ、潰す。"
            videoFile="Smashlist.mp4"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Outro: 2.5s */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
