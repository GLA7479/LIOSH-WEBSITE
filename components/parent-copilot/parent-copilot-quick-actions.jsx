import React from "react";

/**
 * @param {{ items: Array<{ id: string; labelHe: string; enabled: boolean; onPress: () => void; disabledReasonCode?: string }> }} props
 */
export function ParentCopilotQuickActions({ items }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          disabled={!it.enabled}
          title={it.disabledReasonCode || ""}
          onClick={() => {
            if (it.enabled) it.onPress();
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
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
