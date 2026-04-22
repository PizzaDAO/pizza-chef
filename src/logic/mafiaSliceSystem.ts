// src/logic/mafiaSliceSystem.ts
import { MafiaSlice, Customer, isCustomerLeaving } from '../types/game';
import { MAFIA_SLICE_CONFIG, GAME_CONFIG, ENTITY_SPEEDS } from '../lib/constants';

/**
 * Spawn mafia slices aimed at nearby customers (including other mafia).
 * Leads the target based on their movement speed so slices don't miss.
 * One slice per target customer. No slices toward the chef (left).
 */
export const spawnMafiaSlices = (
  lane: number,
  position: number,
  now: number,
  customers: Customer[],
  mafiaCustomerId: string
): MafiaSlice[] => {
  // Find nearby approaching customers (not leaving, not THIS mafia customer)
  const targets = customers.filter(c =>
    !isCustomerLeaving(c) &&
    c.id !== mafiaCustomerId &&
    Math.abs(c.position - position) < 40 // within range
  );

  if (targets.length === 0) return [];

  const sliceSpeed = ENTITY_SPEEDS.PIZZA; // Same speed as chef's pizza

  return targets.map((target, i) => {
    // Lead the target: predict where they'll be when the slice arrives
    // Customers walk left at their speed, so predict future position
    const dx = target.position - position;
    const dy = target.lane - lane;
    const straightDist = Math.sqrt(dx * dx + (dy * 25) * (dy * 25)) || 1; // dy scaled to % units
    const timeToReach = straightDist / sliceSpeed; // frames to reach target

    // Target's predicted position (customers move left at their speed)
    const targetSpeed = target.movingRight ? target.speed * 2 : -target.speed;
    const predictedX = target.position + targetSpeed * timeToReach;
    const predictedLane = target.lane; // lane changes are unpredictable, just aim at current lane

    // Aim at predicted position
    const leadDx = predictedX - position;
    const leadDy = predictedLane - lane;
    const leadDist = Math.sqrt(leadDx * leadDx + leadDy * leadDy) || 1;

    return {
      id: `mafia-slice-${now}-${i}`,
      lane,
      position,
      speedX: (leadDx / leadDist) * sliceSpeed,
      speedY: (leadDy / leadDist) * MAFIA_SLICE_CONFIG.LANE_SPEED * 100,
      startTime: now,
    };
  });
};

/**
 * Update mafia slice positions and remove expired ones
 */
export const updateMafiaSlices = (
  slices: MafiaSlice[],
  now: number
): MafiaSlice[] => {
  return slices
    .filter(slice => {
      // Remove expired slices
      const elapsed = now - slice.startTime;
      if (elapsed > MAFIA_SLICE_CONFIG.LIFETIME) return false;

      // Remove slices that went off screen
      if (slice.position < -10 || slice.position > 110) return false;
      if (slice.lane < -1 || slice.lane > GAME_CONFIG.LANE_COUNT) return false;

      return true;
    })
    .map(slice => ({
      ...slice,
      position: slice.position + slice.speedX,
      lane: slice.lane + slice.speedY,
    }));
};

/**
 * Check if a mafia slice collides with a customer
 */
export const checkMafiaSliceCollision = (
  slice: MafiaSlice,
  customer: Customer
): boolean => {
  // Don't hit customers that are already leaving
  if (isCustomerLeaving(customer)) return false;

  // Check if in same lane (with tolerance for fractional lanes)
  const laneDiff = Math.abs(slice.lane - customer.lane);
  if (laneDiff > 0.5) return false;

  // Check horizontal collision
  const posDiff = Math.abs(slice.position - customer.position);
  if (posDiff > 5) return false;

  return true;
};
