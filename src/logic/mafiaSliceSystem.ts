// src/logic/mafiaSliceSystem.ts
import { MafiaSlice, Customer, isCustomerLeaving } from '../types/game';
import { MAFIA_SLICE_CONFIG, GAME_CONFIG } from '../lib/constants';

/**
 * Spawn 8 mafia slices radiating outward from the served customer's position
 */
export const spawnMafiaSlices = (
  lane: number,
  position: number,
  now: number
): MafiaSlice[] => {
  const slices: MafiaSlice[] = [];
  const { SLICE_COUNT, SPEED } = MAFIA_SLICE_CONFIG;

  for (let i = 0; i < SLICE_COUNT; i++) {
    // Distribute slices evenly in a circle (360 / 8 = 45 degrees apart)
    const angle = (i / SLICE_COUNT) * 2 * Math.PI;

    slices.push({
      id: `mafia-slice-${now}-${i}`,
      lane,
      position,
      speedX: Math.cos(angle) * SPEED,
      speedY: Math.sin(angle) * MAFIA_SLICE_CONFIG.LANE_SPEED * 100, // Scale for lane units
      startTime: now,
    });
  }

  return slices;
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
