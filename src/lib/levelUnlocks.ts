import { sprite } from './assets';

export interface UnlockEntry {
  label: string;
  description: string;
  isBoss?: boolean;
  /** Sprite URL or emoji fallback for display in level announcement */
  icon: string;
  iconType: 'sprite' | 'emoji';
}

export const LEVEL_UNLOCKS: Record<number, UnlockEntry[]> = {
  2: [
    { label: 'Critic', description: '+1 star if impressed, -2 stars if disappointed!', icon: sprite('critic.png'), iconType: 'sprite' },
  ],
  3: [
    { label: 'Bad Luck Brian', description: "He can't keep anything down...", icon: sprite('bad-luck-brian.png'), iconType: 'sprite' },
    { label: 'Star', description: 'Star power overwhelming!', icon: sprite('star.png'), iconType: 'sprite' },
    { label: 'Boss: Papa John', description: 'Give me 40 slices... or else', isBoss: true, icon: sprite('papa-john.png'), iconType: 'sprite' },
  ],
  4: [
    { label: 'Scumbag Steve', description: 'He eats your pizza AND stiffs you!', icon: sprite('scumbag-steve.png'), iconType: 'sprite' },
    { label: 'Doge', description: 'Much pizza. Such points. Wow.', icon: sprite('doge.png'), iconType: 'sprite' },
    { label: 'Rush Hour', description: '3x the customers, can you keep up?', icon: '🔥', iconType: 'emoji' },
  ],
  5: [
    { label: 'Health Inspector', description: 'Keep your kitchen spotless... or else!', icon: sprite('health-inspector.png'), iconType: 'sprite' },
    { label: 'Nyan', description: 'Nyanyanyanyanyanyanya!', icon: sprite('nyan-cat.png'), iconType: 'sprite' },
    { label: 'Boss: Chuck E Cheese', description: 'Where a kid can be a menace!', isBoss: true, icon: sprite('chuck-e-cheese.png'), iconType: 'sprite' },
  ],
  6: [
    { label: 'Delivery Driver', description: 'Full pie for delivery!', icon: sprite('delivery-driver-full.png'), iconType: 'sprite' },
    { label: 'Pepe', description: 'Frank Pepe and Franco Pepe are here to help!', icon: sprite('pepe.png'), iconType: 'sprite' },
  ],
  7: [
    { label: 'Pizza Mafia', description: 'Bada boom! They take what they want.', icon: sprite('pizza-mafia.png'), iconType: 'sprite' },
    { label: 'Moltobenny', description: "10,000 points and $69, nice!", icon: sprite('molto-benny.png'), iconType: 'sprite' },
    { label: 'Boss: Pizza the Hutt', description: 'Nobody outpizzas... me', isBoss: true, icon: sprite('pizza-the-hut.png'), iconType: 'sprite' },
  ],
  8: [
    { label: 'Health Dept Raid', description: 'Multiple inspectors at once! Stay clean!', icon: sprite('health-inspector.png'), iconType: 'sprite' },
  ],
  9: [
    { label: 'Alien', description: 'Pizza phone home!', icon: sprite('alien.png'), iconType: 'sprite' },
    { label: 'Boss: Dominos', description: 'Corporate pizza strikes back!', isBoss: true, icon: sprite('dominos-boss.png'), iconType: 'sprite' },
  ],
};

export function getUnlocksForLevel(level: number): UnlockEntry[] {
  return LEVEL_UNLOCKS[level] ?? [];
}
