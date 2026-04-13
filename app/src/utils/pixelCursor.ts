/**
 * Pixel-art cursors built at runtime with Canvas.
 *
 * Desktop only. Canvas is 16×16 (OS default cursor size).
 *
 * How it works:
 *  1. We draw 10 cursors (default, pointer, text, not-allowed, wait, help,
 *     grab, grabbing, move, crosshair) as data URLs.
 *  2. We install a universal CSS rule — `* { cursor: var(--pd-cursor) !important }`
 *     — so our value wins over any component CSS such as `.task-item { cursor: pointer }`.
 *  3. On every `mouseover` we look up the element's *native* computed cursor
 *     (temporarily disabling our override so the real value shows through),
 *     map the keyword to one of our 10 kinds, and write the matching data URL
 *     into `--pd-cursor`. Reading native cursor this way means we pick up
 *     every element that has a cursor set via component CSS, without having
 *     to enumerate selectors.
 *
 * The spec uses `--theme-bg` / `--theme-color-primary`; this project exposes
 * them as `--pd-color-background-default` / `--pd-color-accent-default`, so
 * we read those with safe fallbacks.
 */

type Colors = { fill: string; outline: string };
type CursorKind =
  | 'default'
  | 'pointer'
  | 'text'
  | 'notAllowed'
  | 'wait'
  | 'help'
  | 'grab'
  | 'grabbing'
  | 'move'
  | 'crosshair';

// Match the "medium purple pixel cursor" reference: purple fill + high-
// contrast outline. Outline uses text-primary so it stays visible on both
// light and dark themes (dark outline on light bg, light outline on dark bg).
const FILL_VAR = '--pd-color-accent-default';
const OUTLINE_VAR = '--pd-color-text-primary';
const FILL_FALLBACK = '#A78BFA';
const OUTLINE_FALLBACK = '#202124';

const STYLE_ELEMENT_ID = 'pd-pixel-cursor-style';
const CSS_VAR = '--pd-cursor';

// Pixel-art feel: default 10×10 "logical" grid rendered at 2 canvas px per
// cell. Each grid cell paints as a chunky 2×2 block so pixels are visible.
// Individual cursors can override the grid size via GRID_DIMS below.
const GRID_SIZE = 10;
const CELL = 2;

// The default arrow comes from cursor.svg — a hand-authored pixel-art
// shape the user supplied. We embed the path data here and rebuild it as
// an SVG data URL each time colors change, so the cursor re-themes without
// a round trip to disk. Width/height are chosen to preserve the 163:277
// viewBox aspect at an OS-like size.
const ARROW_SVG_VIEW_W = 163;
const ARROW_SVG_VIEW_H = 277;
// Target OS default cursor size (~16 CSS px). Arrow aspect is 163:277 (tall),
// so width 10 → height 17, close to 16.
const ARROW_RENDER_W = 10;
const ARROW_RENDER_H = Math.round(ARROW_RENDER_W * ARROW_SVG_VIEW_H / ARROW_SVG_VIEW_W); // 17

