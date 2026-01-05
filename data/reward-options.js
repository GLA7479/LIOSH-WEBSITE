export const MONTHLY_MINUTES_TARGET = 600; // 10 שעות
export const MONTHLY_EXERCISES_TARGET = 300;

export const REWARD_OPTIONS = [
  {
    key: "ROBUX",
    icon: "🎮",
    label: "1000 ROBUX",
    description: "1000 Robux למשחק Roblox",
  },
  {
    key: "VBUCKS",
    icon: "👑",
    label: "2500 V-BUCKS",
    description: "2500 V-Bucks למשחק Fortnite",
  },
  {
    key: "CLASH_ROYALE",
    icon: "💎",
    label: "3000 CLASH ROYALE",
    description: "3000 Gems למשחק Clash Royale",
  },
];

export function getRewardLabel(key) {
  return REWARD_OPTIONS.find((opt) => opt.key === key)?.label || "";
}

