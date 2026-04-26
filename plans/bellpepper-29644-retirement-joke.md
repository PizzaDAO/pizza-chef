# bellpepper-29644: Retirement Joke

## Task
If you don't purchase anything in the store, the game asks you if you're "saving for retirement?"

**Priority**: Low
**Tags**: Single File

---

## Design

When player opens store and closes without buying anything (but had money), show brief humorous message.

### Conditions to Show Message
- Player closed store
- Player made NO purchases during this visit
- Player had bank > 0 (could have bought something)

---

## Implementation (`src/components/ItemStore.tsx`)

### 1. Add Purchase Tracking
```typescript
const madePurchaseRef = useRef(false);
const [showRetirementQuip, setShowRetirementQuip] = useState(false);
```

### 2. Track Each Purchase
Wrap purchase handlers to set flag when successful:
```typescript
const handleUpgradeOven = (lane: number) => {
  if (canAffordUpgrade(lane)) madePurchaseRef.current = true;
  onUpgradeOven(lane);
};
// Same for speed upgrade, bribe, buy power-up
```

### 3. Modify Close Handler
```typescript
const handleClose = () => {
  if (!madePurchaseRef.current && gameState.bank > 0) {
    setShowRetirementQuip(true);
    setTimeout(() => {
      setShowRetirementQuip(false);
      onClose();
    }, 2000);
  } else {
    onClose();
  }
};
```

### 4. Add Overlay JSX
```tsx
{showRetirementQuip && (
  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-[110]">
    <div className="bg-amber-100 border-4 border-amber-600 rounded-xl px-6 py-4 shadow-2xl animate-bounce">
      <p className="text-lg sm:text-2xl font-bold text-amber-800 text-center">
        Saving for retirement? 🤔
      </p>
    </div>
  </div>
)}
```

### 5. Update Button/Keyboard
- Replace `onClose` with `handleClose` for Continue button
- Update Escape key handler

---

## Verification
- [ ] Store with money, no purchase, close → message shows
- [ ] Message disappears after 2 seconds
- [ ] Any purchase → no message
- [ ] Bank = 0 → no message (can't buy anyway)
- [ ] Escape key triggers same behavior