const ARROW_OUTLINE_PATH =
  'M0 0.117393C8.63709 0.262193 17.8007 0.117107 26.4499 0C26.1201 3.9338 26.385 9.1188 26.5184 13.1009C30.9569 13.0439 37.2522 12.9074 41.5354 13.3288C41.4326 17.5302 41.1422 21.7892 41.0362 26.0467C45.3283 26.0301 49.6201 26.0584 53.9113 26.1313C53.9027 29.1693 54.0307 36.4033 53.5964 39.043C58.6835 38.8963 62.6082 39.1723 67.6033 39.6542C67.7504 43.1407 68.1009 49.1702 67.5562 52.3902C71.0269 52.931 77.8933 52.8155 81.4303 52.6016C81.1052 57.3524 81.2736 61.7047 81.5159 66.4265C85.5228 66.1107 90.3491 66.254 94.4461 66.2804C94.32 70.7307 94.3098 75.1836 94.4158 79.6346C99.3972 79.4503 102.645 79.1689 107.66 79.3459C107.847 83.6208 108.06 88.1125 108.045 92.3766C112.447 92.0335 116.425 92.1961 120.82 92.3292C121.258 95.8542 121.332 101.899 121.043 105.491C125.008 105.102 129.889 105.422 134.037 105.313C134.248 108.198 134.267 116.64 134.092 119.484C136.318 118.673 144.766 119.393 147.637 119.56L148.044 119.881L147.891 120.553C147.88 122.1 147.617 131.042 148.249 131.824C152.409 132.291 157.455 132.76 161.616 132.734C161.934 136.822 162.751 157.849 161.354 160.674C156.64 161.04 151.704 160.597 146.938 160.55L124.811 160.545C119.506 160.549 113.469 160.425 108.25 160.78C108.277 162.48 108.337 164.081 108.155 165.777C108.096 170.55 107.915 176.043 108.236 180.742C111.331 180.811 115.965 181.003 118.947 180.771C120.161 180.801 120.93 180.835 122.132 180.675L122.069 185.788C121.369 192.641 120.786 200.087 122.413 206.835L122.644 207.087C126.51 207.234 130.378 207.32 134.247 207.344C134.829 212.157 135.67 217.306 135.549 222.132C135.433 226.75 134.814 231.221 134.722 235.902C139.095 235.946 143.469 235.965 147.842 235.96C147.807 244.878 147.827 253.795 147.902 262.713C142.941 262.491 140.44 262.73 135.552 263.4C136.239 266.78 135.833 272.747 135.657 276.302L106.968 276.363C107.151 272.821 106.808 266.663 106.742 262.891C102.962 262.988 97.2633 262.505 93.9819 262.852C94.4786 254.616 93.6957 245.091 94.229 236.55C89.9674 236.395 84.8804 236.805 80.7194 236.126C80.3339 236.063 79.6997 235.785 79.643 235.413C78.9802 231.07 78.85 212.36 79.8146 209.049C75.8198 208.683 70.4383 208.865 66.2882 208.83C66.0857 201.104 65.9676 190.405 66.3219 182.753C60.0002 183.422 47.4126 182.932 40.6822 182.705C40.8582 186.131 40.5962 190.677 40.6637 194.417C36.2064 194.486 32.2816 194.757 27.83 195.099C27.6731 199.185 27.5734 203.273 27.5308 207.362C22.2403 206.933 5.51367 207.014 0.0859632 207.239L0.0595369 81.6196L0.0608097 34.3371C0.0916905 23.1987 0.282066 11.2012 0 0.117393Z';
const ARROW_FILL_PATH =
  'M13.085 13.2996C17.5385 13.2452 22.0675 13.285 26.5277 13.2821C26.7244 17.1996 26.5828 22.1567 26.5649 26.1569C31.3371 26.2527 35.9613 26.1263 40.7673 26.3578C40.8519 30.4643 40.6861 35.1327 40.6304 39.2793C44.6197 39.4697 49.3932 39.3701 53.4418 39.3786C53.5545 43.5511 53.4077 48.3328 53.3737 52.5498C57.7861 52.7675 62.841 52.6348 67.3108 52.6045C67.3856 57.2099 67.2646 62.1154 67.228 66.7427C71.8697 66.8341 76.4502 66.7087 81.1368 66.864C81.3504 70.5841 81.197 76.0123 81.2062 79.8406C85.2796 79.705 90.2868 79.6541 94.3128 79.868C94.3647 84.1512 94.3888 88.4344 94.386 92.718L107.639 92.646C107.82 96.8325 107.726 101.719 107.744 105.958C112.067 105.867 116.392 105.826 120.717 105.834C120.683 110.424 120.707 115.014 120.788 119.602C124.806 119.36 129.619 119.455 133.705 119.451C134.234 122.674 134.042 129.305 134.026 132.749L147.683 132.737L147.683 146.716L94.9183 146.727L94.8855 180.833L107.942 180.822C108.347 188.661 108.308 199.843 108.319 207.831C112.551 207.784 116.783 207.794 121.015 207.86C121.459 211.199 121.335 215.726 121.333 219.182L121.302 236.101L134.244 236.187C134.575 239.665 134.591 244.921 134.708 248.536C134.863 253.254 134.993 257.972 135.1 262.692C126.831 263.099 115.142 262.96 106.785 262.716C106.29 255.254 106.658 244.168 106.724 236.483L94.3672 236.464C94.2013 227.312 94.4076 217.986 94.2796 208.768L80.7475 208.819C80.4208 200.393 80.6351 190.598 80.6249 182.1C75.8839 182.074 71.1426 182.145 66.4044 182.312C66.002 173.806 66.3099 163.055 66.3264 154.382L54.1161 154.382C54.0658 158.87 54.074 163.358 54.1412 167.845C49.4066 167.819 44.6719 167.874 39.9395 168.007C40.2585 172.276 40.1703 177.713 40.2057 182.079C35.7706 182.139 31.3349 182.14 26.8998 182.084C26.8317 185.848 26.7999 190.509 27.1265 194.2C22.4562 194.234 17.7852 194.222 13.1149 194.164L13.085 13.2996Z';

