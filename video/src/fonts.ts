// フォントをシステムフォントにフォールバック（デバッグ用）
export const pixelFont = "'Courier New', monospace";
export const bodyFont = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

// Google Fonts版（動作確認後に有効化）
// import { loadFont as loadPixelFont } from "@remotion/google-fonts/PressStart2P";
// import { loadFont as loadBodyFont } from "@remotion/google-fonts/NotoSansJP";
// export const { fontFamily: pixelFont } = loadPixelFont();
// export const { fontFamily: bodyFont } = loadBodyFont("normal", {
//   weights: ["400", "700", "900"],
//   subsets: ["latin", "japanese"],
// });
