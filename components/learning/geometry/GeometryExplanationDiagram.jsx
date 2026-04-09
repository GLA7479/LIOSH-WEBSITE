import React from "react";

const ST = {
  stroke: "#6ee7b7",
  strokeHi: "#fbbf24",
  strokeDim: "rgba(110, 231, 183, 0.35)",
  fillShape: "rgba(16, 185, 129, 0.12)",
  fillHi: "rgba(251, 191, 36, 0.15)",
  text: "#ecfdf5",
  textMuted: "rgba(236, 253, 245, 0.75)",
  dash: "#94a3b8",
};

function useHL(active, emphasis, ...tokens) {
  const on = tokens.some((t) => {
    if (t === "length_width")
      return active === "length_width" || active === "formula";
    if (t === "base_height")
      return active === "base_height" || active === "formula";
    if (t === "bases_height")
      return active === "bases_height" || active === "formula";
    if (t === "all_sides") return active === "all_sides" || active === "formula";
    return active === t;
  });
  const dim =
    emphasis === "neutral"
      ? false
      : emphasis === "formula"
      ? false
      : !on && emphasis !== "result";
  const hi = on && emphasis !== "result";
  return {
    stroke: dim ? ST.strokeDim : hi ? ST.strokeHi : ST.stroke,
    sw: hi ? 3.2 : emphasis === "formula" ? 2.4 : 2,
    fill: hi ? ST.fillHi : ST.fillShape,
  };
}

function SvgText({ x, y, children, small, anchor = "middle" }) {
  return (
    <text
      x={x}
      y={y}
      fill={small ? ST.textMuted : ST.text}
      fontSize={small ? 9 : 11}
      textAnchor={anchor}
      style={{ unicodeBidi: "plaintext", direction: "ltr" }}
    >
      {children}
    </text>
  );
}

