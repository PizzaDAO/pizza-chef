import { Customer, PowerUp, CustomerVariant, PowerUpType, LevelPhase } from '../types/game';
import {
  GAME_CONFIG,
  POSITIONS,
  ENTITY_SPEEDS,
  POWERUPS,
  SCUMBAG_STEVE,
  HEALTH_INSPECTOR,
  ALIEN,
  DELIVERY_DRIVER,
  HEALTH_DEPT_RAID,
  LEVEL_SYSTEM,
  SPAWN_RATES,
  PROBABILITIES,
  RUSH_HOUR,
} from '../lib/constants';

export interface SpawnResult<T> {
  shouldSpawn: boolean;
  entity?: T;
  triggerUfo?: boolean;
}

// --- Level-aware helper functions ---

/**
 * Get the number of customers required for a given level
 */
export const getCustomersForLevel = (level: number): number => {
  if (level <= LEVEL_SYSTEM.CUSTOMERS_PER_LEVEL.length) {
    return LEVEL_SYSTEM.CUSTOMERS_PER_LEVEL[level - 1];
  }
  // Level 7+: 30 + 2 per level beyond 7
  const base = LEVEL_SYSTEM.CUSTOMERS_PER_LEVEL[LEVEL_SYSTEM.CUSTOMERS_PER_LEVEL.length - 1];
  return base + LEVEL_SYSTEM.CUSTOMERS_GROWTH_PER_LEVEL * (level - LEVEL_SYSTEM.CUSTOMERS_PER_LEVEL.length);
};

/**
 * Get unlocked customer variants for a given level
 */
export const getUnlockedCustomerTypes = (level: number): CustomerVariant[] => {
  const types: CustomerVariant[] = ['normal'];
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.CRITIC) types.push('critic');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.BAD_LUCK_BRIAN) types.push('badLuckBrian');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.SCUMBAG_STEVE) types.push('scumbagSteve');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.DELIVERY_DRIVER) types.push('deliveryDriver');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.HEALTH_INSPECTOR) types.push('healthInspector');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.PIZZA_MAFIA) types.push('pizzaMafia');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.ALIEN) types.push('alien');
  return types;
};

/**
 * Get unlocked power-up types for a given level
 */
export const getUnlockedPowerUpTypes = (level: number): PowerUpType[] => {
  const types: PowerUpType[] = [];
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.HOT_HONEY) types.push('honey');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.ICE_CREAM) types.push('ice-cream');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.BEER) types.push('beer');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.STAR) types.push('star');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.DOGE) types.push('doge');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.NYAN) types.push('nyan');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.MOLTOBENNY) types.push('moltobenny');
  if (level >= LEVEL_SYSTEM.UNLOCK_SCHEDULE.PEPE) types.push('pepe');
  return types;
};

/**
 * Get customer speed multiplier for a given level
 */
export const getLevelSpeedMultiplier = (level: number): number => {
  if (level <= LEVEL_SYSTEM.SPEED_MULTIPLIERS.length) {
    return LEVEL_SYSTEM.SPEED_MULTIPLIERS[level - 1];
  }
  // After level 7: 1.3 + 0.05 per level beyond 7
  const base = LEVEL_SYSTEM.SPEED_MULTIPLIERS[LEVEL_SYSTEM.SPEED_MULTIPLIERS.length - 1];
  return base + LEVEL_SYSTEM.SPEED_GROWTH_PER_LEVEL * (level - LEVEL_SYSTEM.SPEED_MULTIPLIERS.length);
};

/**
 * Get spawn interval for a given level
 */
export const getLevelSpawnInterval = (level: number): number => {
  if (level <= LEVEL_SYSTEM.SPAWN_INTERVALS.length) {
    return LEVEL_SYSTEM.SPAWN_INTERVALS[level - 1];
  }
  const levelsAfter = level - LEVEL_SYSTEM.SPAWN_INTERVALS.length;
  const lastDefined = LEVEL_SYSTEM.SPAWN_INTERVALS[LEVEL_SYSTEM.SPAWN_INTERVALS.length - 1];
  return Math.max(lastDefined - levelsAfter * LEVEL_SYSTEM.SPAWN_INTERVAL_DECAY, LEVEL_SYSTEM.SPAWN_INTERVAL_FLOOR);
};

/**
 * Get special customer spawn chances for a given level
 */
