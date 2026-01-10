import { Customer, PowerUp } from '../types/game';
import {
  SPAWN_RATES,
  GAME_CONFIG,
  PROBABILITIES,
  POSITIONS,
  ENTITY_SPEEDS,
  POWERUPS
} from '../lib/constants';

export interface SpawnResult<T> {
  shouldSpawn: boolean;
  entity?: T;
}

/**
 * Calculate the spawn delay based on level
 */
export const getCustomerSpawnDelay = (level: number): number => {
  return SPAWN_RATES.CUSTOMER_MIN_INTERVAL_BASE -
    (level * SPAWN_RATES.CUSTOMER_MIN_INTERVAL_DECREMENT);
};

/**
 * Calculate effective spawn rate based on level and boss status
 */
export const getEffectiveSpawnRate = (level: number, bossActive: boolean): number => {
  const levelSpawnRate =
    SPAWN_RATES.CUSTOMER_BASE_RATE +
    (level - 1) * SPAWN_RATES.CUSTOMER_LEVEL_INCREMENT;

  return bossActive ? levelSpawnRate * 0.5 : levelSpawnRate;
};

/**
 * Check if a customer should spawn and create one if so
 */
export const trySpawnCustomer = (
  lastSpawnTime: number,
  now: number,
  level: number,
  bossActive: boolean
): SpawnResult<Customer> => {
  const spawnDelay = getCustomerSpawnDelay(level);
  const effectiveSpawnRate = getEffectiveSpawnRate(level, bossActive);

  // Check time gate and random chance
  if (now - lastSpawnTime < spawnDelay) {
    return { shouldSpawn: false };
  }

  if (Math.random() >= effectiveSpawnRate * 0.01) {
    return { shouldSpawn: false };
  }

  // Create the customer
  const lane = Math.floor(Math.random() * GAME_CONFIG.LANE_COUNT);
  const disappointedEmojis = ['😢', '😭', '😠', '🤬'];
  const isCritic = Math.random() < PROBABILITIES.CRITIC_CHANCE;
  const isBadLuckBrian = !isCritic && Math.random() < PROBABILITIES.BAD_LUCK_BRIAN_CHANCE;

  const customer: Customer = {
    id: `customer-${now}-${lane}`,
    lane,
    position: POSITIONS.SPAWN_X,
    speed: ENTITY_SPEEDS.CUSTOMER_BASE,
    served: false,
    hasPlate: false,
    leaving: false,
    disappointed: false,
    disappointedEmoji: disappointedEmojis[Math.floor(Math.random() * disappointedEmojis.length)],
    movingRight: false,
    critic: isCritic,
    badLuckBrian: isBadLuckBrian,
    flipped: isBadLuckBrian,
  };

  return { shouldSpawn: true, entity: customer };
};

/**
 * Check if a power-up should spawn and create one if so
 */
export const trySpawnPowerUp = (
  lastSpawnTime: number,
  now: number
): SpawnResult<PowerUp> => {
  // Check time gate
  if (now - lastSpawnTime < SPAWN_RATES.POWERUP_MIN_INTERVAL) {
    return { shouldSpawn: false };
  }

  // Check random chance
  if (Math.random() >= SPAWN_RATES.POWERUP_CHANCE) {
    return { shouldSpawn: false };
  }

  // Create the power-up
  const lane = Math.floor(Math.random() * GAME_CONFIG.LANE_COUNT);
  const rand = Math.random();
  const randomType = rand < PROBABILITIES.POWERUP_STAR_CHANCE
    ? 'star'
    : POWERUPS.TYPES[Math.floor(Math.random() * POWERUPS.TYPES.length)];

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
  bossActive: boolean
): {
  newCustomer?: Customer;
  newPowerUp?: PowerUp;
  updateCustomerSpawnTime: boolean;
  updatePowerUpSpawnTime: boolean;
} => {
  const customerResult = trySpawnCustomer(lastCustomerSpawn, now, level, bossActive);
  const powerUpResult = trySpawnPowerUp(lastPowerUpSpawn, now);

  return {
    newCustomer: customerResult.entity,
    newPowerUp: powerUpResult.entity,
    updateCustomerSpawnTime: customerResult.shouldSpawn,
    updatePowerUpSpawnTime: powerUpResult.shouldSpawn,
  };
};
