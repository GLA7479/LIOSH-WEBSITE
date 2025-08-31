// pages/mleo-miners.js
// LIO Mining Rush — Coins-only mining during play; Diamonds only from Gifts
// • No auto-coin gain while playing (only pickups & DIG). Offline passive accrual up to 6h remains.
// • Rocks now clearly penalize: coin loss %, red flash, short stun.
// • Diamonds come only from Gifts; every 3 Diamonds → Big Gift (strong temporary boost).
// • Desktop controls (W/↑, S/↓, Space=DIG, Enter=Claim, G=Gift). EN texts in UI.

import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";

const LS_KEY = "lio_mining_rush_v2";
const OFFLINE_CAP_HOURS = 6;

const CLICK_VALUE = 3;          // coins from manual DIG
const OFFLINE_EFF = 0.40;       // offline efficiency (when away)
const GIFTS_INTERVAL_SEC = 120; // 2 minutes

// Economy (upgrade costs)
const ECON = {
  dps:    { base: 500, growth: 1.55, label: "DPS +10%" },
  gold:   { base: 750, growth: 1.60, label: "GOLD +10%" },
  magnet: { base: 400, growth: 1.40, label: "Magnet +10px" },
  dog:    { base: 100, growth: 1.40, label: "Add Dog" },
};

// World config
const WORLD = {
  rails: 4,
  speed: 180,
  speedInc: 0.02,         // ramp per minute
  spawnEvery: 900,        // baseline spawn ms
  coinChance: 0.80,       // coins dominate
  rockChance: 0.18,       // some obstacles
  magnetChance: 0.02,     // rare magnet pickup
  maxEntities: 50,
  magnetDurSec: 6,
  tapMoveCooldownMs: 120,
  rockLossPct: 0.03,      // 3% coin loss on rock hit
  stunMs: 450,            // short control stun
};

const ASSETS = {
  bg: "/images/bg-cave.png",
  railOverlay: "/images/rails-4.png",
  cart: "/images/leo-miner-4x.png",
  coin: "/images/coin.png",
  rock: "/images/rock.png",
  magnet: "/images/magnet.png",
  introIcon: "/images/leo-intro.png",
};

const defaultSave = () => ({
  // balances
  coins: 0, bank: 0, diamonds: 0,
  // upgrades
  dpsLevel: 0, goldLevel: 0, magnetLevel: 0,
  dogs: 1,
  // timers
  lastActive: Date.now(),
  giftReadyAt: 0, giftsAvailable: 0,
  // flags
  isMining: false,
});

const fmt = (n) => Math.floor(n).toLocaleString();