const chanceAt = (arr: readonly number[], level: number): number => {
  const idx = Math.min(level, arr.length) - 1;
  return arr[idx] ?? 0;
};

/** For delivery/inspector/alien: after L12, add +PER_LEVEL per level beyond 12, capped at MAX */
const scalingChance = (arr: readonly number[], level: number, key: keyof typeof LEVEL_SYSTEM.SCALING_CHANCES): number => {
  const base = chanceAt(arr, level);
  if (level <= 12) return base;
  const scaling = LEVEL_SYSTEM.SCALING_CHANCES[key];
  return Math.min(base + (level - 12) * scaling.PER_LEVEL, scaling.MAX);
};

const getSpecialChances = (level: number) => ({
  critic: chanceAt(LEVEL_SYSTEM.SPECIAL_CHANCES.CRITIC, level),
  brian: chanceAt(LEVEL_SYSTEM.SPECIAL_CHANCES.BRIAN, level),
  steve: chanceAt(LEVEL_SYSTEM.SPECIAL_CHANCES.STEVE, level),
  deliveryDriver: scalingChance(LEVEL_SYSTEM.SPECIAL_CHANCES.DELIVERY_DRIVER, level, 'DELIVERY_DRIVER'),
  inspector: scalingChance(LEVEL_SYSTEM.SPECIAL_CHANCES.INSPECTOR, level, 'INSPECTOR'),
  alien: scalingChance(LEVEL_SYSTEM.SPECIAL_CHANCES.ALIEN, level, 'ALIEN'),
  mafia: chanceAt(LEVEL_SYSTEM.SPECIAL_CHANCES.MAFIA, level),
});

/**
 * Calculate the spawn delay based on level (legacy compat)
 */
export const getCustomerSpawnDelay = (level: number): number => {
  return getLevelSpawnInterval(level);
};

/**
 * Calculate effective spawn rate based on level and boss status
 */
export const getEffectiveSpawnRate = (level: number, bossActive: boolean): number => {
  // With the new level system, we use a simpler spawn rate
  // that ensures customers spawn at a reasonable pace within the spawn interval
  const baseRate = 5.0; // Higher base rate since we gate by interval now
  return baseRate; // Customers keep spawning during boss battles
};

/**
 * Check if a customer should spawn and create one if so
 */
