import { SUBJECTS, SUBJECT_BUCKETS } from "../../utils/dev-student-simulator/index.js";

const LABEL = {
  student: "\u05E9\u05DD \u05EA\u05DC\u05DE\u05D9\u05D3",
  grade: "\u05DB\u05D9\u05EA\u05D4",
  period: "\u05EA\u05E7\u05D5\u05E4\u05EA \u05DC\u05D9\u05DE\u05D5\u05D3",
  spanDays: "\u05D9\u05DE\u05D9\u05DD \u05D1\u05EA\u05E7\u05D5\u05E4\u05D4 \u05DB\u05D5\u05DC\u05DC\u05D9\u05EA",
  activeDays: "\u05D9\u05DE\u05D9\u05DD \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD",
  sessions: "\u05DE\u05E1\u05E4\u05E8 \u05E4\u05D2\u05D9\u05E9\u05D5\u05EA",
  questions: "\u05E1\u05D4\u05DB \u05E9\u05D0\u05DC\u05D5\u05EA \u05DB\u05D5\u05DC\u05DC",
  anchor: "\u05EA\u05D0\u05E8\u05D9\u05DA \u05E2\u05D5\u05D2\u05DF (\u05E1\u05D5\u05E3 \u05D9\u05D5\u05DD)",
  useNow: "\u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05E9\u05E2\u05D4 \u05E0\u05D5\u05DB\u05D7\u05D9\u05EA \u05DB\u05E2\u05D5\u05D2\u05DF",
  subjects: "\u05DE\u05E7\u05E6\u05D5\u05E2\u05D5\u05EA",
  weight: "\u05DE\u05E9\u05E7\u05DC \u05E4\u05E2\u05D9\u05DC\u05D5\u05EA",
  acc: "\u05D3\u05D9\u05D5\u05E7 \u05D9\u05E2\u05D3 (% \u05E0\u05DB\u05D5\u05DF)",
  dur: "\u05DE\u05DE\u05D5\u05E6\u05E2 \u05E4\u05D2\u05D9\u05E9\u05D4 (\u05E9\u05E0\u05D9\u05D5\u05EA)",
  level: "\u05E8\u05DE\u05D4",
  mode: "\u05DE\u05E6\u05D1",
  topics: "\u05E0\u05D5\u05E9\u05D0\u05D9\u05DD (\u05DE\u05E4\u05EA\u05D7\u05D5\u05EA \u05D3\u05D9\u05D5\u05D5\u05D7)",
  trend: "\u05DE\u05D2\u05DE\u05D4",
  mistakes: "\u05E9\u05D2\u05D9\u05D0\u05D5\u05EA \u05D5\u05E7\u05E6\u05D1",
  mistakeRate: "\u05E9\u05D9\u05E2\u05D5\u05E8 \u05E9\u05D2\u05D9\u05D0\u05D5\u05EA (% \u05DE\u05D4\u05E9\u05D0\u05DC\u05D5\u05EA)",
  repeatStr: "\u05D7\u05D6\u05E7\u05EA \u05D7\u05D6\u05E8\u05D5\u05EA \u05D7\u05D5\u05D6\u05E8\u05EA (% \u05DE\u05E1\u05E4\u05E8 \u05E9\u05D2\u05D9\u05D0\u05D5\u05EA)",
  pace: "\u05D3\u05E4\u05D5\u05E1 \u05D6\u05DE\u05DF \u05EA\u05D2\u05D5\u05D1\u05D4 (responseMs)",
  debug: "\u05DE\u05E6\u05D1 \u05D1\u05D3\u05D9\u05E7\u05D4 \u05E7\u05E6\u05E8\u05D4 (\u05DE\u05E4\u05D7\u05D9\u05EA \u05E1\u05E4\u05D9 \u05DE\u05EA\u05D7\u05EA \u05D0\u05D9\u05DE\u05D5\u05EA)",
};

const SUBJECT_HE = {
  math: "\u05D7\u05E9\u05D1\u05D5\u05DF",
  geometry: "\u05D2\u05D9\u05D0\u05D5\u05DE\u05D8\u05E8\u05D9\u05D4",
  hebrew: "\u05E2\u05D1\u05E8\u05D9\u05EA",
  english: "\u05D0\u05E0\u05D2\u05DC\u05D9\u05EA",
  science: "\u05DE\u05D3\u05E2\u05D9\u05DD",
  "moledet-geography": "\u05DE\u05D5\u05DC\u05D3\u05EA / \u05D2\u05D0\u05D5\u05D2\u05E8\u05E4\u05D9\u05D4",
};

