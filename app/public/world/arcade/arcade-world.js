/**
 * Arcade World — draws cabinets (SVG) and agents on a transparent canvas.
 * The bottom edge of the canvas is the ground.
 * Each cabinet slot uses a different SVG so the room looks varied.
 */

// eslint-disable-next-line no-unused-vars
var ArcadeWorld = (function () {
  // Cabinet SVGs — order matches Lv unlock sequence
  // Lv1: Fighter | Lv2: +Shooter,Maze | Lv3: +Platformer,Racing | Lv4: +Mystery
  var CABINET_SRCS = [
    '/world/arcade/sprites/arcade-fight.svg',
    '/world/arcade/sprites/arcade-shooter.svg',
    '/world/arcade/sprites/arcade-maze.svg',
    '/world/arcade/sprites/arcade-platformer.svg',
    '/world/arcade/sprites/arcade-racing.svg',
    '/world/arcade/sprites/arcade-mystery.svg',
  ];
  var cabinetImgs = [];
  var agentFrames = [null, null, null, null];
  var imagesLoaded = false;

  function preloadImages(onReady) {
    if (imagesLoaded) { if (onReady) onReady(); return; }

    var total = CABINET_SRCS.length + 4; // cabinets + agent frames
    var loaded = 0;

    function check() {
      loaded++;
      if (loaded >= total) {
        imagesLoaded = true;
        if (onReady) onReady();
      }
    }

    for (var c = 0; c < CABINET_SRCS.length; c++) {
      cabinetImgs[c] = new Image();
      cabinetImgs[c].onload = check;
      cabinetImgs[c].onerror = check;
      cabinetImgs[c].src = CABINET_SRCS[c];
    }

    for (var i = 0; i < 4; i++) {
      agentFrames[i] = new Image();
      agentFrames[i].onload = check;
      agentFrames[i].onerror = check;
      agentFrames[i].src = '/world/arcade/sprites/agent-arcade-000' + (i + 1) + '.png';
    }
  }

  /**
   * Get the x positions for cabinets (evenly distributed).
   */
  function getCabinetPositions(count, canvasW) {
    if (count === 0) return [];
    var positions = [];
    // Each cabinet gets an equal slice of the canvas width
    var slotW = canvasW / count;
    for (var i = 0; i < count; i++) {
      positions.push(slotW * i + slotW / 2);
    }
    return positions;
  }

  // Level → cabinet count (mirrors LEVEL_TABLE in useThemeStats.ts)
  function getCabinetCount(level) {
    if (level >= 4) return 6;
    if (level >= 3) return 5;
    if (level >= 2) return 3;
    return 1;
  }

  // Generic "stops" = cabinet positions (used by WorldAgents).
  function getStopPositions(level, canvasW) {
    return getCabinetPositions(getCabinetCount(level), canvasW);
  }

  // Cabinet draw size — SVG source is 45x66, scale down to match 32px agents
  var CAB_DRAW_W = 27;
  var CAB_DRAW_H = 40;

  /**
   * Draw cabinets and agents. No background — canvas is transparent.
   * Ground = bottom edge of canvas (y = h).
   */
  function draw(ctx, w, h, colors, level, agents) {
    ctx.clearRect(0, 0, w, h);

    var groundY = h;
    var cabinetCount = getCabinetCount(level);
    // — Cabinets (each slot uses a different SVG)
    var cabPositions = getCabinetPositions(cabinetCount, w);
    for (var c = 0; c < cabPositions.length; c++) {
      var img = cabinetImgs[c % cabinetImgs.length];
      if (!img || !img.complete || img.naturalWidth === 0) continue;
      var cx = cabPositions[c] - CAB_DRAW_W / 2;
      var cy = groundY - CAB_DRAW_H;
      ctx.drawImage(img, cx, cy, CAB_DRAW_W, CAB_DRAW_H);
    }

    // — Agents (sorted by x for z-order)
    if (agents && agents.length > 0) {
      var sorted = agents.slice().sort(function (a, b) { return a.x - b.x; });
      var AGENT_SIZE = 32;
      for (var ai = 0; ai < sorted.length; ai++) {
        var agent = sorted[ai];
        var frameImg = agentFrames[agent.frame % 4];
        if (!frameImg || !frameImg.complete || frameImg.naturalWidth === 0) continue;

        var ax = agent.x - AGENT_SIZE / 2;
        var ay = groundY - AGENT_SIZE;

        ctx.save();
        if (agent.facingLeft) {
          ctx.translate(agent.x, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(frameImg, -AGENT_SIZE / 2, ay, AGENT_SIZE, AGENT_SIZE);
        } else {
          ctx.drawImage(frameImg, ax, ay, AGENT_SIZE, AGENT_SIZE);
        }
        ctx.restore();
      }
    }
  }

  return {
    preloadImages: preloadImages,
    getCabinetPositions: getCabinetPositions,
    getCabinetCount: getCabinetCount,
    getStopPositions: getStopPositions,
    draw: draw,
    CAB_DRAW_W: CAB_DRAW_W,
    CAB_DRAW_H: CAB_DRAW_H,
  };
})();
