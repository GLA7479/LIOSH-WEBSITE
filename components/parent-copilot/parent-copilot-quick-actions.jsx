import React from "react";

/**
 * @param {{ items: Array<{ id: string; labelHe: string; enabled: boolean; onPress: () => void; disabledReasonCode?: string }>; compact?: boolean }} props
 */
export function ParentCopilotQuickActions({ items, compact = false }) {
  if (!items?.length) return null;
  const wrap = compact ? "flex flex-wrap gap-1" : "flex flex-wrap gap-2";
  const btn = compact
    ? "px-2 py-1 rounded-md text-[10px] leading-tight font-bold border transition-colors"
    : "px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors";
  return (
    <div className={`${wrap} pt-0`}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          disabled={!it.enabled}
          onClick={() => {
            if (it.enabled) it.onPress();
          }}
          className={`${btn} ${
            it.enabled
              ? "border-cyan-400/35 bg-cyan-950/35 text-cyan-50 hover:bg-cyan-900/45"
              : "border-white/10 bg-white/[0.03] text-white/35 cursor-not-allowed"
          }`}
        >
          {it.labelHe}
        </button>
      ))}
    </div>
  );
}
