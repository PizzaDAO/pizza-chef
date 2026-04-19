import { GameState, HiredWorker, PepeHelper, WorkerTraining } from '../types/game';
import { WORKER_CONFIG } from '../lib/constants';
import { processHelperAction, PepeHelperEvent, HelperAbilities } from './pepeHelperSystem';
import { buildLaneBuckets } from './laneBuckets';

/** Default training for a brand new intern */
export const DEFAULT_TRAINING: WorkerTraining = {
  speed: 0,
  capacity: 0,
  smarts: 0,
  hustle: 0,
  xp: 0,
  xpLevel: 0,
};

/**
 * Compute the total training level (sum of all stat levels).
 */
export const getTotalTrainingLevel = (t: WorkerTraining): number =>
  t.speed + t.capacity + t.smarts + t.hustle;

/**
 * Derive abilities from training level thresholds.
 */
export const getWorkerAbilities = (t: WorkerTraining): HelperAbilities => {
  const totalLevel = getTotalTrainingLevel(t);
  return {
    canCatchPlates: totalLevel >= WORKER_CONFIG.UNLOCK_PLATES,
    canPullPizza: totalLevel >= WORKER_CONFIG.UNLOCK_PULL_PIZZA,
    canStartOven: totalLevel >= WORKER_CONFIG.UNLOCK_START_OVEN,
    canMoveAndAct: totalLevel >= WORKER_CONFIG.UNLOCK_MOVE_ACT,
  };
};

/**
 * Get the effective action interval for the worker, factoring in speed training and XP.
 */
export const getWorkerActionInterval = (t: WorkerTraining): number => {
  const baseInterval = WORKER_CONFIG.ACTION_INTERVALS[t.speed] ?? WORKER_CONFIG.BASE_ACTION_INTERVAL;
  const xpBonus = t.xpLevel * WORKER_CONFIG.XP_BONUS_ACTION_INTERVAL;
  return Math.max(50, baseInterval + xpBonus); // Floor at 50ms
};

/**
 * Get the rank title based on total training level.
 */
export const getWorkerRankTitle = (t: WorkerTraining): string => {
  const totalLevel = getTotalTrainingLevel(t);
  if (totalLevel >= 18) return 'Pizzaiolo';
  if (totalLevel >= 15) return 'Slice Master';
  if (totalLevel >= 10) return 'Oven Jockey';
  if (totalLevel >= 6) return 'Cheese Whiz';
  if (totalLevel >= 3) return 'Sauce Slinger';
  return 'Dough Boy';
};

/**
 * Compute XP level from current XP using thresholds.
 */
export const computeXpLevel = (xp: number): number => {
  const thresholds = WORKER_CONFIG.XP_THRESHOLDS;
  let level = 0;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
};

/**
 * Get the next ability unlock info: { name, levelsNeeded } or null if all unlocked.
 */
export const getNextUnlock = (t: WorkerTraining): { name: string; levelsNeeded: number } | null => {
  const totalLevel = getTotalTrainingLevel(t);
  const unlocks = [
    { threshold: WORKER_CONFIG.UNLOCK_PLATES, name: 'Catch plates' },
    { threshold: WORKER_CONFIG.UNLOCK_PULL_PIZZA, name: 'Pull pizza from ovens' },
    { threshold: WORKER_CONFIG.UNLOCK_START_OVEN, name: 'Start cooking in ovens' },
    { threshold: WORKER_CONFIG.UNLOCK_MOVE_ACT, name: 'Move & act in same tick' },
    { threshold: 18, name: 'Full Pizzaiolo AI' },
  ];
  for (const u of unlocks) {
    if (totalLevel < u.threshold) {
      return { name: u.name, levelsNeeded: u.threshold - totalLevel };
    }
  }
  return null;
};

/**
 * Initialize a new hired worker.
 * Spreads out from the chef's current lane.
 * Accepts optional saved training to restore on re-hire.
 */
export const initializeHiredWorker = (chefLane: number, savedTraining?: WorkerTraining): HiredWorker => {
  const training = savedTraining ?? { ...DEFAULT_TRAINING };
  return {
    active: true,
    lane: chefLane <= 1 ? 3 : 0, // Spread out from chef
    availableSlices: WORKER_CONFIG.STARTING_SLICES_BY_LEVEL[training.capacity] ?? 1,
    lastActionTime: 0,
    training,
  };
};

export interface WorkerTickResult {
  updatedState: Partial<GameState>;
  events: PepeHelperEvent[];
}

/**
 * Award XP based on events and update xpLevel accordingly.
 */
