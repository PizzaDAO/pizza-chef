import { UfoAnimationState } from '../types/game';
import { ALIEN } from '../lib/constants';

/**
 * Initialize a new UFO animation state.
 * The UFO flies from right (100%) to left (-10%) over UFO_FLY_DURATION ms,
 * dropping the alien at dropX.
 */
export const initializeUfo = (lane: number, dropX: number, now: number): UfoAnimationState => ({
  active: true,
  xPosition: 100,
  dropLane: lane,
  dropPosition: dropX,
  startTime: now,
  dropped: false,
});

/**
 * Update the UFO animation each tick.
 * Linear interpolation from 100 -> -10 over UFO_FLY_DURATION.
 * Sets dropped = true when the UFO passes the drop position.
 * Sets active = false when the UFO exits the screen.
 */
export const updateUfoAnimation = (ufo: UfoAnimationState, now: number): UfoAnimationState => {
  const elapsed = now - ufo.startTime;
  const progress = Math.min(1, elapsed / ALIEN.UFO_FLY_DURATION);

  // Linear interpolation: 100 -> -10
  const xPosition = 100 - progress * 110;

  const dropped = ufo.dropped || xPosition <= ufo.dropPosition;
  const active = xPosition > -10;

  return {
    ...ufo,
    xPosition,
    dropped,
    active,
  };
};
