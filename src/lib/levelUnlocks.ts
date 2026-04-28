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
    { label: 'Critic', description: 'Impress them for bonus stars!', icon: sprite('critic.png'), iconType: 'sprite' },
    { label: 'Ice Cream', description: 'Freeze troublemakers in their tracks!', icon: sprite('sundae.png'), iconType: 'sprite' },
    { label: 'Hot Honey', description: 'Makes customers too spicy to think straight!', icon: sprite('hot-honey.png'), iconType: 'sprite' },
  ],
  3: [
    { label: 'Bad Luck Brian', description: "He can't keep anything down...", icon: sprite('bad-luck-brian.png'), iconType: 'sprite' },
    { label: 'Beer', description: 'Liquid courage for your customers!', icon: sprite('beer.png'), iconType: 'sprite' },
    { label: 'Star', description: 'Catch it for bonus points!', icon: sprite('star.png'), iconType: 'sprite' },
    { label: 'Boss: Papa John', description: 'The original pizza patriarch!', isBoss: true, icon: sprite('papa-john.png'), iconType: 'sprite' },
  ],
  4: [
    { label: 'Scumbag Steve', description: 'He eats your pizza AND your tips!', icon: sprite('scumbag-steve.png'), iconType: 'sprite' },
    { label: 'Doge', description: 'Much pizza. Very deliver. Wow.', icon: sprite('doge.png'), iconType: 'sprite' },
    { label: 'Nyan', description: 'Rainbow-powered pizza delivery!', icon: sprite('nyan-cat.png'), iconType: 'sprite' },
    { label: 'Rush Hour', description: '3x the customers, 3x the points!', icon: '🔥', iconType: 'emoji' },
  ],
  5: [
    { label: 'Health Inspector', description: 'Keep your kitchen spotless... or else!', icon: sprite('health-inspector.png'), iconType: 'sprite' },
    { label: 'Moltobenny', description: "Mamma mia, that's a spicy meatball!", icon: sprite('molto-benny.png'), iconType: 'sprite' },
    { label: 'Boss: Chuck E Cheese', description: 'Where a kid can be a menace!', isBoss: true, icon: sprite('chuck-e-cheese.png'), iconType: 'sprite' },
  ],
  6: [
    { label: 'Delivery Driver', description: 'Special orders incoming! Stack those slices!', icon: sprite('delivery-driver-full.png'), iconType: 'sprite' },
    { label: 'Pepe', description: 'Rare pizza, rare rewards!', icon: sprite('pepe.png'), iconType: 'sprite' },
  ],
  7: [
    { label: 'Pizza Mafia', description: 'Bada boom! They take what they want.', icon: sprite('pizza-mafia.png'), iconType: 'sprite' },
    { label: 'Boss: Pizza the Hut', description: 'He ate himself to death... or did he?', isBoss: true, icon: sprite('pizza-the-hut.png'), iconType: 'sprite' },
  ],
  8: [
    { label: 'Health Dept Raid', description: 'Multiple inspectors at once! Stay clean!', icon: sprite('health-inspector.png'), iconType: 'sprite' },
  ],
  9: [
    { label: 'Alien', description: 'Beam me up some pepperoni!', icon: sprite('alien.png'), iconType: 'sprite' },
    { label: 'Boss: Dominos', description: 'Corporate pizza strikes back!', isBoss: true, icon: sprite('dominos-boss.png'), iconType: 'sprite' },
  ],
};

export function getUnlocksForLevel(level: number): UnlockEntry[] {
  return LEVEL_UNLOCKS[level] ?? [];
}
