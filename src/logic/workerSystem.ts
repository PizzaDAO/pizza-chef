import { GameState, HiredWorker, PepeHelper, WorkerTraining } from '../types/game';
import { WORKER_CONFIG, GAME_CONFIG } from '../lib/constants';
import { processHelperAction, PepeHelperEvent, HelperAbilities } from './pepeHelperSystem';
import { buildLaneBuckets } from './laneBuckets';

/** Default training for a brand new intern */
export const DEFAULT_TRAINING: WorkerTraining = {
  speed: 0,
  capacity: 0,
  hustle: 0,
};

/**
 * Compute the total training level (sum of all stat levels).
 */
export const getTotalTrainingLevel = (t: WorkerTraining): number =>
  t.speed + t.capacity + t.hustle;

/**
 * Get the max slices the intern can hold based on capacity training.
 */
export const getWorkerMaxSlices = (t: WorkerTraining): number =>
  WORKER_CONFIG.MAX_SLICES_BY_LEVEL[t.capacity] ?? 2;

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
 * Get the effective action interval for the worker, factoring in speed training.
 */
export const getWorkerActionInterval = (t: WorkerTraining): number => {
  return WORKER_CONFIG.ACTION_INTERVALS[t.speed] ?? WORKER_CONFIG.BASE_ACTION_INTERVAL;
};

/**
 * Get the rank title based on total training level.
 */
export const getWorkerRankTitle = (t: WorkerTraining): string => {
  const totalLevel = getTotalTrainingLevel(t);
  if (totalLevel >= 13) return 'Pizzaiolo';
  if (totalLevel >= 10) return 'Slice Master';
  if (totalLevel >= 6) return 'Oven Jockey';
  if (totalLevel >= 3) return 'Cheese Whiz';
  return 'Dough Boy';
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
    { threshold: 13, name: 'Full Pizzaiolo AI' },
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
    availableSlices: WORKER_CONFIG.STARTING_SLICES,
    lastActionTime: 0,
    training,
  };
};

export interface WorkerTickResult {
  updatedState: Partial<GameState>;
  events: PepeHelperEvent[];
}

/**
 * Process the hired worker's actions each tick.
 * Adapts HiredWorker to PepeHelper shape and reuses processHelperAction.
 * Now training-aware: computes abilities, action interval.
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
  const maxSlices = getWorkerMaxSlices(training);

  // Compute effective action interval from training
  const effectiveInterval = getWorkerActionInterval(training);

  // Adapt HiredWorker to PepeHelper shape for reuse
  const helperShape: PepeHelper = {
    id: 'worker',
    lane: worker.lane,
    availableSlices: worker.availableSlices,
    lastActionTime: worker.lastActionTime,
  };

  // Determine "other helper" lanes to avoid clustering
  const otherHelperLane = gameState.pepeHelpers?.active
    ? gameState.pepeHelpers.franco.lane
    : gameState.chefLane;

  // Build lane buckets
  const customerBuckets = buildLaneBuckets(gameState.customers);
  const plateBuckets = buildLaneBuckets(gameState.emptyPlates);
  const sliceBuckets = buildLaneBuckets(gameState.pizzaSlices);

  // Override the action interval check by adjusting lastActionTime
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
    0, // no smarts bonus
    0, // no clustering reduction
  );

  // Cap slices at the intern's max capacity
  const cappedSlices = Math.min(result.updatedHelper.availableSlices, maxSlices);

  // Map back the real lastActionTime (undo the adjustment if it was updated)
  const updatedWorker: HiredWorker = {
    active: true,
    lane: result.updatedHelper.lane,
    availableSlices: cappedSlices,
    lastActionTime: result.updatedHelper.lastActionTime === adjustedHelper.lastActionTime
      ? worker.lastActionTime
      : result.updatedHelper.lastActionTime,
    training,
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