// Pointer hand SVG (pointer.svg). Same two-layer structure: outline + fill.
const POINTER_SVG_VIEW_W = 219;
const POINTER_SVG_VIEW_H = 277;
// Width 13 → height 16, close to the OS default 16×16.
const POINTER_RENDER_W = 13;
const POINTER_RENDER_H = Math.round(POINTER_RENDER_W * POINTER_SVG_VIEW_H / POINTER_SVG_VIEW_W); // 16

const POINTER_OUTLINE_PATH =
  'M62.7057 0.181025L89.7313 0C89.6103 4.35639 89.5816 8.71505 89.6517 13.0727C93.9049 13.0938 98.1582 13.0778 102.408 13.0244C102.217 27.6527 102.23 42.283 102.45 56.9111C110.472 57.2771 119.186 57.1536 127.25 57.0658C127.785 61.8987 127.676 66.7813 126.928 71.5859C131.828 70.8952 137.218 71.5582 142.175 71.3462C149.529 71.0314 157.465 71.7976 164.746 71.3516C164.979 75.2672 165.071 82.1157 164.663 85.9784C169.592 86.1252 186.544 86.5889 190.823 85.9313C191.065 90.3355 190.995 95.0662 190.998 99.5067C194.3 99.9361 201.112 99.8413 204.532 99.7448C204.503 103.912 204.544 108.079 204.653 112.244C208.782 112.052 213.557 112.432 217.537 112.041C217.457 118.909 217.572 125.865 217.626 132.74C217.75 148.804 218.804 163.966 217.734 180.066C217.674 183.571 218.097 200.061 217.568 201.734C216.788 202.155 216.502 202.085 215.604 202.042L204.567 202.154C204.309 213.478 204.497 225.206 204.484 236.576C200.141 236.485 196.095 236.765 191.813 236.74C191.011 249.76 191.332 263.215 191.374 276.296L113.229 276.461C98.0596 276.34 82.8897 276.352 67.7231 276.495C66.889 266.686 67.1628 256.982 67.1946 247.147C67.2042 244.291 67.166 241.541 67.5512 238.705C63.1483 238.736 59.0764 239.038 54.5111 238.995C54.5844 230.097 53.7025 223.008 54.2151 213.657C49.9523 213.953 43.0311 214.1 38.8829 213.669C38.3449 210.412 38.4913 193.648 38.7524 189.949C34.7378 189.58 30.37 189.698 26.3173 189.714C26.5369 185.942 26.4127 180.543 26.2504 176.761C26.0403 171.851 25.2762 169.559 25.9734 164.485C21.5323 164.381 17.088 164.355 12.6437 164.405C12.5259 160.215 12.5514 155.292 12.8634 151.144L0.138578 151.233C-0.36443 138.945 0.702055 124.82 0.199048 112.2C11.1283 112.582 25.6455 112.209 36.7244 112.035C36.4347 116.387 36.5525 122.078 36.6735 126.449C40.0099 126.085 46.0492 126.315 49.6562 126.366C50.2037 96.8087 49.3092 66.9853 49.6848 37.4023C49.7867 29.4417 49.8281 21.0704 49.5575 13.1374C52.0789 13.3821 59.9456 13.0648 62.8904 13.031C62.9254 9.048 63.0782 4.06227 62.7057 0.181025Z';
