export interface UnlockEntry {
  label: string;
  description: string;
  isBoss?: boolean;
}

export const LEVEL_UNLOCKS: Record<number, UnlockEntry[]> = {
  2: [
    { label: 'Bad Luck Brian', description: "He can't keep anything down..." },
    { label: 'Ice Cream', description: 'Freeze troublemakers in their tracks!' },
    { label: 'Hot Honey', description: 'Makes customers too spicy to think straight!' },
  ],
  3: [
    { label: 'Scumbag Steve', description: 'He eats your pizza AND your tips!' },
    { label: 'Beer', description: 'Liquid courage for your customers!' },
    { label: 'Star', description: 'Catch it for bonus points!' },
    { label: 'Boss: Papa John', description: 'The original pizza patriarch!', isBoss: true },
  ],
  4: [
    { label: 'Doge', description: 'Much pizza. Very deliver. Wow.' },
    { label: 'Nyan', description: 'Rainbow-powered pizza delivery!' },
    { label: 'Rush Hour', description: '3x the customers, 3x the points!' },
  ],
  5: [
    { label: 'Health Inspector', description: 'Keep your kitchen spotless... or else!' },
    { label: 'Pepe', description: 'Rare pizza, rare rewards!' },
    { label: 'Moltobenny', description: "Mamma mia, that's a spicy meatball!" },
    { label: 'Boss: Chuck E Cheese', description: 'Where a kid can be a menace!', isBoss: true },
  ],
  6: [
    { label: 'Delivery Driver', description: 'Special orders incoming! Stack those slices!' },
  ],
  7: [
    { label: 'Pizza Mafia', description: 'Bada boom! They take what they want.' },
    { label: 'Boss: Pizza the Hut', description: 'He ate himself to death... or did he?', isBoss: true },
  ],
  8: [
    { label: 'Health Dept Raid', description: 'Multiple inspectors at once! Stay clean!' },
  ],
  9: [
    { label: 'Alien', description: 'Beam me up some pepperoni!' },
    { label: 'Boss: Dominos', description: 'Corporate pizza strikes back!', isBoss: true },
  ],
};

export function getUnlocksForLevel(level: number): UnlockEntry[] {
  return LEVEL_UNLOCKS[level] ?? [];
}
