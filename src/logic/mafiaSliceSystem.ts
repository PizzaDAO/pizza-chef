// src/logic/mafiaSliceSystem.ts
import { MafiaSlice, Customer, isCustomerLeaving } from '../types/game';
import { MAFIA_SLICE_CONFIG, GAME_CONFIG, ENTITY_SPEEDS } from '../lib/constants';

/**
 * Spawn mafia slices aimed at nearby customers (including other mafia).
 * Uses interception math to lead targets so slices don't miss.
 * One slice per target customer.
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
    Math.abs(c.position - position) < 50 // within range
  );

  if (targets.length === 0) return [];

  const sliceSpeed = ENTITY_SPEEDS.PIZZA; // position % per tick

  return targets.map((target, i) => {
    const dx = target.position - position;
    const laneDiff = target.lane - lane;

    // Target's X velocity (position % per tick)
    // Approaching customers move left; departing move right at 2x
    const targetVelX = target.movingRight ? target.speed * 2 : -target.speed;

    // Solve for interception time on X axis:
    // position + speedX * t = target.position + targetVelX * t
    // For a slice moving toward the target at sliceSpeed:
    // speedX = sliceSpeed (toward target) or -sliceSpeed
    const sliceVelX = dx >= 0 ? sliceSpeed : -sliceSpeed;
    const closingSpeed = sliceVelX - targetVelX;

    let t: number;
    if (Math.abs(closingSpeed) < 0.01) {
      // Target moving same speed/direction — just aim straight
      t = Math.abs(dx) / sliceSpeed;
    } else {
      t = dx / closingSpeed;
    }

    // Clamp to reasonable range (don't aim too far ahead)
    t = Math.max(0, Math.min(t, 30));

    // Predicted intercept position
    const interceptX = target.position + targetVelX * t;
    const interceptLane = target.lane; // lane changes are unpredictable

    // Calculate velocity components
    const aimDx = interceptX - position;
    // speedX: travel at full slice speed toward the intercept
    const speedX = aimDx >= 0 ? sliceSpeed : -sliceSpeed;
    // speedY: arrive at the correct lane over the interception time
    const speedY = t > 0 ? laneDiff / t : 0;

    return {
      id: `mafia-slice-${now}-${i}`,
      lane,
      position,
      speedX,
      speedY,
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