export default function GeometryExplanationDiagram({ spec, emphasis = "neutral" }) {
  if (!spec?.kind) return null;

  const W = 280;
  const H = 200;
  const vb = "0 0 280 200";

  if (spec.kind === "square") {
    const s = spec.side;
    const { stroke, sw, fill } = useHL(emphasis, emphasis, "side", "formula");
    return (
      <div className="w-full max-w-[320px] mx-auto mb-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 px-2 py-3">
        <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 200 }} aria-hidden>
          <rect x="70" y="50" width="140" height="140" fill={fill} stroke={stroke} strokeWidth={sw} rx="3" />
          <SvgText x="140" y="183" small>
            {String(s)}
          </SvgText>
          <SvgText x="215" y="125" small>
            {String(s)}
          </SvgText>
          {spec.mode === "perimeter" && (
            <SvgText x="140" y="38" small>
              4 צלעות שוות
            </SvgText>
          )}
        </svg>
      </div>
    );
  }

  if (spec.kind === "rectangle") {
    const L = spec.length;
    const Wd = spec.width;
    const isR = emphasis === "result";
    const isLw = emphasis === "length_width" || emphasis === "formula";
    const bottomStroke = isR ? ST.stroke : isLw ? ST.strokeHi : ST.strokeDim;
    const bottomSw = isLw ? 3.2 : isR ? 2.5 : 2;
    const leftStroke = isR ? ST.stroke : isLw ? ST.strokeHi : ST.strokeDim;
    const leftSw = isLw ? 3.2 : isR ? 2.5 : 2;
    return (
      <div className="w-full max-w-[320px] mx-auto mb-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 px-2 py-3">
        <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 200 }} aria-hidden>
          <rect
            x="55"
            y="70"
            width="170"
            height="85"
            fill={isLw ? ST.fillHi : ST.fillShape}
            stroke={isR ? ST.stroke : ST.strokeDim}
            strokeWidth={isR ? 2.5 : 1.8}
            rx="2"
          />
          <line x1="55" y1="155" x2="225" y2="155" stroke={bottomStroke} strokeWidth={bottomSw} />
          <line x1="55" y1="70" x2="55" y2="155" stroke={leftStroke} strokeWidth={leftSw} />
          <SvgText x="140" y="172" small>
            {String(L)} (אורך)
          </SvgText>
          <SvgText x="42" y="118" small anchor="end">
            {String(Wd)}
          </SvgText>
          <SvgText x="35" y="130" small anchor="end">
            (רוחב)
          </SvgText>
        </svg>
      </div>
    );
  }

  if (spec.kind === "triangle" && spec.mode === "area") {
    const b = spec.base;
    const h = spec.height;
    const emph = emphasis;
    const baseHi = emph === "base_height" || emph === "formula";
    const heightHi = emph === "base_height" || emph === "formula";
    const isRes = emph === "result";
    return (
      <div className="w-full max-w-[320px] mx-auto mb-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 px-2 py-3">
        <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 200 }} aria-hidden>
          <polygon
            points="140,40 60,160 220,160"
            fill={ST.fillShape}
            stroke={isRes ? ST.stroke : ST.strokeDim}
            strokeWidth={isRes ? 2.8 : 2}
          />
          <line
            x1="60"
            y1="160"
            x2="220"
            y2="160"
            stroke={isRes ? ST.stroke : baseHi ? ST.strokeHi : ST.strokeDim}
            strokeWidth={isRes ? 2.6 : baseHi ? 3.2 : 2}
          />
          <line
            x1="140"
            y1="40"
            x2="140"
            y2="160"
            stroke={ST.dash}
            strokeWidth={isRes ? 2.4 : heightHi ? 3 : 1.5}
            strokeDasharray="5 4"
          />
          <SvgText x="140" y="176" small>
            בסיס {String(b)}
          </SvgText>
          <SvgText x="128" y="100" small anchor="end">
            גובה {String(h)}
          </SvgText>
        </svg>
      </div>
    );
  }

  if (spec.kind === "parallelogram") {
    const b = spec.base;
    const h = spec.height;
    const bh = emphasis === "base_height" || emphasis === "formula";
    return (
      <div className="w-full max-w-[320px] mx-auto mb-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 px-2 py-3">
        <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 200 }} aria-hidden>
          <polygon
            points="50,150 210,150 235,70 75,70"
            fill={ST.fillShape}
            stroke={emphasis === "result" ? ST.stroke : ST.strokeDim}
            strokeWidth="2"
          />
          <line
            x1="50"
            y1="150"
            x2="210"
            y2="150"
            stroke={bh ? ST.strokeHi : ST.stroke}
            strokeWidth={bh ? 3.2 : 2}
          />
          <line
            x1="75"
            y1="70"
            x2="75"
            y2="150"
            stroke={ST.dash}
            strokeWidth={bh ? 3 : 1.5}
            strokeDasharray="5 4"
          />
          <SvgText x="130" y="168" small>
            בסיס {String(b)}
          </SvgText>
          <SvgText x="62" y="112" small anchor="start">
            גובה {String(h)} (אנך)
          </SvgText>
          <SvgText x="248" y="112" small anchor="end">
            מוסט ≠ גובה
          </SvgText>
        </svg>
      </div>
    );
  }

  if (spec.kind === "trapezoid") {
    const b1 = spec.base1;
    const b2 = spec.base2;
    const h = spec.height;
    const tri = emphasis === "bases_height" || emphasis === "formula";
    return (
      <div className="w-full max-w-[320px] mx-auto mb-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 px-2 py-3">
        <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 200 }} aria-hidden>
          <polygon
            points="70,165 210,165 190,55 90,55"
            fill={ST.fillShape}
            stroke={emphasis === "result" ? ST.stroke : ST.strokeDim}
            strokeWidth="2"
          />
          <line
            x1="70"
            y1="165"
            x2="210"
            y2="165"
            stroke={tri ? ST.strokeHi : ST.stroke}
            strokeWidth={tri ? 3 : 2}
          />
          <line
            x1="90"
            y1="55"
            x2="190"
            y2="55"
            stroke={tri ? ST.strokeHi : ST.stroke}
            strokeWidth={tri ? 3 : 2}
          />
          <line
            x1="90"
            y1="55"
            x2="90"
            y2="165"
            stroke={ST.dash}
            strokeWidth={tri ? 2.8 : 1.5}
            strokeDasharray="5 4"
          />
          <SvgText x="140" y="182" small>
            בסיס {String(b1)}
          </SvgText>
          <SvgText x="140" y="48" small>
            בסיס {String(b2)}
          </SvgText>
          <SvgText x="78" y="115" small anchor="start">
            גובה {String(h)}
          </SvgText>
        </svg>
      </div>
    );
  }

  if (spec.kind === "circle") {
    const r = spec.radius;
    const cx = 140;
    const cy = 100;
    const rad = 55;
    const rim = emphasis === "rim";
    return (
      <div className="w-full max-w-[320px] mx-auto mb-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 px-2 py-3">
        <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 200 }} aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={rad}
            fill={ST.fillShape}
            stroke={rim ? ST.strokeHi : ST.stroke}
            strokeWidth={rim ? 3.5 : emphasis === "radius" || emphasis === "formula" ? 2.6 : 2}
          />
          <line
            x1={cx}
            y1={cy}
            x2={cx + rad}
            y2={cy}
            stroke={emphasis === "radius" || emphasis === "formula" ? ST.strokeHi : ST.strokeDim}
            strokeWidth={emphasis === "radius" || emphasis === "formula" ? 3 : 1.8}
          />
          <SvgText x={cx + rad / 2} y={cy - 8} small>
            r = {String(r)}
          </SvgText>
          {spec.mode === "perimeter" && (
            <SvgText x={cx} y={38} small>
              היקף — סיבוב מלא
            </SvgText>
          )}
          {spec.mode === "area" && (
            <SvgText x={cx} y={38} small>
              שטח — פנים העיגול
            </SvgText>
          )}
        </svg>
      </div>
    );
  }

  if (spec.kind === "triangle_perimeter") {
    const a = spec.side1;
    const b = spec.side2;
    const c = spec.side3;
    const all = emphasis === "all_sides" || emphasis === "formula";
    return (
      <div className="w-full max-w-[320px] mx-auto mb-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 px-2 py-3">
        <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 200 }} aria-hidden>
          <polygon
            points="140,45 65,155 215,155"
            fill={ST.fillShape}
            stroke={all || emphasis === "result" ? ST.strokeHi : ST.stroke}
            strokeWidth={all ? 3 : 2}
          />
          <SvgText x="100" y="175" small>
            {String(a)}
          </SvgText>
          <SvgText x="185" y="175" small>
            {String(b)}
          </SvgText>
          <SvgText x="132" y="95" small>
            {String(c)}
          </SvgText>
          <SvgText x="140" y="30" small>
            סכום צלעות = היקף
          </SvgText>
        </svg>
      </div>
    );
  }

  return null;
}