export const trySpawnCustomer = (
  lastSpawnTime: number,
  now: number,
  level: number,
  bossActive: boolean,
  levelPhase?: LevelPhase,
  customersServed?: number,
  customersRequired?: number,
  totalCustomersSpawned?: number,
  rushHourActive?: boolean,
): SpawnResult<Customer> => {
  // Don't spawn when level is complete or in store
  if (levelPhase === 'complete' || levelPhase === 'store') {
    return { shouldSpawn: false };
  }

  // Don't spawn if enough customers have been served — unless a boss is active,
  // in which case customers keep coming at the current level's rate
  if (customersServed !== undefined && customersRequired !== undefined && customersServed >= customersRequired) {
    if (levelPhase !== 'boss_incoming' && levelPhase !== 'boss') {
      return { shouldSpawn: false };
    }
  }

  let spawnDelay = getLevelSpawnInterval(level);
  if (rushHourActive) {
    spawnDelay = Math.floor(spawnDelay / RUSH_HOUR.SPAWN_INTERVAL_DIVISOR);
  }

  // Check time gate
  if (now - lastSpawnTime < spawnDelay) {
    return { shouldSpawn: false };
  }

  // Random chance
  const effectiveSpawnRate = getEffectiveSpawnRate(level, bossActive);
  if (effectiveSpawnRate === 0 || Math.random() >= effectiveSpawnRate * 0.01) {
    return { shouldSpawn: false };
  }

  // Create the customer
  const lane = Math.floor(Math.random() * GAME_CONFIG.LANE_COUNT);
  const disappointedEmojis = ['😢', '😭', '😠', '🤬'];

  // Determine customer variant using independent weighted selection
  // Each type gets its exact stated probability; normal fills the remainder
  const unlockedTypes = getUnlockedCustomerTypes(level);
  const chances = getSpecialChances(level);

  const candidates: { variant: CustomerVariant; weight: number }[] = [];
  if (unlockedTypes.includes('critic')) candidates.push({ variant: 'critic', weight: chances.critic });
  if (unlockedTypes.includes('badLuckBrian')) candidates.push({ variant: 'badLuckBrian', weight: chances.brian });
  if (unlockedTypes.includes('scumbagSteve')) candidates.push({ variant: 'scumbagSteve', weight: chances.steve });
  if (unlockedTypes.includes('deliveryDriver')) candidates.push({ variant: 'deliveryDriver', weight: chances.deliveryDriver });
  if (unlockedTypes.includes('healthInspector')) candidates.push({ variant: 'healthInspector', weight: chances.inspector });
  if (unlockedTypes.includes('pizzaMafia')) candidates.push({ variant: 'pizzaMafia', weight: chances.mafia });
  if (unlockedTypes.includes('alien')) candidates.push({ variant: 'alien', weight: chances.alien });

  let variant: CustomerVariant = 'normal';
  const roll = Math.random();
  let cumulative = 0;
  for (const c of candidates) {
    cumulative += c.weight;
    if (roll < cumulative) {
      variant = c.variant;
      break;
    }
  }

  // Calculate speed with level speed multiplier
  const speedMultiplier = getLevelSpeedMultiplier(level);
  const baseSpeed = variant === 'scumbagSteve'
    ? ENTITY_SPEEDS.CUSTOMER_BASE * SCUMBAG_STEVE.SPEED_MULTIPLIER
    : variant === 'healthInspector'
    ? ENTITY_SPEEDS.CUSTOMER_BASE * HEALTH_INSPECTOR.SPEED_MULTIPLIER
    : variant === 'deliveryDriver'
    ? ENTITY_SPEEDS.CUSTOMER_BASE * DELIVERY_DRIVER.SPEED_MULTIPLIER
    : variant === 'alien'
    ? ENTITY_SPEEDS.CUSTOMER_BASE * ALIEN.SPEED_MULTIPLIER
    : ENTITY_SPEEDS.CUSTOMER_BASE;
  const speed = baseSpeed * speedMultiplier;

  // Create customer in 'approaching' state
  const customer: Customer = {
    id: `customer-${now}-${lane}`,
    lane,
    position: variant === 'alien' ? ALIEN.UFO_DROP_X : POSITIONS.SPAWN_X,
    speed,
    // Initial state: approaching (not served, leaving, or disappointed)
    served: false,
    hasPlate: false,
    leaving: false,
    disappointed: false,
    disappointedEmoji: disappointedEmojis[Math.floor(Math.random() * disappointedEmojis.length)],
    movingRight: false,
    // Customer variant
    critic: variant === 'critic',
    badLuckBrian: variant === 'badLuckBrian',
    scumbagSteve: variant === 'scumbagSteve',
    healthInspector: variant === 'healthInspector',
    alien: variant === 'alien',
    deliveryDriver: variant === 'deliveryDriver',
    deliverySlicesNeeded: variant === 'deliveryDriver' ? DELIVERY_DRIVER.SLICES_NEEDED : undefined,
    pizzaMafia: variant === 'pizzaMafia',
    slicesReceived: (variant === 'scumbagSteve' || variant === 'deliveryDriver') ? 0 : undefined,
    lastLaneChangeTime: variant === 'scumbagSteve' ? now : undefined,
    flipped: variant === 'badLuckBrian', // Brian spawns flipped, Steve spawns normal
    alienTargetLane: variant === 'alien' ? lane : undefined,
    alienLastLaneSwitchTime: variant === 'alien' ? now : undefined,
    alienWaitingForDrop: variant === 'alien' ? true : undefined,
  };

  return { shouldSpawn: true, entity: customer, triggerUfo: variant === 'alien' };
};

/**
 * Check if a power-up should spawn and create one if so
 */
