export const MONTHLY_MINUTES_TARGET = 1800; // 30 שעות
export const MONTHLY_EXERCISES_TARGET = 300;

export const REWARD_OPTIONS = [
  {
    key: "ROBUX",
    icon: "🎮",
    label: "400 ROBUX",
    description: "400 Robux למשחק Roblox",
  },
  {
    key: "VBUCKS",
    icon: "💎",
    label: "1000 V-BUCKS",
    description: "1000 V-Bucks למשחק Fortnite",
  },
  {
    key: "CLASH_ROYALE",
    icon: "👑",
    label: "1200 CLASH ROYALE GEMS",
    description: "1200 Gems למשחק Clash Royale",
  },
];

export function getRewardLabel(key) {
  return REWARD_OPTIONS.find((opt) => opt.key === key)?.label || "";
}

