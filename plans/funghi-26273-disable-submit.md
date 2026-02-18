# funghi-26273: Disable Submit Button if No Name

## Task
Disable the "submit score" button on the game over and leaderboard screens if there's no name entered

**Priority**: Low
**Tags**: Single File

---

## Analysis

### Current Behavior
- `playerName` state initialized as empty string
- Placeholder shows "Pizza Trainee" (DEFAULT_NAME)
- When submitting with empty name, defaults to "Pizza Trainee"
- Buttons are NOT disabled when name is empty

### Pattern Already Exists
`SubmitScore.tsx` line 88 already does this:
```tsx
disabled={submitting || !playerName.trim()}
```

---

## Implementation

**File**: `src/components/GameOverScreen.tsx`

### Change 1: Leaderboard View Button (line 702)
```tsx
// Current:
disabled={submitting}

// Change to:
disabled={submitting || !playerName.trim()}
```

### Change 2: Main Scorecard Button (line 803)
```tsx
// Current:
disabled={submitting}

// Change to:
disabled={submitting || !playerName.trim()}
```

---

## Verification
- [ ] Submit button disabled when name input is empty
- [ ] Submit button enabled when name has content
- [ ] Button still disabled during submission (submitting state)
- [ ] Both views (scorecard and leaderboard) have same behavior
