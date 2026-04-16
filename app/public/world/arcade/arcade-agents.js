/**
 * Arcade Agents — T.A.S.K. Agent state machine.
 *
 * Each agent walks between cabinets independently.
 * States: IDLE (5-15s wait) → WALKING (30-50px/s) → IDLE
 */

// eslint-disable-next-line no-unused-vars
var ArcadeAgents = (function () {
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
   * @param {number[]} cabinetXPositions  centre-x of each cabinet
   * @returns {Array<Object>}
   */
  function createAgents(agentCount, cabinetXPositions) {
    if (agentCount === 0 || cabinetXPositions.length === 0) return [];

    var agents = [];
    var usedCabinets = [];

    for (var i = 0; i < agentCount; i++) {
      // Pick a cabinet not already occupied
      var available = [];
      for (var c = 0; c < cabinetXPositions.length; c++) {
        if (usedCabinets.indexOf(c) === -1) available.push(c);
      }
      if (available.length === 0) {
        // All occupied — allow overlap as fallback
        available = [];
        for (var c2 = 0; c2 < cabinetXPositions.length; c2++) available.push(c2);
      }
      var cabIdx = available[randInt(0, available.length - 1)];
      usedCabinets.push(cabIdx);

      agents.push({
        x: cabinetXPositions[cabIdx],
        cabinetIndex: cabIdx,
        state: STATE_IDLE,
        idleTimer: rand(0, IDLE_MAX - IDLE_MIN), // stagger initial waits
        targetX: 0,
        targetCabinet: -1,
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
   * @param {number[]} cabinetXPositions
   * @param {number} dt  delta time in seconds
   */
  function update(agents, cabinetXPositions, dt) {
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];

      if (a.state === STATE_IDLE) {
        a.idleTimer -= dt;
        if (a.idleTimer <= 0) {
          // Pick a different cabinet to walk to
          var target = pickDifferentCabinet(a.cabinetIndex, cabinetXPositions.length, agents);
          if (target >= 0) {
            a.state = STATE_WALKING;
            a.targetCabinet = target;
            a.targetX = cabinetXPositions[target];
            a.speed = rand(SPEED_MIN, SPEED_MAX);
            a.facingLeft = a.targetX < a.x;
            a.frame = 0;
            a.frameTimer = 0;
          } else {
            // No valid target — wait again
            a.idleTimer = rand(IDLE_MIN, IDLE_MAX);
          }
        }
      } else if (a.state === STATE_WALKING) {
        // Animate frames
        a.frameTimer += dt;
        if (a.frameTimer >= FRAME_INTERVAL) {
          a.frameTimer -= FRAME_INTERVAL;
          a.frame = (a.frame + 1) % FRAME_COUNT;
        }

        // Move toward target
        var dir = a.targetX > a.x ? 1 : -1;
        a.x += dir * a.speed * dt;

        // Check arrival
        if ((dir > 0 && a.x >= a.targetX) || (dir < 0 && a.x <= a.targetX)) {
          a.x = a.targetX;
          a.cabinetIndex = a.targetCabinet;
          a.state = STATE_IDLE;
          a.idleTimer = rand(IDLE_MIN, IDLE_MAX);
          a.frame = 0;

          // Check if another agent is already at this cabinet
          if (isCabinetOccupied(a.cabinetIndex, i, agents)) {
            // Immediately pick a new target
            a.idleTimer = rand(0.5, 2);
          }
        }
      }
    }
  }

  /**
   * Pick a different cabinet index that isn't occupied by another agent.
   */
  function pickDifferentCabinet(currentIdx, totalCabinets, agents) {
    var candidates = [];
    for (var c = 0; c < totalCabinets; c++) {
      if (c === currentIdx) continue;
      if (!isCabinetOccupied(c, -1, agents)) candidates.push(c);
    }
    if (candidates.length === 0) {
      // All occupied — pick any different one
      for (var c2 = 0; c2 < totalCabinets; c2++) {
        if (c2 !== currentIdx) candidates.push(c2);
      }
    }
    if (candidates.length === 0) return -1;
    return candidates[randInt(0, candidates.length - 1)];
  }

  /**
   * Check if a cabinet is occupied by an idle agent (excluding agentIdx).
   */
  function isCabinetOccupied(cabIdx, excludeAgentIdx, agents) {
    for (var i = 0; i < agents.length; i++) {
      if (i === excludeAgentIdx) continue;
      if (agents[i].state === STATE_IDLE && agents[i].cabinetIndex === cabIdx) return true;
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
