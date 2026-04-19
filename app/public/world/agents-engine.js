/**
 * World Agents — T.A.S.K. Agent state machine (theme-agnostic).
 *
 * Agents walk between "stops" (cabinets, trees, etc.). The theme's draw
 * module supplies the stop X positions; this engine owns state transitions.
 * States: IDLE (5-15s wait) → WALKING (30-50px/s) → IDLE.
 *
 * When only one stop exists the agents wander to random X positions within
 * the canvas so they don't get stuck standing still.
 */

// eslint-disable-next-line no-unused-vars
var WorldAgents = (function () {
  var STATE_IDLE = 0;
  var STATE_WALKING = 1;

  var IDLE_MIN = 5;     // seconds
  var IDLE_MAX = 15;
  var SPEED_MIN = 30;   // px/s
  var SPEED_MAX = 50;
  var FRAME_COUNT = 4;
  var FRAME_FPS = 6;
  var FRAME_INTERVAL = 1 / FRAME_FPS;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  /**
   * Create agent state objects.
   * @param {number} agentCount
   * @param {number[]} stopXPositions  centre-x of each stop (cabinet/tree)
   * @returns {Array<Object>}
   */
  function createAgents(agentCount, stopXPositions) {
    if (agentCount === 0 || stopXPositions.length === 0) return [];

    var agents = [];
    var usedStops = [];

    for (var i = 0; i < agentCount; i++) {
      var available = [];
      for (var c = 0; c < stopXPositions.length; c++) {
        if (usedStops.indexOf(c) === -1) available.push(c);
      }
      if (available.length === 0) {
        available = [];
        for (var c2 = 0; c2 < stopXPositions.length; c2++) available.push(c2);
      }
      var stopIdx = available[randInt(0, available.length - 1)];
      usedStops.push(stopIdx);

      agents.push({
        x: stopXPositions[stopIdx],
        stopIndex: stopIdx,
        state: STATE_IDLE,
        idleTimer: rand(0, IDLE_MAX - IDLE_MIN),
        targetX: 0,
        targetStop: -1,
        speed: 0,
        facingLeft: Math.random() > 0.5,
        frame: 0,
        frameTimer: 0,
      });
    }

    return agents;
  }

  /**
   * Update all agents by dt seconds.
   * @param {Array<Object>} agents
   * @param {number[]} stopXPositions
   * @param {number} dt  delta time in seconds
   * @param {number} [canvasW] canvas width (required for single-stop wander mode)
   */
  function update(agents, stopXPositions, dt, canvasW) {
    var singleStop = stopXPositions.length === 1;
    var WANDER_MARGIN = 20;
    var WANDER_MIN_STEP = 40;
    var wanderMaxX = (canvasW || (stopXPositions[0] || 0) * 2) - WANDER_MARGIN;

    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];

      if (a.state === STATE_IDLE) {
        a.idleTimer -= dt;
        if (a.idleTimer <= 0) {
          if (singleStop) {
            var newX = rand(WANDER_MARGIN, wanderMaxX);
            if (Math.abs(newX - a.x) < WANDER_MIN_STEP) {
              newX = (a.x < (WANDER_MARGIN + wanderMaxX) / 2) ? wanderMaxX : WANDER_MARGIN;
            }
            a.state = STATE_WALKING;
            a.targetStop = -1;
            a.targetX = newX;
            a.speed = rand(SPEED_MIN, SPEED_MAX);
            a.facingLeft = a.targetX < a.x;
            a.frame = 0;
            a.frameTimer = 0;
          } else {
            var target = pickDifferentStop(a.stopIndex, stopXPositions.length, agents);
            if (target >= 0) {
              a.state = STATE_WALKING;
              a.targetStop = target;
              a.targetX = stopXPositions[target];
              a.speed = rand(SPEED_MIN, SPEED_MAX);
              a.facingLeft = a.targetX < a.x;
              a.frame = 0;
              a.frameTimer = 0;
            } else {
              a.idleTimer = rand(IDLE_MIN, IDLE_MAX);
            }
          }
        }
      } else if (a.state === STATE_WALKING) {
        a.frameTimer += dt;
        if (a.frameTimer >= FRAME_INTERVAL) {
          a.frameTimer -= FRAME_INTERVAL;
          a.frame = (a.frame + 1) % FRAME_COUNT;
        }

        var dir = a.targetX > a.x ? 1 : -1;
        a.x += dir * a.speed * dt;

        if ((dir > 0 && a.x >= a.targetX) || (dir < 0 && a.x <= a.targetX)) {
          a.x = a.targetX;
          if (a.targetStop >= 0) {
            a.stopIndex = a.targetStop;
          }
          a.state = STATE_IDLE;
          a.idleTimer = rand(IDLE_MIN, IDLE_MAX);
          a.frame = 0;

          if (a.targetStop >= 0 && isStopOccupied(a.stopIndex, i, agents)) {
            a.idleTimer = rand(0.5, 2);
          }
        }
      }
    }
  }

  function pickDifferentStop(currentIdx, totalStops, agents) {
    var candidates = [];
    for (var c = 0; c < totalStops; c++) {
      if (c === currentIdx) continue;
      if (!isStopOccupied(c, -1, agents)) candidates.push(c);
    }
    if (candidates.length === 0) {
      for (var c2 = 0; c2 < totalStops; c2++) {
        if (c2 !== currentIdx) candidates.push(c2);
      }
    }
    if (candidates.length === 0) return -1;
    return candidates[randInt(0, candidates.length - 1)];
  }

  function isStopOccupied(stopIdx, excludeAgentIdx, agents) {
    for (var i = 0; i < agents.length; i++) {
      if (i === excludeAgentIdx) continue;
      if (agents[i].state === STATE_IDLE && agents[i].stopIndex === stopIdx) return true;
    }
    return false;
  }

  /**
   * Get render data for all agents.
   * @param {Array<Object>} agents
   * @returns {Array<{x:number, frame:number, facingLeft:boolean}>}
   */
  function getRenderData(agents) {
    var result = [];
    for (var i = 0; i < agents.length; i++) {
      result.push({
        x: agents[i].x,
        frame: agents[i].frame,
        facingLeft: agents[i].facingLeft,
      });
    }
    return result;
  }

  return {
    createAgents: createAgents,
    update: update,
    getRenderData: getRenderData,
  };
})();
