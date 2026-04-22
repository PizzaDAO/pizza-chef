# Pizza Chef Handoff - Feb 2, 2026

## Project
- **Repo**: PizzaDAO/pizza-chef-v2
- **Sheet**: https://docs.google.com/spreadsheets/d/1J3-Usmmfd2B_av_BVvC9m70cRdpLvmGv5Wm2d6m_Y_w
- **TaskIDs**: Now using pizza-themed IDs (e.g., `buffalo-51422`, `pepperoni-42011`)

---

## In Progress

### `buffalo-51422` - Pizza Mafia Customer
**Status**: Implementation agent running
**Description**: When served, spawns 8 pizza slices flying in all directions that feed other customers
**Sprite**: `public/sprites/pizza-mafia.png` (fedora emoji, already added)
**Plan**: `plans/buffalo-51422-pizza-mafia.md`
**Branch**: `buffalo-51422-pizza-mafia`

Check agent status or re-run implementation if needed.

---

## Ready for Review

### `funghi-26273` - Disable Submit Button
**Status**: COMPLETE - Ready for review
**Preview**: https://pizza-chef-v2-git-funghi-26273-disable-submit-pizza-dao.vercel.app
**PR**: https://github.com/PizzaDAO/pizza-chef-v2/pull/1
**Changes**: 2 lines in `GameOverScreen.tsx` - adds `|| !playerName.trim()` to disabled prop

---

## Plans Ready to Implement

All plans saved in `plans/` directory:

### `bellpepper-29644` - Retirement Joke
**File**: `plans/bellpepper-29644-retirement-joke.md`
**Complexity**: Single file (`ItemStore.tsx`)
**Summary**: Shows "Saving for retirement? 🤔" when closing store without purchasing (if bank > 0)

### `tomato-43931` - Skill Rating Tuning
**File**: `plans/tomato-43931-skill-rating.md`
**Complexity**: Single file (`GameOverScreen.tsx`)
**Summary**: Rebalance formula so score doesn't dominate. Currently 70k score = instant S+. Proposed: cap score at 25 pts, boost skill metrics.

### `jalapeno-73198` - Wallet Balance on Scorecard
**File**: `plans/jalapeno-73198-wallet-scorecard.md`
**Complexity**: 5 files
**Summary**: Add `totalEarned` and `totalSpent` tracking, display on scorecard canvas

### `calzone-63303` - Bonus Level (Cow Level)
**File**: `plans/calzone-63303-bonus-level.md`
**Complexity**: 6 files
**Summary**: Rare random event (5% per level-up) with themed visuals, 3x customers, 5x power-ups, 2x score

---

## Other Tasks from Sheet

### In Progress (in sheet)
- `buffalo-65243` - Disappointed customer faces should be custom sprites
- `arugula-81300` - Secret badges for certain achievements

### Quick Wins (Single File)
- `arugula-12689` - Doge gives 420 pts, nyan gives 777
- `oregano-93698` - Round oven timer
- `capricciosa-95760` - Sound effect for star invincible mode
- `pineapple-42415` - Show scorecard every 10 levels

### Bugs
- `capers-24502` - Landscape cuts off on iPhone SE
- `burrata-48789` - Bad luck brian bug with nyan near counter
- `deep-dish-37767` - Fix boss health bar

### Skipped
- `margherita-79960` - Change drool to yum face (mark as Skip in sheet)

---

## sheets-claude MCP Updates

Fixed the sheets-claude MCP to auto-create TaskID column if missing:
- Commits in `C:\Users\samgo\OneDrive\Documents\PizzaDAO\Code\sheets-claude`
- TaskID column now inserted on right side of table (not column A)
- Pizza-themed IDs auto-generated for all tasks

---

## Workflow Reminder

1. **Get tasks**: `mcp__sheets-claude__get_project_tasks`
2. **Plan**: Spawn planning agents → save to `plans/{task-id}.md`
3. **Implement**: Spawn agent with worktree:
   ```
   git worktree add ../pizza-chef-{task-id} -b {task-id}-{name}
   ```
4. **Review**: Check Vercel preview URL
5. **Merge**: `gh pr merge {pr-number} --merge`
6. **Cleanup**: `git worktree remove ../pizza-chef-{task-id}`

---

## Resume Commands

```
# Check pizza mafia agent status (if still running)
# Or re-implement if it failed

# Implement next tasks:
# - bellpepper-29644 (retirement joke)
# - tomato-43931 (skill rating)

# Review and merge:
# - funghi-26273 PR #1
```