const POINTER_FILL_PATH =
  'M62.973 13.2913C71.2854 13.0271 81.059 13.2563 89.4701 13.3212C89.7184 17.2361 89.5465 22.7401 89.5369 26.7807L89.521 50.3683L89.5146 125.016L102.131 125.043C102.376 107.535 102.071 89.6236 102.166 72.0613C106.798 71.8602 122.248 71.7583 126.721 72.1629C127.253 89.1598 126.791 108.561 126.766 125.777L139.78 125.799L139.726 86.2864C147.778 86.2577 155.832 86.2737 163.883 86.3338C164.415 103.343 163.938 122.914 163.918 140.076L176.567 140.052C176.376 136.01 176.538 130.496 176.538 126.36L176.573 99.8764C181.008 99.6504 186.127 99.7243 190.616 99.6934L190.431 112.255C195.149 112.251 199.868 112.279 204.582 112.338C204.758 121.401 204.554 131.315 204.551 140.438L204.582 202.147L191.584 202.158L191.59 213.429L191.612 236.736C187.324 236.862 182.88 236.849 178.582 236.891L178.652 262.776L81.8867 262.843C81.7658 254.675 81.8358 246.315 81.8135 238.131C77.0349 238.141 72.4792 238.164 67.707 238.373C67.4078 230.131 67.4714 221.245 67.3855 212.954L54.4187 213.306L54.4314 189.711C49.274 189.748 44.1134 189.746 38.956 189.704C39.0674 181.708 39.3189 172.104 38.8764 164.225L26.6578 164.223L26.6991 150.933C22.0893 150.9 17.4795 150.963 12.8696 151.123C12.9811 142.989 12.9779 134.854 12.8696 126.72C20.6694 126.682 28.7462 126.543 36.5205 126.699C36.7466 130.674 36.6319 135.666 36.6383 139.719C40.9521 139.62 45.2659 139.609 49.5796 139.686C49.8216 150.875 49.6465 162.67 49.6688 173.916L62.9061 173.897C63.4028 157.629 62.9539 138.982 62.9539 122.564L62.973 13.2913Z';

function buildSvgUrl(
  outlinePath: string,
  fillPath: string,
  viewW: number,
  viewH: number,
  w: number,
  h: number,
  colors: Colors,
): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${viewW} ${viewH}" shape-rendering="crispEdges">` +
    `<path d="${outlinePath}" fill="${colors.outline}"/>` +
    `<path d="${fillPath}" fill="${colors.fill}"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildArrowSvgUrl(colors: Colors): string {
  return buildSvgUrl(
    ARROW_OUTLINE_PATH, ARROW_FILL_PATH,
    ARROW_SVG_VIEW_W, ARROW_SVG_VIEW_H,
    ARROW_RENDER_W, ARROW_RENDER_H,
    colors,
  );
}

function buildPointerSvgUrl(colors: Colors): string {
  return buildSvgUrl(
    POINTER_OUTLINE_PATH, POINTER_FILL_PATH,
    POINTER_SVG_VIEW_W, POINTER_SVG_VIEW_H,
    POINTER_RENDER_W, POINTER_RENDER_H,
    colors,
  );
}

// Bitmap language: ' ' = transparent, '#' = outline, '.' = fill.
// Each row up to GRID_SIZE chars wide. Shorter rows pad with transparent.
const GRIDS: Record<CursorKind, string> = {
  default: `
#
##
#.#
#..#
#...#
#....#
#.####
#.#
##
#
`,

  pointer: `
   ##
   #.#
   #.#
   #.#  ##
   #.##.#
###.....#
#.......#
 #.....#
  #...#
   ###
`,

  // I-beam at 5×8 grid → 10×16 canvas (OS-default height).
  text: `
## ##
#...#
 #.#
 #.#
 #.#
 #.#
#...#
## ##
`,

  notAllowed: `
   ####
  #.###.#
 #.###..#
#.###...#
#.##....#
#...##..#
 #...##.#
  #...##
   ####
`,

  wait: `
##########
#........#
 #.####.#
  #.##.#
   #..#
   #..#
  #.##.#
 #.####.#
#........#
##########
`,

  help: `
#
##
#.#
#..#
#...#
#....#
#..####
#.#
##
#
`,

  grab: `
  ## ## #
  #.#.#.##
# #......#
#.#......#
#........#
 #......#
  #....#
   #..#
   #..#
   ####
`,

  grabbing: `
 ## ## ##
 #.#.#.##
#........#
#........#
 #......#
 #......#
  #....#
   #..#
   ####
`,

  move: `
    ##
   #..#
   #..#
## #..# ##
#........#
#........#
## #..# ##
   #..#
   #..#
    ##
`,

  crosshair: `
    ##
    ##
    ##
    ##
## ## ##
#.    .#
## ## ##
    ##
    ##
    ##
