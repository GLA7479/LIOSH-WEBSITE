export const MONTHLY_MINUTES_TARGET = 1800; // 30 שעות
export const MONTHLY_EXERCISES_TARGET = 300;

export const REWARD_OPTIONS = [
  {
    key: "DIGITAL_GIFTCARD",
    icon: "💳",
    label: "כרטיס מתנה דיגיטלי",
    description: "Roblox / Google Play / Steam לפי הבחירה שלנו",
  },
  {
    key: "PHYSICAL_TOY",
    icon: "🎁",
    label: "פרס פיזי",
    description: "משחק/ספר/צעצוע שנבחר יחד",
  },
  {
    key: "SURPRISE",
    icon: "✨",
    label: "הפתעה חודשית",
    description: "תנו לנו להפתיע אתכם בפרס סודי",
  },
];

export function getRewardLabel(key) {
  return REWARD_OPTIONS.find((opt) => opt.key === key)?.label || "";
}

