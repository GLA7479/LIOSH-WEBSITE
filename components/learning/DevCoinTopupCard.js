"use client";

import { useState } from "react";

export default function DevCoinTopupCard() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [balanceAfter, setBalanceAfter] = useState(null);

  const onSubmit = async () => {
    setBusy(true);
    setMsg("");
    setBalanceAfter(null);
    try {
      const res = await fetch("/api/student/dev-add-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setMsg("נדרשת התחברות תלמיד");
        return;
      }
      if (res.status === 403 && data?.code === "invalid_code") {
        setMsg("קוד שגוי");
        return;
      }
      if (!data?.ok) {
        setMsg(typeof data?.error === "string" ? data.error : "פעולה נכשלה");
        return;
      }
      setMsg("נוספו 1000 מטבעות");
      if (data.balance_after != null) {
        setBalanceAfter(Number(data.balance_after));
      }
    } catch {
      setMsg("שגיאת רשת");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-left text-sm text-amber-50">
      <h2 className="font-bold text-amber-200">כלי פיתוח</h2>
      <p className="mt-1 text-xs text-amber-100/90">הוספת 1000 מטבעות לבדיקה</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
          <span className="sr-only">קוד</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="קוד"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder:text-white/40"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSubmit()}
          className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-50"
        >
          הוסף 1000 מטבעות
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs font-medium text-amber-100">{msg}</p> : null}
      {balanceAfter !== null ? (
        <p className="mt-1 text-xs text-amber-200/95">יתרה חדשה: {balanceAfter}</p>
      ) : null}
    </section>
  );
}