export const trySpawnPowerUp = (
  lastSpawnTime: number,
  now: number,
  level?: number,
): SpawnResult<PowerUp> => {
  // Check time gate
  if (now - lastSpawnTime < SPAWN_RATES.POWERUP_MIN_INTERVAL) {
    return { shouldSpawn: false };
  }

  // Check random chance
  if (Math.random() >= SPAWN_RATES.POWERUP_CHANCE) {
    return { shouldSpawn: false };
  }

  // Get unlocked power-up types for current level
  const unlockedTypes = level !== undefined ? getUnlockedPowerUpTypes(level) : POWERUPS.TYPES as unknown as PowerUpType[];

  if (unlockedTypes.length === 0) {
    return { shouldSpawn: false };
  }

  // Create the power-up
  const lane = Math.floor(Math.random() * GAME_CONFIG.LANE_COUNT);
  const rand = Math.random();

  let randomType: PowerUpType;
  // Star has special probability if unlocked
  if (unlockedTypes.includes('star') && rand < PROBABILITIES.POWERUP_STAR_CHANCE) {
    randomType = 'star';
  } else {
    randomType = unlockedTypes[Math.floor(Math.random() * unlockedTypes.length)];
  }

  const powerUp: PowerUp = {
    id: `powerup-${now}-${lane}`,
    lane,
    position: POSITIONS.POWERUP_SPAWN_X,
    speed: ENTITY_SPEEDS.POWERUP,
    type: randomType,
  };

  return { shouldSpawn: true, entity: powerUp };
};

/**
 * Process all spawning for a tick
 * Returns new entities to add and whether spawn timers should be updated
 */
export const processSpawning = (
  lastCustomerSpawn: number,
  lastPowerUpSpawn: number,
  now: number,
  level: number,
  bossActive: boolean,
  levelPhase?: LevelPhase,
  customersServed?: number,
  customersRequired?: number,
  totalCustomersSpawned?: number,
  rushHourActive?: boolean,
): {
  newCustomer?: Customer;
  newPowerUp?: PowerUp;
  updateCustomerSpawnTime: boolean;
  updatePowerUpSpawnTime: boolean;
  triggerUfo?: boolean;
} => {
  const customerResult = trySpawnCustomer(
    lastCustomerSpawn, now, level, bossActive,
    levelPhase, customersServed, customersRequired, totalCustomersSpawned,
    rushHourActive,
  );
  const powerUpResult = trySpawnPowerUp(lastPowerUpSpawn, now, level);

  return {
    newCustomer: customerResult.entity,
    newPowerUp: powerUpResult.entity,
    updateCustomerSpawnTime: customerResult.shouldSpawn,
    updatePowerUpSpawnTime: powerUpResult.shouldSpawn,
    triggerUfo: customerResult.triggerUfo,
  };
};

/**
 * Try to trigger a Health Department Raid event.
 * 4 health inspectors spawn across all 4 lanes with staggered positions
 * so they visually enter the board one after another.
 */
export const tryTriggerHealthDeptRaid = (
  level: number,
  levelPhase: LevelPhase,
  raidActive: boolean,
  raidTriggeredThisLevel: boolean,
  levelStartTime: number,
  now: number,
): { shouldTrigger: boolean; rolled: boolean; inspectors?: Customer[] } => {
  if (level < HEALTH_DEPT_RAID.MIN_LEVEL) return { shouldTrigger: false, rolled: false };
  if (levelPhase !== 'playing') return { shouldTrigger: false, rolled: false };
  if (raidActive || raidTriggeredThisLevel) return { shouldTrigger: false, rolled: false };
  if (now - levelStartTime < HEALTH_DEPT_RAID.MIN_LEVEL_TIME) return { shouldTrigger: false, rolled: false };
  // Single roll per level — caller marks raidTriggeredThisLevel regardless of outcome
  if (Math.random() >= HEALTH_DEPT_RAID.TRIGGER_CHANCE) return { shouldTrigger: false, rolled: true };

  // One inspector per lane — all 4 lanes
  const selectedLanes = [0, 1, 2, 3];

  const speedMultiplier = getLevelSpeedMultiplier(level);
  const baseSpeed = ENTITY_SPEEDS.CUSTOMER_BASE * HEALTH_INSPECTOR.SPEED_MULTIPLIER;
  const speed = baseSpeed * speedMultiplier;

  const inspectors: Customer[] = selectedLanes.map((lane, index) => ({
    id: `raid-inspector-${now}-${lane}`,
    lane,
    // Stagger spawn positions so inspectors enter the board one at a time
    position: POSITIONS.SPAWN_X + index * HEALTH_DEPT_RAID.SPAWN_STAGGER,
    speed,
    served: false,
    hasPlate: false,
    leaving: false,
    disappointed: false,
    movingRight: false,
    healthInspector: true,
    critic: false,
    badLuckBrian: false,
    scumbagSteve: false,
  }));

  return { shouldTrigger: true, rolled: true, inspectors };
};
