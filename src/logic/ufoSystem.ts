import { UfoAnimationState } from '../types/game';
import { ALIEN } from '../lib/constants';

/**
 * Convert a lane number to a Y-position percentage (matching lane layout in GameBoard).
 * Lanes are at `lane * 25 + 6` for top of lane, roughly `lane * 25 + 13` for center.
 * We use a value that visually places the UFO above the lane to "drop" into it.
 */
const laneToYPercent = (lane: number): number => lane * 25 + 2;

/**
 * Initialize a new UFO animation state for the "drop" phase.
 * The UFO flies diagonally from a random side (left or right) toward the drop position,
 * angling down from off-screen to the target lane.
 */
export const initializeUfo = (lane: number, dropX: number, now: number): UfoAnimationState => {
  const direction = Math.random() < 0.5 ? 'left-to-right' : 'right-to-left';
  return {
    active: true,
    xPosition: direction === 'left-to-right' ? -10 : 110,
    yPosition: -10, // start above screen
    dropLane: lane,
    dropPosition: dropX,
    startTime: now,
    dropped: false,
    direction,
    phase: 'drop',
  };
};

/**
 * Initialize a pickup UFO animation. The UFO flies in diagonally to the alien's
 * position, picks it up, then exits.
 */
export const initializePickupUfo = (lane: number, xPos: number, now: number): UfoAnimationState => {
  const direction = Math.random() < 0.5 ? 'left-to-right' : 'right-to-left';
  return {
    active: true,
    xPosition: direction === 'left-to-right' ? -10 : 110,
    yPosition: -10,
    dropLane: lane, // reuse for target lane
    dropPosition: xPos, // reuse for target x
    startTime: now,
    dropped: false,
    direction,
    phase: 'pickup',
    pickupLane: lane,
    pickupX: xPos,
  };
};

/**
 * Update the UFO animation each tick.
 *
 * DROP phase: flies diagonally from entry side toward dropPosition/dropLane,
 * then continues past and exits off the opposite side.
 *
 * PICKUP phase: flies diagonally toward the alien's position.
 * Once it arrives, transitions to PICKUP-EXIT and flies off diagonally.
 */
export const updateUfoAnimation = (ufo: UfoAnimationState, now: number): UfoAnimationState => {
  const elapsed = now - ufo.startTime;
  const progress = Math.min(1, elapsed / ALIEN.UFO_FLY_DURATION);

  if (ufo.phase === 'drop') {
    return updateDropPhase(ufo, progress);
  } else if (ufo.phase === 'pickup') {
    return updatePickupPhase(ufo, progress, now);
  } else {
    // pickup-exit
    return updatePickupExitPhase(ufo, progress);
  }
};

/**
 * DROP phase: diagonal entry from one side, drop the alien at dropPosition,
 * then continue off the opposite side.
 */
const updateDropPhase = (ufo: UfoAnimationState, progress: number): UfoAnimationState => {
  const targetY = laneToYPercent(ufo.dropLane);
  const dropX = ufo.dropPosition;

  let xPosition: number;
  let yPosition: number;

  // X: fly to dropPosition at progress 0.5 (bottom of arc), then continue off-screen
  if (progress <= 0.5) {
    const xProgress = progress / 0.5;
    const startX = ufo.direction === 'left-to-right' ? -10 : 110;
    xPosition = startX + xProgress * (dropX - startX);
  } else {
    const xProgress = (progress - 0.5) / 0.5;
    const endX = ufo.direction === 'left-to-right' ? 110 : -10;
    xPosition = dropX + xProgress * (endX - dropX);
  }

  // Y: descend from -10 to targetY at progress 0.5 (bottom), then ascend back up
  if (progress <= 0.5) {
    const yProgress = progress / 0.5;
    yPosition = -10 + yProgress * (targetY + 10);
  } else {
    const yProgress = (progress - 0.5) / 0.5;
    yPosition = targetY - yProgress * (targetY + 10);
  }

  // Drop the alien at the bottom of the arc (progress >= 0.5)
  const dropped = ufo.dropped || progress >= 0.5;
  const active = progress < 1;

  return {
    ...ufo,
    xPosition,
    yPosition,
    dropped,
    active,
  };
};

/**
 * PICKUP phase: fly diagonally toward the alien's position.
 * When we arrive, switch to pickup-exit.
 */
const updatePickupPhase = (ufo: UfoAnimationState, progress: number, now: number): UfoAnimationState => {
  const targetX = ufo.pickupX ?? ufo.dropPosition;
  const targetY = laneToYPercent(ufo.pickupLane ?? ufo.dropLane);

  let xPosition: number;
  let yPosition: number;

  // Fly from entry side to the target position over the duration
  if (ufo.direction === 'left-to-right') {
    const startX = -10;
    xPosition = startX + progress * (targetX - startX);
  } else {
    const startX = 110;
    xPosition = startX + progress * (targetX - startX);
  }

  // Y: descend from -10 to targetY
  yPosition = -10 + progress * (targetY + 10);

  // Check if we've arrived (progress >= 1 means duration elapsed)
  if (progress >= 1) {
    // Switch to pickup-exit phase
    return {
      ...ufo,
      xPosition: targetX,
      yPosition: targetY,
      dropped: true, // signals "picked up"
      phase: 'pickup-exit',
      startTime: now, // reset timer for exit phase
    };
  }

  return {
    ...ufo,
    xPosition,
    yPosition,
    active: true,
  };
};

/**
 * PICKUP-EXIT phase: fly diagonally off-screen (upward and toward original entry side).
 */
const updatePickupExitPhase = (ufo: UfoAnimationState, progress: number): UfoAnimationState => {
  const startX = ufo.pickupX ?? ufo.dropPosition;
  const startY = laneToYPercent(ufo.pickupLane ?? ufo.dropLane);

  // Exit toward the same side we came from (reverse of entry direction)
  let xPosition: number;
  if (ufo.direction === 'left-to-right') {
    // Exit to the right
    xPosition = startX + progress * (110 - startX);
  } else {
    // Exit to the left
    xPosition = startX - progress * (startX + 10);
  }

  // Y: ascend from startY back up to -10
  const yPosition = startY - progress * (startY + 10);

  const active = ufo.direction === 'left-to-right'
    ? xPosition < 110
    : xPosition > -10;

  return {
    ...ufo,
    xPosition,
    yPosition,
    active: active && progress < 1,
  };
};
