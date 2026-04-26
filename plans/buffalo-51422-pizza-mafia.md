# buffalo-51422: Pizza Mafia Customers

## Task
Add pizza mafia customers that, when served, spawn 8 slices flying in every direction that feed other customers

**Priority**: High
**Tags**: Multi File

---

## Design

The Pizza Mafia customer is a **beneficial special customer** that creates a chain reaction when served:
1. When served with a pizza slice, they "explode" into 8 pizza slices
2. The 8 slices fly outward in radial directions (N, NE, E, SE, S, SW, W, NW)
3. Exploding slices can feed other customers they collide with
4. Mafia customer returns a plate and gives normal scoring

### Key Decisions
- **New entity type `MafiaSlice`** with `speedX`/`speedY` for diagonal movement
- Mafia slices expire after ~2 seconds or when off-screen
- Mafia slices do NOT return plates when feeding (to avoid chaos)
- Text message when served: "Bada bing!"

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/game.ts` | Add `MafiaSlice` interface, `'pizzaMafia'` to `CustomerVariant`, `mafiaSlices` to `GameState` |
| `src/lib/constants.ts` | Add `PIZZA_MAFIA_CHANCE: 0.05`, `MAFIA_SLICE_CONFIG` |
| `src/logic/spawnSystem.ts` | Add mafia customer spawning logic |
| `src/logic/customerSystem.ts` | Add `'MAFIA_SERVED'` event, hit handling |
| `src/hooks/useGameLogic.ts` | Integrate mafia slice system |
| `src/components/Customer.tsx` | Add mafia sprite handling |
| `src/components/GameBoard.tsx` | Render mafia slices |

## Files to Create

| File | Description |
|------|-------------|
| `src/logic/mafiaSliceSystem.ts` | Spawning, movement, collision for mafia slices |
| `src/components/MafiaSlice.tsx` | Render component for flying mafia slices |
| `public/sprites/pizza-mafia.png` | Mobster-themed customer sprite |

---

## Implementation Steps

### Phase 1: Types (`src/types/game.ts`)

```typescript
// Add to CustomerVariant
export type CustomerVariant = 'normal' | 'critic' | 'badLuckBrian' | 'scumbagSteve' | 'pizzaMafia';

// New interface
export interface MafiaSlice {
  id: string;
  lane: number;      // Fractional for diagonal movement
  position: number;  // X position (percentage)
  speedX: number;    // Horizontal speed
  speedY: number;    // Vertical speed (lane change rate)
  startTime: number; // For expiration
}

// Add to GameState
mafiaSlices: MafiaSlice[];
```

### Phase 2: Constants (`src/lib/constants.ts`)

```typescript
PIZZA_MAFIA_CHANCE: 0.05, // 5% spawn rate

export const MAFIA_SLICE_CONFIG = {
  SLICE_COUNT: 8,
  SPEED: 2.5,
  LIFETIME: 2000,      // ms
  LANE_SPEED: 0.02,    // Vertical movement per frame
};
```

### Phase 3: Spawn System (`src/logic/spawnSystem.ts`)

Add to variant selection in `trySpawnCustomer()`:
```typescript
Math.random() < PROBABILITIES.PIZZA_MAFIA_CHANCE ? 'pizzaMafia' : 'normal';
```

### Phase 4: Customer System (`src/logic/customerSystem.ts`)

Add `'MAFIA_SERVED'` to `CustomerHitEvent` type.

In `processCustomerHit()`:
```typescript
if (customer.pizzaMafia) {
  events.push('MAFIA_SERVED');
  // Return plate, set served, add text message "Bada bing!"
}
```

### Phase 5: New Mafia Slice System (`src/logic/mafiaSliceSystem.ts`)

```typescript
// Spawn 8 slices in radial directions
export const spawnMafiaSlices = (lane: number, position: number, now: number): MafiaSlice[]

// Update positions, filter expired/off-screen
export const updateMafiaSlices = (slices: MafiaSlice[], now: number): MafiaSlice[]

// Check collision with customer (fractional lane tolerance)
export const checkMafiaSliceCollision = (slice: MafiaSlice, customer: Customer): boolean
```

### Phase 6: Game Logic (`src/hooks/useGameLogic.ts`)

1. Handle `MAFIA_SERVED` event - spawn 8 mafia slices
2. Update mafia slice positions each tick
3. Check mafia slice collisions with customers
4. Remove slices on collision (feed customer without plate return)

### Phase 7: Components

**MafiaSlice.tsx**: Render with rotation based on velocity direction

**Customer.tsx**: Add `pizza-mafia.png` sprite for `'pizzaMafia'` variant

**GameBoard.tsx**: Map and render `gameState.mafiaSlices`

---

## Verification

- [ ] Mafia customers spawn at ~5% rate
- [ ] Correct sprite displays
- [ ] 8 slices explode outward when served
- [ ] Slices feed other customers on collision
- [ ] Slices expire after 2 seconds
- [ ] Scoring works correctly
- [ ] Plate returns from mafia customer
- [ ] Edge cases: frozen, boss battle, multiple mafia, nyan cat

---

## Asset Needed

**pizza-mafia.png**: Mobster/gangster themed character with pizza aesthetics (suited figure with fedora, pizza iconography)