export default function LioMiningRush() {
  const [introOpen, setIntroOpen] = useState(true);
  const [howOpen, setHowOpen] = useState(false);

  const [st, setSt] = useState(defaultSave());
  const [boostX, setBoostX] = useState(1);
  const boostUntilRef = useRef(0);

  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastMoveTapRef = useRef(0);
  const t0Ref = useRef(0);

  // sprite + fx state
  const [frame, setFrame] = useState(0);
  const frameAccRef = useRef(0);
  const hitFxUntilRef = useRef(0);   // red flash until
  const stunUntilRef = useRef(0);    // controls blocked until

  // world runtime (not persisted)
  const worldRef = useRef({
    railY: [],
    cartRail: 1,
    cartX: 0,
    cartW: 150,
    cartH: 150,
    speed: WORLD.speed,
    magnetUntil: 0,
    entities: [],
    images: {},
    canvas: null,
    canvasW: 0,
    magnetLevel: 0,
  });

  // Load + offline accrual (coins only when away)
  useEffect(() => {
    function loadState() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return defaultSave();
        return { ...defaultSave(), ...JSON.parse(raw) };
      } catch { return defaultSave(); }
    }
    const s = loadState();
    const dtMs = Date.now() - (s.lastActive || Date.now());
    const dtSec = Math.min(OFFLINE_CAP_HOURS * 3600, Math.floor(dtMs / 1000));
    if (dtSec > 0) {
      // passive when away: base determined by dogs & dpsLevel, multiplied by GOLD
      const BASE_DPS = 1;
      const baseDps = BASE_DPS * s.dogs * (1 + s.dpsLevel * 0.10);
      const earn = Math.floor(dtSec * baseDps * (1 + s.goldLevel * 0.10) * OFFLINE_EFF);
      s.coins += earn;
      s.giftsAvailable = Math.min(1, (s.giftsAvailable || 0) + 1);
      s.giftReadyAt = Date.now() + GIFTS_INTERVAL_SEC * 1000;
    }
    s.lastActive = Date.now();
    setSt(s);
  }, []);

  // Persist
  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch {} }, [st]);

  // Mirror magnet level for halo
  useEffect(() => { worldRef.current.magnetLevel = st.magnetLevel || 0; }, [st.magnetLevel]);

  // Canvas sizing
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      const parent = c.parentElement;
      const maxW = Math.min(parent.clientWidth, 1100);
      const w = maxW;
      const h = Math.max(360, Math.round(w * 9 / 16));
      c.width = w; c.height = h;

      const wr = worldRef.current;
      wr.canvas = c; wr.canvasW = w;
      wr.cartX = Math.round(w * 0.2);
      wr.cartW = Math.min(200, Math.round(w * 0.17));
      wr.cartH = wr.cartW;
      wr.railY = Array.from({ length: WORLD.rails }, (_, i) => {
        const top = h * 0.55;
        const step = h * 0.09;
        return Math.round(top + i * step);
      });
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(c.parentElement);
    return () => obs.disconnect();
  }, []);

  // Load images
  useEffect(() => {
    const ids = ["bg","railOverlay","cart","coin","rock","magnet","introIcon"];
    const wr = worldRef.current;
    ids.forEach((k) => { const img = new Image(); img.src = ASSETS[k]; wr.images[k] = img; });
  }, []);

  // Desktop keyboard controls
  useEffect(() => {
    const wr = worldRef.current;
    const onKey = (e) => {
      if (!st.isMining) return;
      if (e.repeat) return;
      if (Date.now() < stunUntilRef.current) return; // stunned
      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") wr.cartRail = Math.max(0, wr.cartRail - 1);
      else if (key === "arrowdown" || key === "s") wr.cartRail = Math.min(WORLD.rails - 1, wr.cartRail + 1);
      else if (key === " " || key === "spacebar") { e.preventDefault(); manualDig(); }
      else if (key === "enter") claim();
      else if (key === "g") claimGift();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [st.isMining]);

  // Pointer controls (mouse/touch)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const wr = worldRef.current;
    const onPointerDown = (e) => {
      if (!st.isMining) return;
      if (Date.now() < stunUntilRef.current) return;
      const now = Date.now();
      if (now - lastMoveTapRef.current < WORLD.tapMoveCooldownMs) return;
      lastMoveTapRef.current = now;

      const rect = c.getBoundingClientRect();
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      const cartY = wr.railY[wr.cartRail] - wr.cartH * 0.5;
      if (y < cartY) wr.cartRail = Math.max(0, wr.cartRail - 1);
      else if (y > cartY + wr.cartH) wr.cartRail = Math.min(WORLD.rails - 1, wr.cartRail + 1);
      else manualDig();
    };
    c.addEventListener("mousedown", onPointerDown);
    c.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      c.removeEventListener("mousedown", onPointerDown);
      c.removeEventListener("touchstart", onPointerDown);
    };
  }, [st.isMining]);

  // Main loop
  useEffect(() => {
    if (!st.isMining) return;
    let last = performance.now();
    t0Ref.current = last;
    const wr = worldRef.current;

    const loop = (t) => {
      const dt = Math.min(64, t - last);
      last = t;

      // speed ramp
      const minutes = (t - t0Ref.current) / 60000;
      wr.speed = WORLD.speed * (1 + WORLD.speedInc * minutes);

      // sprite anim (8 fps)
      frameAccRef.current += dt;
      if (frameAccRef.current > 125) { setFrame((f) => (f + 1) % 4); frameAccRef.current = 0; }

      // gifts timer
      setSt((s) => {
        if (s.giftReadyAt === 0) return { ...s, giftReadyAt: Date.now() + GIFTS_INTERVAL_SEC * 1000 };
        if (Date.now() >= s.giftReadyAt) {
          return { ...s, giftsAvailable: Math.min(1, (s.giftsAvailable || 0) + 1), giftReadyAt: Date.now() + GIFTS_INTERVAL_SEC * 1000 };
        }
        return s;
      });

      // Big boost timeout
      if (boostUntilRef.current && Date.now() >= boostUntilRef.current) { setBoostX(1); boostUntilRef.current = 0; }

      // spawn
      if (!lastSpawnRef.current) lastSpawnRef.current = t;
      const spawnDelay = WORLD.spawnEvery * Math.max(0.5, 1 - 0.07 * minutes);
      if (t - lastSpawnRef.current > spawnDelay && wr.entities.length < WORLD.maxEntities) {
        spawnEntity(wr); lastSpawnRef.current = t;
      }

      // step + draw
      stepWorld(wr, dt, () => collectCoin(), () => hitRock(), () => collectMagnet());
      drawCanvas(canvasRef.current, wr, frame, hitFxUntilRef.current);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [st.isMining, st.magnetLevel, boostX]);

  // Actions
  const manualDig = () => {
    setSt((s) => ({ ...s, coins: s.coins + CLICK_VALUE * (1 + s.goldLevel * 0.10) * boostX, lastActive: Date.now() }));
  };

  const claim = () => {
    const amt = Math.floor(st.coins);
    if (amt <= 0) return;
    setSt((s) => ({ ...s, coins: 0, bank: s.bank + amt }));
  };

  const priceOf = (kind) => {
    if (kind === "dog") return Math.floor(ECON.dog.base * Math.pow(ECON.dog.growth, st.dogs));
    const cfg = ECON[kind]; const key = kind + "Level";
    return Math.floor(cfg.base * Math.pow(cfg.growth, st[key]));
  };

  const buy = (kind) => {
    const cost = priceOf(kind);
    if (st.bank < cost) return;
    if (kind === "dog") setSt((s) => ({ ...s, bank: s.bank - cost, dogs: s.dogs + 1 }));
    else { const key = kind + "Level"; setSt((s) => ({ ...s, bank: s.bank - cost, [key]: s[key] + 1 })); }
  };

  const claimGift = () => {
    if (st.giftsAvailable <= 0) return;
    setSt((s) => ({ ...s, giftsAvailable: s.giftsAvailable - 1 }));
    // Rewards: coins 70% • diamond 20% • upgrades 10%
    const r = Math.random() * 100;
    if (r < 70) {
      const bonus = Math.floor(120 + Math.random() * 380) * (1 + st.goldLevel * 0.10);
      setSt((s) => ({ ...s, coins: s.coins + bonus }));
    } else if (r < 90) {
      // Diamond only from gifts
      const next = st.diamonds + 1;
      setSt((s) => ({ ...s, diamonds: next }));
      // Every 3 diamonds → Big Gift (random strong boost)
      if (next % 3 === 0) {
        const roll = Math.random();
        const mult = roll < 0.55 ? 10 : roll < 0.85 ? 50 : 100;
        const dur = mult === 10 ? 35 : mult === 50 ? 25 : 15;
        setBoostX(mult); boostUntilRef.current = Date.now() + dur * 1000;
      }
    } else {
      // small upgrade chance
      const up = Math.random();
      if (up < 0.34) setSt((s) => ({ ...s, dpsLevel: s.dpsLevel + 1 }));
      else if (up < 0.67) setSt((s) => ({ ...s, goldLevel: s.goldLevel + 1 }));
      else setSt((s) => ({ ...s, dogs: s.dogs + 1 }));
    }
  };

  const enterGame = async () => {
    try { const root = document.documentElement; if (!document.fullscreenElement && root.requestFullscreen) await root.requestFullscreen(); } catch {}
    setIntroOpen(false);
    setSt((s) => ({ ...s, isMining: true, lastActive: Date.now() }));
  };

  // World callbacks
  const collectCoin = () => {
    // coins picked from the world — base + GOLD + possible boost
    const base = 4 + Math.random() * 6;
    setSt((s) => ({ ...s, coins: s.coins + base * (1 + s.goldLevel * 0.10) * boostX, lastActive: Date.now() }));
  };

  const hitRock = () => {
    const wr = worldRef.current;
    // visual FX
    hitFxUntilRef.current = Date.now() + 200;
    stunUntilRef.current = Date.now() + WORLD.stunMs;
    wr.speed *= 0.94; // little slowdown
    // coin penalty
    setSt((s) => {
      const loss = Math.floor(s.coins * WORLD.rockLossPct);
      return { ...s, coins: Math.max(0, s.coins - loss) };
    });
  };

  const collectMagnet = () => {
    const wr = worldRef.current;
    wr.magnetUntil = Date.now() + WORLD.magnetDurSec * 1000;
  };

  // computed
  const shouldPulseClaim = Math.floor(st.coins) > 0 && Math.floor(st.bank) === 0;

  // UI
  return (
    <Layout>
      <div className="min-h-screen w-full px-3 py-6 flex flex-col items-center">
        <div className="w-full max-w-6xl mb-3">
          <h1 className="text-xl font-extrabold tracking-wide text-white/90">LIO Mining Rush</h1>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Stat label="Coins" value={fmt(st.coins)} />
          <Stat label="Bank" value={fmt(st.bank)} />
          <Stat label="DPS" value={fmt((1 * st.dogs * (1 + st.dpsLevel * 0.10)) * (1 + st.goldLevel * 0.10))} />
          <Stat label="Diamonds" value={fmt(st.diamonds)} />
        </div>

        <div className="w-full max-w-6xl rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-black/25 to-black/10 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
          <div className="p-3">
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <canvas ref={canvasRef} className="w-full block" style={{ aspectRatio: "16/9" }} />
            </div>
            {!introOpen && (
              <div className="mt-2 text-[12px] text-white/60 text-center">
                Desktop: <b>W/↑</b> up, <b>S/↓</b> down, <b>Space</b> DIG, <b>Enter</b> Claim, <b>G</b> Gift
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <Card title="Dig">
            <button className="w-full py-4 rounded-xl border border-white/15 text-lg font-bold hover:bg-white/10" onClick={manualDig}>
              ⛏️ DIG (+{CLICK_VALUE})
            </button>
            <div className="mt-3 text-sm text-white/80">
              Earn coins by collecting them on the rails or tapping DIG.<br />
              Passive mining happens only while you are away (up to 6h).
            </div>
            <button
              className={`mt-3 w-full px-3 py-2 rounded-xl border border-white/15 hover:bg-white/10 ${shouldPulseClaim ? "animate-pulse bg-green-600/20" : ""}`}
              onClick={claim}
            >
              Claim → Bank {shouldPulseClaim ? "(required before upgrades)" : ""}
            </button>
          </Card>

          <Card title="Upgrades">
            <UpgradeRow label={ECON.dps.label}    level={st.dpsLevel}    price={priceOf("dps")}    can={st.bank >= priceOf("dps")}    onBuy={() => buy("dps")} />
            <UpgradeRow label={ECON.gold.label}   level={st.goldLevel}   price={priceOf("gold")}   can={st.bank >= priceOf("gold")}   onBuy={() => buy("gold")} />
            <UpgradeRow label={ECON.magnet.label} level={st.magnetLevel} price={priceOf("magnet")} can={st.bank >= priceOf("magnet")} onBuy={() => buy("magnet")} />
            <UpgradeRow label={ECON.dog.label}    level={st.dogs}        price={priceOf("dog")}    can={st.bank >= priceOf("dog")}    onBuy={() => buy("dog")} />
          </Card>

          <Card title="Gifts">
            <p className="text-sm text-white/70 mb-2">
              A gift becomes available every {GIFTS_INTERVAL_SEC/60} minutes. Diamonds come from Gifts only.
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-xl border border-white/15 disabled:opacity-40 hover:bg-white/10" disabled={st.giftsAvailable <= 0} onClick={claimGift}>
                Claim Gift ({st.giftsAvailable})
              </button>
              <span className="text-xs text-white/60">
                Next in ~{Math.max(0, Math.ceil((st.giftReadyAt - Date.now())/1000))}s
              </span>
            </div>
            <div className="text-xs text-white/60 mt-2">
              Every 3 Diamonds triggers a <b>Big Gift</b> (powerful temporary multiplier).
            </div>
          </Card>
        </div>

        {/* Intro overlay */}
        {introOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0f14] p-6 text-center shadow-2xl">
              <img src={ASSETS.introIcon} alt="LIO" className="mx-auto mb-4 w-24 h-24 rounded-full object-cover" />
              <h2 className="text-2xl font-extrabold mb-2">LIO Mining Rush</h2>
              <p className="text-white/80 text-sm mb-4">
                Collect coins on the rails or tap DIG. Passive mining only while you are away (up to 6h).
              </p>
              <div className="grid grid-cols-1 gap-2 mb-3">
                <button onClick={enterGame} className="w-full py-3 rounded-xl bg-yellow-400 text-black font-extrabold">CONNECT WALLET</button>
                <button onClick={enterGame} className="w-full py-3 rounded-xl bg-white/10 border border-white/15 font-semibold">SKIP</button>
                <button onClick={() => setHowOpen(true)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 font-semibold">HOW TO PLAY</button>
              </div>
              <p className="text-xs text-white/50">Wallet integration coming soon. You can start with SKIP.</p>
            </div>
          </div>
        )}

        {/* How To Play modal */}
        {howOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/70 flex items-center justify-center p-4" onClick={() => setHowOpen(false)}>
            <div className="w-full max-w-lg rounded-2xl bg-[#0d0f14] border border-white/10 p-5 text-left" onClick={(e)=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">How to Play</h3>
                <button onClick={() => setHowOpen(false)} className="text-white/70 hover:text-white">✕</button>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-sm text-white/90">
                <li>Your cart runs on <b>4 rails</b>. Tap/click above or below the cart (or use W/↑ and S/↓) to switch rails.</li>
                <li>Collect <b>Coins</b> on the rails or press <b>Space</b> / tap the cart to <b>DIG</b> for instant coins.</li>
                <li><b>Avoid rocks.</b> Hitting a rock causes a short stun and removes a small % of your unbanked coins.</li>
                <li>Pick up <b>Magnets</b> to pull nearby coins for a few seconds.</li>
                <li><b>Gifts</b> appear every {GIFTS_INTERVAL_SEC/60} minutes and are the only source of <b>Diamonds</b>.</li>
                <li>Collecting <b>3 Diamonds</b> triggers a <b>Big Gift</b> with a strong temporary multiplier.</li>
                <li>Press <b>Claim → Bank</b> to move coins into your Bank. Only Bank balance can be used for <b>Upgrades</b> (DPS/GOLD/Magnet/Dog).</li>
                <li>Passive mining happens <b>only while you are offline</b>, up to 6 hours (40% efficiency).</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* UI components */
function Stat({ label, value }) {
  return (
    <div className="p-3 rounded-2xl border border-white/10 bg-white/5">
      <div className="text-[11px] text-white/60">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
function Card({ title, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_6px_24px_rgba(0,0,0,0.25)]">
      <h3 className="font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}
function UpgradeRow({ label, level, price, can, onBuy }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-white/60">Level: {level} • Cost: {fmt(price)}</div>
        {!can && <div className="text-xs text-rose-300/80 mt-0.5">Not enough Bank — press “Claim → Bank” first</div>}
      </div>
      <button className="px-3 py-2 rounded-xl border border-white/15 disabled:opacity-40 hover:bg-white/10" disabled={!can} onClick={onBuy}>
        Buy (cost: {fmt(price)})
      </button>
    </div>
  );
}

/* World helpers */
function spawnEntity(wr) {
  const rail = Math.floor(Math.random() * WORLD.rails);
  const type = pickType();
  const y = wr.railY[rail] - 40;
  const h = 64, w = 64;
  wr.entities.push({ type, rail, x: (wr.canvasW || 1280) + 80, y, w, h, vx: -wr.speed });
}
function pickType() {
  const r = Math.random();
  if (r < WORLD.coinChance) return "coin";
  if (r < WORLD.coinChance + WORLD.rockChance) return "rock";
  return "magnet";
}
function stepWorld(wr, dt, onCoin, onRock, onMagnet) {
  let c = wr.canvas;
  if (!c) { wr.canvas = document.querySelector("canvas"); c = wr.canvas; }
  if (!c) return;
  wr.canvasW = c.width;

  const magnetActive = Date.now() < wr.magnetUntil;
  const magnetRadius = 60 + (wr.magnetLevel || 0) * 10 + (magnetActive ? 60 : 0);

  const v = -wr.speed * (dt / 1000);
  wr.entities.forEach((e) => { e.x += v; });

  const cartX = wr.cartX;
  const cartY = wr.railY[wr.cartRail] - wr.cartH * 0.5;
  const cartR = Math.min(wr.cartW, wr.cartH) * 0.45;

  const keep = [];
  for (const e of wr.entities) {
    // magnet pull for coins
    if ((e.type === "coin") &&
        distance(e.x + e.w/2, e.y + e.h/2, cartX + wr.cartW/2, cartY + wr.cartH/2) < magnetRadius) {
      const dx = (cartX + wr.cartW/2) - (e.x + e.w/2);
      const dy = (cartY + wr.cartH/2) - (e.y + e.h/2);
      e.x += dx * 0.06; e.y += dy * 0.06;
    }
    if (intersectCircleAABB(cartX + wr.cartW/2, cartY + wr.cartH/2, cartR, e.x, e.y, e.w, e.h)) {
      if (e.type === "coin") onCoin();
      else if (e.type === "rock") onRock();
      else if (e.type === "magnet") onMagnet();
      continue;
    }
    if (e.x > -120) keep.push(e);
  }
  wr.entities = keep;
}

function drawCanvas(c, wr, frame, hitFxUntil) {
  if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.width, h = c.height;
  const { images } = wr;

  // Background
  if (images.bg && images.bg instanceof HTMLImageElement && images.bg.complete && images.bg.naturalWidth > 0) {
    ctx.drawImage(images.bg, 0, 0, w, h);
  } else { ctx.fillStyle = "#0b0e13"; ctx.fillRect(0, 0, w, h); }

  // Rails overlay
  if (images.railOverlay && images.railOverlay instanceof HTMLImageElement && images.railOverlay.complete && images.railOverlay.naturalWidth > 0) {
    ctx.drawImage(images.railOverlay, 0, 0, w, h);
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 2;
    wr.railY.forEach((y) => { ctx.beginPath(); ctx.moveTo(0, y + 32); ctx.lineTo(w, y + 32); ctx.stroke(); });
  }

  // Entities
  for (const e of wr.entities) {
    const img = images[e.type];
    if (img && img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ctx.drawImage(img, e.x, e.y, e.w, e.h);
    else {
      ctx.fillStyle = e.type === "rock" ? "#6b7280" : e.type === "coin" ? "#f59e0b" : "#a78bfa";
      ctx.fillRect(e.x, e.y, e.w, e.h);
    }
  }

  // Cart sprite
  const cartY = wr.railY[wr.cartRail] - wr.cartH * 0.5;
  const cartImg = images.cart;
  if (cartImg && cartImg instanceof HTMLImageElement && cartImg.complete && cartImg.naturalWidth > 0) {
    const fw = cartImg.width / 4, fh = cartImg.height;
    ctx.drawImage(cartImg, fw * frame, 0, fw, fh, wr.cartX, cartY, wr.cartW, wr.cartH);
  } else { ctx.fillStyle = "#fff"; ctx.fillRect(wr.cartX, cartY, wr.cartW, wr.cartH); }

  // Magnet halo
  if (Date.now() < wr.magnetUntil) {
    const r = 60 + (wr.magnetLevel || 0) * 10 + 60;
    ctx.beginPath(); ctx.arc(wr.cartX + wr.cartW/2, cartY + wr.cartH/2, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(147,197,253,0.4)"; ctx.lineWidth = 3; ctx.stroke();
  }

  // Rock hit flash
  if (Date.now() < hitFxUntil) {
    ctx.fillStyle = "rgba(255,0,0,0.15)";
    ctx.fillRect(0, 0, w, h);
  }
}

function distance(x1,y1,x2,y2){ const dx=x2-x1, dy=y2-y1; return Math.hypot(dx,dy); }
function intersectCircleAABB(cx,cy,cr, rx,ry,rw,rh) {
  const nx = Math.max(rx, Math.min(cx, rx+rw)); const ny = Math.max(ry, Math.min(cy, ry+rh));
  return distance(cx,cy,nx,ny) <= cr;
}