const TREND_OPTS = [
  { v: "stable", l: "\u05D9\u05E6\u05D9\u05D1" },
  { v: "improving", l: "\u05DE\u05E9\u05EA\u05E4\u05E8" },
  { v: "declining", l: "\u05D1\u05D9\u05E8\u05D9\u05D3\u05D4" },
  { v: "jump_decline", l: "\u05E7\u05E4\u05D9\u05E6\u05EA \u05E7\u05D5\u05E9\u05D9 \u05D5\u05D0\u05D7\u05E8 \u05D9\u05E8\u05D9\u05D3\u05D4" },
  { v: "fast_inattentive", l: "\u05DE\u05D4\u05D9\u05E8 \u05D5\u05D7\u05E1\u05E8 \u05EA\u05E9\u05D5\u05DE\u05EA \u05DC\u05D1" },
  { v: "slow_accurate", l: "\u05D0\u05D9\u05D8\u05D9 \u05D0\u05D1\u05DC \u05DE\u05D3\u05D5\u05D9\u05E7" },
];

const PACE_OPTS = [
  { v: "fast_wrong", l: "\u05DE\u05D4\u05D9\u05E8 \u05D5\u05E9\u05D2\u05D5\u05D9" },
  { v: "slow_accurate", l: "\u05D0\u05D9\u05D8\u05D9 \u05D5\u05DE\u05D3\u05D5\u05D9\u05E7" },
  { v: "slow_wrong", l: "\u05D0\u05D9\u05D8\u05D9 \u05D5\u05E9\u05D2\u05D5\u05D9" },
  { v: "balanced", l: "\u05DE\u05D0\u05D5\u05D6\u05DF" },
];

const LEVEL_OPTS = [
  { v: "easy", l: "\u05E7\u05DC" },
  { v: "medium", l: "\u05D1\u05D9\u05E0\u05D5\u05E0\u05D9" },
  { v: "hard", l: "\u05E7\u05E9\u05D4" },
];

const MODE_OPTS = [
  { v: "learning", l: "\u05DC\u05DE\u05D9\u05D3\u05D4" },
  { v: "practice", l: "\u05EA\u05E8\u05D2\u05D5\u05DC" },
  { v: "challenge", l: "\u05D0\u05EA\u05D2\u05E8" },
  { v: "speed", l: "\u05DE\u05D4\u05D9\u05E8\u05D5\u05EA" },
];

const GRADES = ["g1", "g2", "g3", "g4", "g5", "g6"];

const fieldStyle = { display: "block", marginBottom: 10, fontSize: 14 };
const inputStyle = { width: "100%", maxWidth: 360, padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 };

