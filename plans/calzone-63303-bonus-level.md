# calzone-63303: Bonus Level (Cow Level)

## Task
Sometimes have a variant with all nyan cat or something silly and fun like the cow level in Diablo - a random bonus level with lots of customers and powerful power-ups

**Priority**: Low

---

## Design

A rare, exciting event that transforms the game temporarily with:
- Themed visuals (all nyan cats, rainbow background, etc.)
- Dramatically increased spawn rates
- Only beneficial power-ups
- Score multiplier

### Trigger Options
1. **Random**: 5% chance on each level-up
2. **Guaranteed**: Every 25 levels (25, 50, 75, 100)
3. **Hybrid**: Guaranteed + random chance between

### Duration
30-60 seconds of bonus action

### Theme Options
| Theme | Customers | Visual | Flavor |
|-------|-----------|--------|--------|
| **Nyan Mode** | All nyan cats | Rainbow trails, sparkles | "Nyan nyan nyan!" |
| **Doge Mode** | All shiba inu | Comic sans, "wow" | "Such pizza, much yum" |
| **Pizza Rat** | NYC pizza rats | Subway tunnel BG | "The rat is inevitable" |

---

## Implementation

### Phase 1: Types (`src/types/game.ts`)

```typescript
export type BonusLevelTheme = 'nyan' | 'doge' | 'pizzaRat';

export interface BonusLevel {
  active: boolean;
  theme: BonusLevelTheme;
  startTime: number;
  duration: number;
}

// Add to GameState:
bonusLevel: BonusLevel | null;
```

### Phase 2: Constants (`src/lib/constants.ts`)

```typescript
export const BONUS_LEVEL_CONFIG = {
  TRIGGER_CHANCE: 0.05,        // 5% per level-up
  GUARANTEED_LEVELS: [25, 50, 75, 100],
  DURATION: 45000,             // 45 seconds
  CUSTOMER_SPAWN_MULTIPLIER: 3,
  POWERUP_SPAWN_MULTIPLIER: 5,
  SCORE_MULTIPLIER: 2,
  THEMES: ['nyan', 'doge', 'pizzaRat'] as const,
};
```

### Phase 3: Game Logic (`src/hooks/useGameLogic.ts`)

```typescript
// On level-up, check for bonus level trigger
const shouldTriggerBonusLevel = (level: number): boolean => {
  if (BONUS_LEVEL_CONFIG.GUARANTEED_LEVELS.includes(level)) return true;
  return Math.random() < BONUS_LEVEL_CONFIG.TRIGGER_CHANCE;
};

// Start bonus level
const startBonusLevel = (now: number): BonusLevel => ({
  active: true,
  theme: BONUS_LEVEL_CONFIG.THEMES[Math.floor(Math.random() * BONUS_LEVEL_CONFIG.THEMES.length)],
  startTime: now,
  duration: BONUS_LEVEL_CONFIG.DURATION,
});

// In game tick: check if bonus level expired
if (bonusLevel && now - bonusLevel.startTime > bonusLevel.duration) {
  newState.bonusLevel = null;
}
```

### Phase 4: Spawn System (`src/logic/spawnSystem.ts`)

```typescript
// Modify spawn rates when bonus active
const customerSpawnMultiplier = bonusLevel?.active
  ? BONUS_LEVEL_CONFIG.CUSTOMER_SPAWN_MULTIPLIER
  : 1;

const powerupSpawnMultiplier = bonusLevel?.active
  ? BONUS_LEVEL_CONFIG.POWERUP_SPAWN_MULTIPLIER
  : 1;

// During bonus: only spawn good power-ups (no beer)
const bonusPowerUpTypes = ['honey', 'ice-cream', 'doge', 'nyan', 'star', 'pepe'];
```

### Phase 5: Visuals (`src/components/GameBoard.tsx`)

```typescript
// Conditional styling for bonus level
const bonusLevelStyles = bonusLevel?.active ? {
  nyan: 'animate-pulse bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500',
  doge: 'bg-amber-200 font-comic',
  pizzaRat: 'bg-gray-700',
}[bonusLevel.theme] : '';

// Customer sprite override during bonus
const getBonusCustomerSprite = (theme: BonusLevelTheme) => ({
  nyan: nyanCatImg,
  doge: dogeImg,
  pizzaRat: pizzaRatImg, // Need new asset
}[theme]);
```

### Phase 6: UI Indicator

Show bonus level timer/indicator:
```tsx
{bonusLevel?.active && (
  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white px-4 py-2 rounded-b-lg font-bold animate-bounce">
    🌈 BONUS LEVEL! 🌈
    <span className="ml-2">{Math.ceil((bonusLevel.duration - (now - bonusLevel.startTime)) / 1000)}s</span>
  </div>
)}
```

---

## Files to Modify
1. `src/types/game.ts` - BonusLevel interface
2. `src/lib/constants.ts` - BONUS_LEVEL_CONFIG
3. `src/hooks/useGameLogic.ts` - Trigger and timer logic
4. `src/logic/spawnSystem.ts` - Modified spawn rates
5. `src/components/GameBoard.tsx` - Visual transformation
6. `src/components/Customer.tsx` - Themed customer sprites

## Assets Needed (optional)
- `pizza-rat.png` for Pizza Rat theme
- Bonus level music/sound effects

---

## Verification
- [ ] Bonus level triggers at guaranteed levels
- [ ] Random trigger works (~5% chance)
- [ ] Theme is randomly selected
- [ ] Customers spawn 3x faster
- [ ] Power-ups spawn 5x more often
- [ ] No beer spawns during bonus (only good power-ups)
- [ ] Score multiplier applies
- [ ] Timer shows correctly
- [ ] Level ends after duration
- [ ] Visual theme applies to background/customers