const awardXp = (training: WorkerTraining, events: PepeHelperEvent[]): WorkerTraining => {
  let xpGained = 0;
  for (const event of events) {
    switch (event.type) {
      case 'CUSTOMER_SERVED':
        xpGained += WORKER_CONFIG.XP_PER_SERVE;
        break;
      case 'PLATE_CAUGHT':
        xpGained += WORKER_CONFIG.XP_PER_PLATE_CATCH;
        break;
      case 'OVEN_STARTED':
        xpGained += WORKER_CONFIG.XP_PER_OVEN_START;
        break;
      case 'PIZZA_PULLED':
        xpGained += WORKER_CONFIG.XP_PER_PIZZA_PULL;
        break;
    }
  }
  if (xpGained === 0) return training;

  const newXp = training.xp + xpGained;
  const newXpLevel = computeXpLevel(newXp);
  return { ...training, xp: newXp, xpLevel: newXpLevel };
};

/**
 * Process the hired worker's actions each tick.
 * Adapts HiredWorker to PepeHelper shape and reuses processHelperAction.
 * Now training-aware: computes abilities, action interval, smarts bonuses.
 */
export const processWorkerTick = (
  gameState: GameState,
  now: number
): WorkerTickResult => {
  const worker = gameState.hiredWorker;
  if (!worker || !worker.active) {
    return { updatedState: {}, events: [] };
  }

  const training = worker.training;
  const abilities = getWorkerAbilities(training);

  // Compute effective action interval from training
  const effectiveInterval = getWorkerActionInterval(training);

  // Smarts bonuses
  const smartsBonus = (WORKER_CONFIG.SMARTS_CUSTOMER_BONUS[training.smarts] ?? 0) +
    (training.xpLevel * WORKER_CONFIG.XP_BONUS_PRIORITY);
  const clusteringReduction = WORKER_CONFIG.SMARTS_CLUSTERING_REDUCTION[training.smarts] ?? 0;

  // Adapt HiredWorker to PepeHelper shape for reuse
  const helperShape: PepeHelper = {
    id: 'worker',
    lane: worker.lane,
    availableSlices: worker.availableSlices,
    lastActionTime: worker.lastActionTime,
  };

  // Determine "other helper" lanes to avoid clustering
  // Consider chef lane and any active pepe helpers
  const otherHelperLane = gameState.pepeHelpers?.active
    ? gameState.pepeHelpers.franco.lane
    : gameState.chefLane;

  // Build lane buckets
  const customerBuckets = buildLaneBuckets(gameState.customers);
  const plateBuckets = buildLaneBuckets(gameState.emptyPlates);
  const sliceBuckets = buildLaneBuckets(gameState.pizzaSlices);

  // Override the action interval check by adjusting lastActionTime
  // processHelperAction uses PEPE_CONFIG.ACTION_INTERVAL (100ms), but we want our training-based interval
  // We adjust by shifting the lastActionTime to simulate the worker's interval
  const adjustedHelper: PepeHelper = {
    ...helperShape,
    lastActionTime: helperShape.lastActionTime === 0
      ? 0
      : helperShape.lastActionTime + (effectiveInterval - 100), // 100 is PEPE_CONFIG.ACTION_INTERVAL
  };

  const result = processHelperAction(
    adjustedHelper,
    gameState,
    otherHelperLane,
    gameState.chefLane,
    now,
    customerBuckets,
    plateBuckets,
    sliceBuckets,
    abilities,
    smartsBonus,
    clusteringReduction,
  );

  // Award XP from events
  const updatedTraining = awardXp(training, result.events);

  // Map back the real lastActionTime (undo the adjustment if it was updated)
  const updatedWorker: HiredWorker = {
    active: true,
    lane: result.updatedHelper.lane,
    availableSlices: result.updatedHelper.availableSlices,
    lastActionTime: result.updatedHelper.lastActionTime === adjustedHelper.lastActionTime
      ? worker.lastActionTime // Wasn't updated
      : result.updatedHelper.lastActionTime, // Was updated by processHelperAction
    training: updatedTraining,
  };

  const updatedState: Partial<GameState> = {
    ovens: result.updatedOvens,
    pizzaSlices: [...gameState.pizzaSlices, ...result.newSlices],
    emptyPlates: gameState.emptyPlates.filter(p => !result.caughtPlateIds.includes(p.id)),
    hiredWorker: updatedWorker,
    stats: { ...gameState.stats, ...result.statsUpdates },
    score: gameState.score + result.scoreGained,
  };

  return {
    updatedState,
    events: result.events,
  };
};
