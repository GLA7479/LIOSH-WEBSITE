import React, { useCallback, useId, useMemo, useState } from "react";
import parentCopilot from "../../utils/parent-copilot/index.js";
import { ParentCopilotQuickActions } from "./parent-copilot-quick-actions.jsx";

function makeSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `pc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * @param {{ payload: object; selectedContextRef?: object | null }} props
 */
export function ParentCopilotPanel({ payload, selectedContextRef = null }) {
  const formId = useId();
  const [sessionId] = useState(() => makeSessionId());
  const [utterance, setUtterance] = useState("");
  const [lines, setLines] = useState(() => [
    {
      role: "assistant",
      text: "שאלו על הדוח — התשובה מבוססת רק על נתוני התקופה שמוצגים למעלה.",
    },
  ]);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    (text, meta = {}) => {
      const q = String(text || "").trim();
      if (!q || busy) return;
      setBusy(true);
      setLines((prev) => [...prev, { role: "user", text: q }]);
      try {
        const res = parentCopilot.runParentCopilotTurn({
          audience: "parent",
          payload,
          utterance: q,
          sessionId,
          selectedContextRef,
          clickedFollowupFamily: meta.clickedFollowupFamily || null,
        });
        let assistantText = "";
        if (res.resolutionStatus === "clarification_required") {
          assistantText = res.clarificationQuestionHe || "";
        } else {
          assistantText = (res.answerBlocks || []).map((b) => b.textHe).join("\n\n");
          if (res.suggestedFollowUp?.textHe) {
            assistantText += `\n\n— ${res.suggestedFollowUp.textHe}`;
          }
          if (res.fallbackUsed) {
            assistantText += "\n\n(תצוגה בטוחה מהחוזה)";
          }
        }
        setLines((prev) => [...prev, { role: "assistant", text: assistantText, response: res }]);
      } catch (e) {
        setLines((prev) => [
          ...prev,
          { role: "assistant", text: "אירעה שגיאה טכנית. נסו שוב בעוד רגע." },
        ]);
      } finally {
        setBusy(false);
        setUtterance("");
      }
    },
    [busy, payload, selectedContextRef, sessionId]
  );

  const lastResponse = useMemo(() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].role === "assistant" && lines[i].response) return lines[i].response;
    }
    return null;
  }, [lines]);

  const quickItems = useMemo(() => {
    const qa = lastResponse?.quickActions;
    if (!Array.isArray(qa) || !qa.length) return [];
    return qa.map((a) => ({
      id: a.id,
      labelHe: a.labelHe,
      enabled: !!a.enabled,
      disabledReasonCode: a.disabledReasonCode,
      onPress: () => {
        const preset =
          a.id === "qa_action_today"
            ? "מה לעשות היום בבית?"
            : a.id === "qa_action_week"
              ? "מה לעשות השבוע?"
              : a.id === "qa_avoid_now"
                ? "מה לא לעשות עכשיו?"
                : a.id === "qa_advance_or_hold"
                  ? "להתקדם או להמתין?"
                  : a.id === "qa_explain_to_child"
                    ? "איך להסביר לילד?"
                    : "שאלה למורה";
        const familyMap = {
          qa_action_today: "action_today",
          qa_action_week: "action_week",
          qa_avoid_now: "avoid_now",
          qa_advance_or_hold: "advance_or_hold",
          qa_explain_to_child: "explain_to_child",
          qa_ask_teacher: "ask_teacher",
        };
        submit(preset, { clickedFollowupFamily: familyMap[a.id] || null });
      },
    }));
  }, [lastResponse, submit]);

  return (
    <div className="rounded-xl border border-white/12 bg-black/25 p-3 text-right text-white/90">
      <div className="text-xs font-extrabold tracking-wide text-white/70 mb-2">Parent Copilot (v1)</div>
      <div className="space-y-2 max-h-56 overflow-y-auto text-sm leading-relaxed mb-2">
        {lines.map((ln, i) => (
          <div
            key={i}
            className={
              ln.role === "user"
                ? "text-emerald-100/95 whitespace-pre-wrap"
                : "text-white/85 whitespace-pre-wrap"
            }
          >
            <span className="font-bold text-white/50">{ln.role === "user" ? "אתם: " : "Copilot: "}</span>
            {ln.text}
          </div>
        ))}
      </div>
      <ParentCopilotQuickActions items={quickItems} />
      <form
        className="flex flex-col sm:flex-row gap-2 mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(utterance);
        }}
      >
        <label htmlFor={formId} className="sr-only">
          שאלה
        </label>
        <input
          id={formId}
          className="flex-1 min-w-0 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/35"
          placeholder="שאלה על הדוח…"
          value={utterance}
          disabled={busy}
          onChange={(e) => setUtterance(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy || !utterance.trim()}
          className="shrink-0 rounded-lg border border-sky-400/40 bg-sky-900/35 px-4 py-2 text-sm font-bold text-sky-50 disabled:opacity-40"
        >
          שלח
        </button>
      </form>
    </div>
  );
}