export default function CustomBuilderPanel({ value, setValue, disabled }) {
  const setField = (k, v) => setValue((s) => ({ ...s, [k]: v }));

  const setSubject = (sid, patch) =>
    setValue((s) => ({
      ...s,
      subjects: { ...s.subjects, [sid]: { ...s.subjects[sid], ...patch } },
    }));

  const toggleTopic = (sid, topic, on) => {
    const cur = value.subjects[sid].topics || [];
    const next = on ? [...new Set([...cur, topic])] : cur.filter((t) => t !== topic);
    setSubject(sid, { topics: next });
  };

  const toggleSubjectEnabled = (sid, on) => {
    const buckets = SUBJECT_BUCKETS[sid] || [];
    setSubject(sid, {
      enabled: on,
      topics: on && (!value.subjects[sid].topics || value.subjects[sid].topics.length === 0) ? [...buckets] : value.subjects[sid].topics,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>\u05EA\u05DC\u05DE\u05D9\u05D3</h3>
        <label style={fieldStyle}>
          {LABEL.student}
          <input
            type="text"
            dir="ltr"
            style={{ ...inputStyle, marginTop: 4 }}
            value={value.studentName}
            onChange={(e) => setField("studentName", e.target.value)}
            disabled={disabled}
          />
        </label>
        <label style={fieldStyle}>
          {LABEL.grade}
          <select
            style={{ ...inputStyle, marginTop: 4 }}
            value={value.grade}
            onChange={(e) => setField("grade", e.target.value)}
            disabled={disabled}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{LABEL.period}</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label style={fieldStyle}>
            {LABEL.spanDays}
            <input
              type="number"
              min={1}
              style={{ ...inputStyle, marginTop: 4 }}
              value={value.spanDays}
              onChange={(e) => setField("spanDays", Number(e.target.value))}
              disabled={disabled}
            />
          </label>
          <label style={fieldStyle}>
            {LABEL.activeDays}
            <input
              type="number"
              min={1}
              style={{ ...inputStyle, marginTop: 4 }}
              value={value.activeDays}
              onChange={(e) => setField("activeDays", Number(e.target.value))}
              disabled={disabled}
            />
          </label>
          <label style={fieldStyle}>
            {LABEL.sessions}
            <input
              type="number"
              min={1}
              style={{ ...inputStyle, marginTop: 4 }}
              value={value.sessionsCount}
              onChange={(e) => setField("sessionsCount", Number(e.target.value))}
              disabled={disabled}
            />
          </label>
          <label style={fieldStyle}>
            {LABEL.questions}
            <input
              type="number"
              min={1}
              style={{ ...inputStyle, marginTop: 4 }}
              value={value.totalQuestions}
              onChange={(e) => setField("totalQuestions", Number(e.target.value))}
              disabled={disabled}
            />
          </label>
        </div>
        <label style={{ ...fieldStyle, display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={value.useNowAsAnchor} onChange={(e) => setField("useNowAsAnchor", e.target.checked)} disabled={disabled} />
          {LABEL.useNow}
        </label>
        {!value.useNowAsAnchor ? (
          <label style={fieldStyle}>
            {LABEL.anchor}
            <input
              type="date"
              dir="ltr"
              style={{ ...inputStyle, marginTop: 4 }}
              value={value.anchorDate}
              onChange={(e) => setField("anchorDate", e.target.value)}
              disabled={disabled}
            />
          </label>
        ) : null}
        <label style={{ ...fieldStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={value.debugShortMode} onChange={(e) => setField("debugShortMode", e.target.checked)} disabled={disabled} />
          {LABEL.debug}
        </label>
      </div>

      <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{LABEL.subjects}</h3>
        {SUBJECTS.map((sid) => {
          const row = value.subjects[sid];
          const buckets = SUBJECT_BUCKETS[sid] || [];
          return (
            <div
              key={sid}
              style={{
                marginBottom: 14,
                padding: 12,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: row.enabled ? "#fff" : "#f1f5f9",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 8 }}>
                <input type="checkbox" checked={row.enabled} onChange={(e) => toggleSubjectEnabled(sid, e.target.checked)} disabled={disabled} />
                <span dir="rtl">{SUBJECT_HE[sid]}</span>
                <code dir="ltr" style={{ fontSize: 12, color: "#64748b" }}>
                  {sid}
                </code>
              </label>
              {row.enabled ? (
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                  <label style={fieldStyle}>
                    {LABEL.weight}
                    <input
                      type="number"
                      min={0.01}
                      step={0.05}
                      style={{ ...inputStyle, marginTop: 4 }}
                      value={row.weight}
                      onChange={(e) => setSubject(sid, { weight: Number(e.target.value) })}
                      disabled={disabled}
                    />
                  </label>
                  <label style={fieldStyle}>
                    {LABEL.acc}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      style={{ ...inputStyle, marginTop: 4 }}
                      value={row.targetAccuracyPct}
                      onChange={(e) => setSubject(sid, { targetAccuracyPct: Number(e.target.value) })}
                      disabled={disabled}
                    />
                  </label>
                  <label style={fieldStyle}>
                    {LABEL.dur}
                    <input
                      type="number"
                      min={30}
                      max={7200}
                      style={{ ...inputStyle, marginTop: 4 }}
                      value={row.avgSessionDurationSec}
                      onChange={(e) => setSubject(sid, { avgSessionDurationSec: Number(e.target.value) })}
                      disabled={disabled}
                    />
                  </label>
                  <label style={fieldStyle}>
                    {LABEL.level}
                    <select
                      style={{ ...inputStyle, marginTop: 4 }}
                      value={row.level}
                      onChange={(e) => setSubject(sid, { level: e.target.value })}
                      disabled={disabled}
                    >
                      {LEVEL_OPTS.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={fieldStyle}>
                    {LABEL.mode}
                    <select
                      style={{ ...inputStyle, marginTop: 4 }}
                      value={row.mode}
                      onChange={(e) => setSubject(sid, { mode: e.target.value })}
                      disabled={disabled}
                    >
                      {MODE_OPTS.map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
              {row.enabled ? (
                <fieldset style={{ marginTop: 10, border: "none", padding: 0 }}>
                  <legend style={{ fontWeight: 600, marginBottom: 6 }}>{LABEL.topics}</legend>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {buckets.map((topic) => (
                      <label key={topic} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={row.topics.includes(topic)}
                          onChange={(e) => toggleTopic(sid, topic, e.target.checked)}
                          disabled={disabled}
                        />
                        <code dir="ltr">{topic}</code>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{LABEL.trend}</h3>
        <select
          style={{ ...inputStyle, maxWidth: "100%" }}
          value={value.customTrend}
          onChange={(e) => setField("customTrend", e.target.value)}
          disabled={disabled}
        >
          {TREND_OPTS.map((o) => (
            <option key={o.v} value={o.v}>
              {o.l}
            </option>
          ))}
        </select>
      </div>

      <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{LABEL.mistakes}</h3>
        <label style={fieldStyle}>
          {LABEL.mistakeRate}
          <input
            type="number"
            min={0}
            max={100}
            style={{ ...inputStyle, marginTop: 4 }}
            value={value.mistakeRatePct}
            onChange={(e) => setField("mistakeRatePct", Number(e.target.value))}
            disabled={disabled}
          />
        </label>
        <label style={fieldStyle}>
          {LABEL.repeatStr}
          <input
            type="number"
            min={0}
            max={100}
            style={{ ...inputStyle, marginTop: 4 }}
            value={value.repeatedMistakeStrengthPct}
            onChange={(e) => setField("repeatedMistakeStrengthPct", Number(e.target.value))}
            disabled={disabled}
          />
        </label>
        <label style={fieldStyle}>
          {LABEL.pace}
          <select
            style={{ ...inputStyle, marginTop: 4 }}
            value={value.responseMsBehavior}
            onChange={(e) => setField("responseMsBehavior", e.target.value)}
            disabled={disabled}
          >
            {PACE_OPTS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