`,
};

// Per-cursor grid dimensions. Cursors not listed use GRID_SIZE×GRID_SIZE.
// Text uses a narrower 5×8 grid so the I-beam canvas lands at 10×16 CSS px,
// in line with the ~16 px OS default.
const GRID_DIMS: Partial<Record<CursorKind, { w: number; h: number }>> = {
  text: { w: 5, h: 8 },
};

function dimsFor(kind: CursorKind): { w: number; h: number } {
  return GRID_DIMS[kind] ?? { w: GRID_SIZE, h: GRID_SIZE };
}

// Hotspots are in CANVAS/CSS pixels (= cursor image pixels).
// Default and pointer come from SVGs rendered at ARROW_RENDER_* / POINTER_RENDER_*,
// so their hotspots are in those coordinate spaces. Other kinds use the 10×10
// grid × 2 px/cell convention (center = 10,10).
const HOTSPOTS: Record<CursorKind, [number, number]> = {
  default: [0, 0],    // arrow tip (top-left of svg viewBox)
  // pointer svg: finger column is at ~x=76 of viewBox 219 wide → 76/219*13 ≈ 4.
  pointer: [4, 0],
  // I-beam center: 5×8 grid × CELL=2 → 10×16 canvas, center ≈ (5, 8).
  text: [5, 8],
  notAllowed: [10, 10],
  wait: [10, 10],
  help: [0, 0],
  grab: [8, 10],
  grabbing: [10, 8],
  move: [10, 10],
  crosshair: [10, 10],
};

function parseGrid(src: string, w: number, h: number): number[][] {
  const rawLines = src.split('\n');
  const lines: string[] = [];
  let started = false;
  for (const l of rawLines) {
    if (!started && l.trim() === '') continue;
    started = true;
    lines.push(l);
  }
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  const grid: number[][] = [];
  for (let y = 0; y < h; y++) {
    const line = lines[y] ?? '';
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const c = line[x] ?? ' ';
      row.push(c === '#' ? 1 : c === '.' ? 2 : 0);
    }
    grid.push(row);
  }
  return grid;
}

function drawGrid(grid: number[][], colors: Colors, w: number, h: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = w * CELL;
  canvas.height = h * CELL;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < w; x++) {
      const v = row[x];
      if (!v) continue;
      ctx.fillStyle = v === 1 ? colors.outline : colors.fill;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
  return canvas.toDataURL('image/png');
}

function drawCursor(kind: CursorKind, colors: Colors): string {
  // Default arrow and pointer come from user-supplied SVGs — return them
  // directly as data URLs so the pixel-art silhouettes stay faithful.
  if (kind === 'default') return buildArrowSvgUrl(colors);
  if (kind === 'pointer') return buildPointerSvgUrl(colors);
  const { w, h } = dimsFor(kind);
  return drawGrid(parseGrid(GRIDS[kind], w, h), colors, w, h);
}

// Backwards-compatible named exports.
export function drawDefaultCursor(colors: Colors): string {
  return drawCursor('default', colors);
}
export function drawPointerCursor(colors: Colors): string {
  return drawCursor('pointer', colors);
}

function readColors(): Colors {
  const cs = getComputedStyle(document.documentElement);
  const fill = cs.getPropertyValue(FILL_VAR).trim() || FILL_FALLBACK;
  const outline = cs.getPropertyValue(OUTLINE_VAR).trim() || OUTLINE_FALLBACK;
  return { fill, outline };
}

function ensureStyleElement(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  return el;
}

let urlCache: Record<CursorKind, string> | null = null;

function buildUrls(): Record<CursorKind, string> {
  const colors = readColors();
  return {
    default: drawCursor('default', colors),
    pointer: drawCursor('pointer', colors),
    text: drawCursor('text', colors),
    notAllowed: drawCursor('notAllowed', colors),
    wait: drawCursor('wait', colors),
    help: drawCursor('help', colors),
    grab: drawCursor('grab', colors),
    grabbing: drawCursor('grabbing', colors),
    move: drawCursor('move', colors),
    crosshair: drawCursor('crosshair', colors),
  };
}

function cursorValue(kind: CursorKind, fallbackKeyword: string): string {
  const urls = urlCache!;
  const [hx, hy] = HOTSPOTS[kind];
  return `url("${urls[kind]}") ${hx} ${hy}, ${fallbackKeyword}`;
}

// Install the universal override + seed the default cursor on <html>.
export function applyPixelCursors(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  urlCache = buildUrls();
  if (!urlCache.default) return;

  const css = `
