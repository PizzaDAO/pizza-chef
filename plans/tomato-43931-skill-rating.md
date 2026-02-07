# tomato-43931: Skill Rating Tuning

## Task
Fine tune skill rating system that evaluates your performance

**Priority**: Low
**Tags**: Single File

---

## Current Formula (`GameOverScreen.tsx` lines 59-77)

```typescript
let points = 0;
points += score / 1000;                                    // UNCAPPED - dominates everything
points += Math.min(level * 0.1, 1);                        // Max 1 point
points += Math.min(stats.longestCustomerStreak * 0.05, 1); // Max 1 point
points += Math.min(stats.largestPlateStreak * 0.05, 0.5);  // Max 0.5 points
points += Math.min(efficiency / 100, 1);                   // Max 1 point
points += Math.min(totalPowerUps * 0.05, 0.5);             // Max 0.5 points
```

### Grade Thresholds
| Grade | Points | Title |
|-------|--------|-------|
| S+ | 70+ | Legendary Pizzaiolo |
| S | 44+ | Master Pizzaiolo |
| A | 27+ | Pizzaiolo |
| B | 12+ | Line Cook |
| C | 6+ | Prep Cook |
| D | 3+ | Busser |
| F | <3 | Dishwasher |

---

## Problems

1. **Score dominates**: 70k score = 70 points = instant S+
2. **Skill metrics capped at 4.5 total** - nearly meaningless
3. **Unused metrics**: `platesCaught`, `ovenUpgradesMade` not used
4. **Missing metrics**: Critics served, bosses defeated, death quality

---

## Recommended Fix: Balanced Reweighting

```typescript
let points = 0;

// Score contribution (reduced weight, soft cap)
points += Math.min(score / 2000, 25);                       // Max 25 points at 50k score

// Level progression
points += Math.min(level * 0.5, 10);                        // Max 10 points at level 20

// Skill metrics (increased weight)
points += Math.min(stats.longestCustomerStreak * 0.2, 5);   // Max 5 points at 25 streak
points += Math.min(stats.largestPlateStreak * 0.2, 3);      // Max 3 points at 15 streak
points += Math.min(stats.platesCaught * 0.1, 5);            // Max 5 points at 50 plates (NEW)

// Efficiency (meaningful weight)
const efficiency = stats.slicesBaked > 0 ? (stats.customersServed / stats.slicesBaked) * 100 : 0;
points += Math.min(efficiency / 20, 5);                     // Max 5 points at 100% efficiency

// Power-up mastery
points += Math.min(totalPowerUps * 0.1, 2);                 // Max 2 points

// Total max from skill: ~35 points
// Total max from score: 25 points
// Result: Skill can match score contribution
```

### New Thresholds
| Grade | Points | Title |
|-------|--------|-------|
| S+ | 50+ | Legendary Pizzaiolo |
| S | 40+ | Master Pizzaiolo |
| A | 30+ | Pizzaiolo |
| B | 20+ | Line Cook |
| C | 12+ | Prep Cook |
| D | 6+ | Busser |
| F | <6 | Dishwasher |

---

## Files to Modify
1. `src/components/GameOverScreen.tsx` - Update `calculateSkillRating` function

## Optional Enhancements
- Add `SKILL_RATING_CONFIG` to constants.ts for easy tuning
- Track additional metrics (critics served, boss kills)

---

## Verification
- [ ] Low score + high skill = decent grade (B or higher)
- [ ] High score + low efficiency = not automatic S+
- [ ] Plate catching contributes to rating
- [ ] Grade distribution feels fair across skill levels
