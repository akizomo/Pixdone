/**
 * Forest Bit World — draws trees and T.A.S.K. Agents on a transparent canvas.
 * Mirrors the arcade-world.js shape so WorldLayer can treat both themes
 * uniformly.
 *
 * Layout:
 *   - Ground = bottom edge of canvas (y = h).
 *   - Trees are placed left-to-right (all small trees first, then large trees).
 *   - Agents walk in front of the trees.
 */

// eslint-disable-next-line no-unused-vars
var ForestBitWorld = (function () {
  var SMALL_SRC = '/world/forestbit/sprites/tree-small.png';
  var LARGE_SRC = '/world/forestbit/sprites/tree-large.png';
  var AGENT_SRC_PREFIX = '/world/forestbit/sprites/agent-forest-bit-000';

  var treeSmallImg = null;
  var treeLargeImg = null;
  var agentFrames = [null, null, null, null];
  var imagesLoaded = false;

  // Natural sprite sizes: tree-small 32x32, tree-large 32x64.
  var SMALL_W = 32, SMALL_H = 32;
  var LARGE_W = 32, LARGE_H = 64;
  var AGENT_SIZE = 32;

  function preloadImages(onReady) {
    if (imagesLoaded) { if (onReady) onReady(); return; }

    var total = 2 + 4; // 2 trees + 4 agent frames
    var loaded = 0;
    function check() {
      loaded++;
      if (loaded >= total) { imagesLoaded = true; if (onReady) onReady(); }
    }

    treeSmallImg = new Image();
    treeSmallImg.onload = check; treeSmallImg.onerror = check;
    treeSmallImg.src = SMALL_SRC;

    treeLargeImg = new Image();
    treeLargeImg.onload = check; treeLargeImg.onerror = check;
    treeLargeImg.src = LARGE_SRC;

    for (var i = 0; i < 4; i++) {
      agentFrames[i] = new Image();
      agentFrames[i].onload = check; agentFrames[i].onerror = check;
      agentFrames[i].src = AGENT_SRC_PREFIX + (i + 1) + '.png';
    }
  }

  // Level → { small, large } tree composition. Fixed (upper bound each level).
  function getComposition(level) {
    if (level >= 4) return { small: 2, large: 3 };
    if (level >= 3) return { small: 2, large: 1 };
    if (level >= 2) return { small: 3, large: 0 };
    return { small: 1, large: 0 };
  }

  // Even-spaced layout, small → large from left.
  function getTreeLayout(small, large, canvasW) {
    var total = small + large;
    if (total === 0) return { positions: [], kinds: [] };
    var slotW = canvasW / total;
    var positions = [];
    var kinds = [];
    for (var i = 0; i < total; i++) {
      positions.push(slotW * i + slotW / 2);
      kinds.push(i < small ? 'small' : 'large');
    }
    return { positions: positions, kinds: kinds };
  }

  // Stop positions for WorldAgents (agents pace between tree slots).
  function getStopPositions(level, canvasW) {
    var comp = getComposition(level);
    return getTreeLayout(comp.small, comp.large, canvasW).positions;
  }

  function draw(ctx, w, h, colors, level, agents) {
    ctx.clearRect(0, 0, w, h);
    var groundY = h;

    var comp = getComposition(level);
    var layout = getTreeLayout(comp.small, comp.large, w);

    // — Trees (background)
    for (var i = 0; i < layout.positions.length; i++) {
      var isLarge = layout.kinds[i] === 'large';
      var img = isLarge ? treeLargeImg : treeSmallImg;
      if (!img || !img.complete || img.naturalWidth === 0) continue;
      var dw = isLarge ? LARGE_W : SMALL_W;
      var dh = isLarge ? LARGE_H : SMALL_H;
      ctx.drawImage(img, layout.positions[i] - dw / 2, groundY - dh, dw, dh);
    }

    // — Agents (foreground, sorted by x for simple z-order)
    if (agents && agents.length > 0) {
      var sorted = agents.slice().sort(function (a, b) { return a.x - b.x; });
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
    getComposition: getComposition,
    getStopPositions: getStopPositions,
    draw: draw,
  };
})();