@media (pointer: fine) {
  :root { ${CSS_VAR}: ${cursorValue('default', 'default')}; }
  html, body, *, *::before, *::after {
    cursor: var(${CSS_VAR}) !important;
  }
}
`;
  ensureStyleElement().textContent = css;

  // Force a refresh of the current hover target so colors update on theme switch.
  lastTarget = null;
}

// --- Hover dispatcher -------------------------------------------------------

const KEYWORD_TO_KIND: Record<string, CursorKind> = {
  'default': 'default',
  'pointer': 'pointer',
  'text': 'text',
  'vertical-text': 'text',
  'not-allowed': 'notAllowed',
  'no-drop': 'notAllowed',
  'wait': 'wait',
  'progress': 'wait',
  'help': 'help',
  'grab': 'grab',
  '-webkit-grab': 'grab',
  'grabbing': 'grabbing',
  '-webkit-grabbing': 'grabbing',
  'move': 'move',
  'all-scroll': 'move',
  'crosshair': 'crosshair',
  'cell': 'crosshair',
  // Resize cursors map to move as a sensible fallback.
  'n-resize': 'move',
  's-resize': 'move',
  'e-resize': 'move',
  'w-resize': 'move',
  'ne-resize': 'move',
  'nw-resize': 'move',
  'se-resize': 'move',
  'sw-resize': 'move',
  'ns-resize': 'move',
  'ew-resize': 'move',
  'nesw-resize': 'move',
  'nwse-resize': 'move',
  'col-resize': 'move',
  'row-resize': 'move',
  'zoom-in': 'crosshair',
  'zoom-out': 'crosshair',
};

/** Strip any leading url(...) fallbacks and return the final keyword. */
function extractCursorKeyword(value: string): string {
  // value looks like: `url("data:...") 4 0, pointer` or just `pointer`
  // Take the last token after a comma, trimmed.
  const parts = value.split(',');
  const last = parts[parts.length - 1].trim();
  // Strip any trailing `!important` or whitespace.
  return last.replace(/\s*!important$/, '').trim().toLowerCase();
}

function isTextLikeElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    return (
      type === '' ||
      type === 'text' ||
      type === 'email' ||
      type === 'password' ||
      type === 'search' ||
      type === 'tel' ||
      type === 'url' ||
      type === 'number'
    );
  }
  if (tag === 'TEXTAREA') return true;
  const editable = (el as HTMLElement).isContentEditable;
  if (editable) return true;
  return false;
}

let lastTarget: Element | null = null;
let lastKind: CursorKind | null = null;

function nativeCursorOf(el: Element): string {
  // Flip the style sheet off, read the real cursor, flip it back on.
  // `disabled` is the cleanest way to make the browser ignore a stylesheet
  // without losing its content — getComputedStyle below forces the
  // style-recalc synchronously, so we see the native value.
  const styleEl = ensureStyleElement();
  styleEl.disabled = true;
  const c = getComputedStyle(el).cursor;
  styleEl.disabled = false;
  return c;
}

function resolveKind(el: Element): { kind: CursorKind; keyword: string } {
  const raw = nativeCursorOf(el);
  const keyword = extractCursorKeyword(raw);
  if (keyword === 'auto') {
    // Only real form/editable targets get the I-beam. Plain text containers
    // (p, span, div with text content) stay on the default arrow — this
    // avoids false positives on clickable rows that happen to contain text.
    if (isTextLikeElement(el)) return { kind: 'text', keyword: 'text' };
    return { kind: 'default', keyword: 'default' };
  }
  const kind = KEYWORD_TO_KIND[keyword] ?? 'default';
  return { kind, keyword };
}

function onMouseOver(e: MouseEvent): void {
  const target = e.target as Element | null;
  if (!target || !(target instanceof Element)) return;
  if (target === lastTarget) return;
  lastTarget = target;
  if (!urlCache) return;

  const { kind, keyword } = resolveKind(target);
  if (kind === lastKind) return;
  lastKind = kind;

  document.documentElement.style.setProperty(CSS_VAR, cursorValue(kind, keyword));
}

// --- Init -------------------------------------------------------------------

let initialized = false;

export function initPixelCursor(): void {
  if (initialized) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  initialized = true;

  const run = () => applyPixelCursors();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  // Re-draw on theme changes (ThemeProvider toggles data-* + inline style on <html>).
  const observer = new MutationObserver(() => applyPixelCursors());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-visual-theme', 'style'],
  });

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', run);

  // Hover dispatcher. `mouseover` fires only on target change, so it's much
  // cheaper than mousemove while still catching every element transition.
  document.addEventListener('mouseover', onMouseOver, { capture: true, passive: true });
}
