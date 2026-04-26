# jalapeno-73198: Wallet Balance on Scorecard

## Task
Add wallet balance and money spent to scorecard

**Priority**: Low
**Tags**: Multi File

---

## Current State

### What Exists
- `gameState.bank` - current wallet balance
- Bank earned from: serving customers (+1), moltobenny (+69)
- Bank spent on: oven upgrades, speed upgrades, bribes ($25), power-ups ($5)

### What's Missing
- `totalEarned` - total money earned during game
- `totalSpent` - total money spent on upgrades/items
- These stats on the scorecard

---

## Implementation

### Phase 1: Add Stats (`src/types/game.ts`)
```typescript
interface GameStats {
  // ... existing stats
  totalEarned: number;
  totalSpent: number;
}
```

### Phase 2: Initialize (`src/lib/constants.ts`)
```typescript
stats: {
  // ... existing
  totalEarned: 0,
  totalSpent: 0,
}
```

### Phase 3: Track Earnings (`src/hooks/useGameLogic.ts`)
Wherever `bank +=` occurs, also add to `stats.totalEarned`

### Phase 4: Track Spending (`src/logic/storeSystem.ts`)
Wherever `bank -=` occurs, also add to `stats.totalSpent`

### Phase 5: Scorecard (`src/components/GameOverScreen.tsx`)
In `generateImage()` STATISTICS section (~line 367), add:
- Current Balance: $X
- Total Earned: $X
- Total Spent: $X

---

## Files to Modify
1. `src/types/game.ts`
2. `src/lib/constants.ts`
3. `src/hooks/useGameLogic.ts`
4. `src/logic/storeSystem.ts`
5. `src/components/GameOverScreen.tsx`

---

## Verification
- [ ] Stats initialize to 0
- [ ] Earnings tracked when serving customers
- [ ] Earnings tracked for moltobenny power-up
- [ ] Spending tracked for all store purchases
- [ ] Stats display correctly on scorecard
