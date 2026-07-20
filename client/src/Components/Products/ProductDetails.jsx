import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { store } from "../../store.config.js";
import { toast } from "react-toastify";
import { useLanguage, getPresetLabel, normalizePresetValue } from "../../i18n.jsx";

/* ------------------------------------------------------------------ */
/*  design tokens & helpers                                            */
/*  Visual language: "spec sheet meets showroom".                      */
/* ------------------------------------------------------------------ */

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;

const pad = (n) => String(n).padStart(2, "0");

function buildWhatsappLink(product, language) {
  const productUrl = `${window.location.origin}/${product._id}`;

  const text = language === "ar"
    ? `مرحباً،\n\nأنا مهتم بهذا الطراز.\n\nالطراز : ${product.name}\n\n${productUrl}\n\nهل هو متوفر؟`
    : `Bonjour,\n\nJe suis intéressé par ce modèle.\n\nModèle : ${product.name}\n\n${productUrl}\n\nEst-il disponible ?`;

  return `https://wa.me/${store.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

/* ---------- scoped keyframes / effects ----------------------------- */

const css = `
.pd-reveal{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
.pd-in{opacity:1;transform:none}
.pd-cta{position:relative;overflow:hidden;isolation:isolate}
.pd-cta::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.35) 50%,transparent 60%);transform:translateX(-160%) skewX(-8deg);transition:transform .9s cubic-bezier(.22,1,.36,1);pointer-events:none}
.pd-cta:hover::after{transform:translateX(160%) skewX(-8deg)}
.pd-skel{background:linear-gradient(100deg,#f4f4f5 30%,#e9e9ec 45%,#f4f4f5 60%);background-size:220% 100%;animation:pdShimmer 1.5s linear infinite}
@keyframes pdShimmer{to{background-position:-220% 0}}
.pd-outline-dark{color:transparent;-webkit-text-stroke:1.5px rgba(255,255,255,.08)}
.pd-outline-light{color:transparent;-webkit-text-stroke:1.5px rgba(24,24,27,.07)}
.pd-blink{animation:pdBlink 1.8s ease-in-out infinite}
@keyframes pdBlink{0%,100%{opacity:1}50%{opacity:.25}}
.pd-lightbox{animation:pdFade .2s ease both}
@keyframes pdFade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  .pd-reveal{transition:none;opacity:1;transform:none}
  .pd-cta::after{display:none}
  .pd-skel,.pd-blink,.pd-lightbox{animation:none}
}
`;

const PDStyles = () => <style>{css}</style>;

/* ---------- inline icons ------------------------------------------- */

const ArrowIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4.5 12h15m-6.5-6.5L19.5 12 13 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChatIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 3.5c-4.83 0-8.75 3.58-8.75 8 0 1.97.78 3.77 2.07 5.16L4.4 20.6l4.04-1.55c1.08.35 2.28.45 3.56.45 4.83 0 8.75-3.58 8.75-8s-3.92-8-8.75-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

const DimensionIcon = ({ className = "", c = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className || c} aria-hidden="true">
    <path d="M4 15v5h5M20 9V4h-5M4.5 19.5l15-15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- spec icon set ------------------------------------------ */

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: "currentColor",
};

const SpecIcons = {
  speed: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <path d="M4 14a8 8 0 1 1 16 0" />
      <path d="M12 14L15 11" strokeLinecap="round" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  range: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <path d="M7 3.5a2.6 2.6 0 0 1 2.6 2.6C9.6 8 7 10.5 7 10.5S4.4 8 4.4 6.1A2.6 2.6 0 0 1 7 3.5Z" />
      <circle cx="7" cy="6.1" r=".7" fill="currentColor" stroke="none" />
      <path d="M17 12.5a2.4 2.4 0 0 1 2.4 2.4c0 1.8-2.4 4.1-2.4 4.1s-2.4-2.3-2.4-4.1a2.4 2.4 0 0 1 2.4-2.4Z" />
      <path d="M9 8.5c2.5 1 3 3.5 5.5 4.5" strokeDasharray="1.5 2" />
    </svg>
  ),
  power: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <path d="M13 2.5 4.5 13.5H10l-1 8 9.5-12H13l1-7Z" />
    </svg>
  ),
  battery: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <rect x="3" y="7.5" width="14" height="9" rx="2" />
      <rect x="8" y="10" width="6" height="4" rx="1" fill="currentColor" stroke="none" />
      <path d="M17 9.5h2" />
      <path d="M7 9.5H5" />
    </svg>
  ),
  charge: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <rect x="2.5" y="8" width="16" height="9.5" rx="2" />
      <path d="M21.5 11.2v3" />
      <path d="M7.5 8V5.5h6V8" />
      <path d="m11 10.5-2 3h2.4l-.6 2.5 2.6-3.3H13l.4-2.2Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  torque: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <path d="M5 15c-2 1-2.8 4-2.8 4s3-.8 4-2.8" />
      <path d="M14 3.5c3.2 0 6.3 3 6.3 3s-.8 6.4-8 11.3l-4-4C13 6.4 10.8 3.5 14 3.5Z" />
      <circle cx="14.5" cy="9.3" r="1.4" />
    </svg>
  ),
  weight: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <path d="M9 8.5a3 3 0 1 1 6 0" />
      <path d="M7.7 8.5h8.6l1.9 11.5H5.8L7.7 8.5Z" />
    </svg>
  ),
  brake: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" />
    </svg>
  ),
  tire: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
    </svg>
  ),
  warranty: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <path d="M12 3 5 5.8v5c0 5 3.4 8 7 9.7 3.6-1.7 7-4.7 7-9.7v-5L12 3Z" />
      <path d="m9 11.8 2.1 2.1L15 10" />
    </svg>
  ),
  motor: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <rect x="4.5" y="7.5" width="11" height="9" rx="1.5" />
      <path d="M15.5 10h2.2l1.8-1.6v7l-1.8-1.6h-2.2" />
      <path d="M7.5 4.5v3M12.5 4.5v3" />
    </svg>
  ),
  spark: (c) => (
    <svg {...iconBase} className={c} aria-hidden="true">
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M6 6l2.4 2.4M15.6 15.6 18 18M18 6l-2.4 2.4M8.4 15.6 6 18" />
    </svg>
  ),
};

/* label → icon key. Matches EN / FR / AR vocab; falls back to spark. */
const ICON_RULES = [
  [/speed|vitesse|سرعة|كم\/س|km\/?h|mph/i, "speed"],
  [/range|autonom|autonomie|distance|مدى|المدى/i, "range"],
  [/charg|recharg|شحن/i, "charge"],
  [/batter|voltage|tension|capacit|volt|\bah\b|\bv\b|بطاري|جهد/i, "battery"],
  [/torque|couple|nm|ft.?lb|عزم/i, "torque"],
  [/motor|moteur|power|puissance|\bkw\b|\bhp\b|محرك|قوة|طاقة/i, "power"],
  [/weight|poids|\bkg\b|mass|وزن/i, "weight"],
  [/brake|frein|disc|abs|فرام|مكابح|قرص/i, "brake"],
  [/tire|tyre|wheel|pneu|roue|إطار|عجل/i, "tire"],
  [/warrant|garantie|ضمان/i, "warranty"],
  [/engine|type|drive|transmission|نوع/i, "motor"],
];

function iconForLabel(label = "") {
  for (const [re, key] of ICON_RULES) if (re.test(label)) return SpecIcons[key];
  return SpecIcons.spark;
}

/* per-box color system — full literal classes so Tailwind JIT keeps them. */
const BOX_COLORS = [
  {
    tile: "bg-rose-100 text-rose-600 ring-rose-200/70",
    ring: "ring-rose-100",
    idx: "text-rose-400",
    shadow: "shadow-[0_16px_38px_-18px_rgba(244,63,94,0.5)]",
    hover: "hover:shadow-[0_28px_56px_-16px_rgba(244,63,94,0.6)]",
    hoverTile: "group-hover:bg-rose-600",
  },
  {
    tile: "bg-amber-100 text-amber-600 ring-amber-200/70",
    ring: "ring-amber-100",
    idx: "text-amber-400",
    shadow: "shadow-[0_16px_38px_-18px_rgba(245,158,11,0.5)]",
    hover: "hover:shadow-[0_28px_56px_-16px_rgba(245,158,11,0.6)]",
    hoverTile: "group-hover:bg-amber-500",
  },
  {
    tile: "bg-emerald-100 text-emerald-600 ring-emerald-200/70",
    ring: "ring-emerald-100",
    idx: "text-emerald-400",
    shadow: "shadow-[0_16px_38px_-18px_rgba(16,185,129,0.5)]",
    hover: "hover:shadow-[0_28px_56px_-16px_rgba(16,185,129,0.6)]",
    hoverTile: "group-hover:bg-emerald-600",
  },
  {
    tile: "bg-sky-100 text-sky-600 ring-sky-200/70",
    ring: "ring-sky-100",
    idx: "text-sky-400",
    shadow: "shadow-[0_16px_38px_-18px_rgba(14,165,233,0.5)]",
    hover: "hover:shadow-[0_28px_56px_-16px_rgba(14,165,233,0.6)]",
    hoverTile: "group-hover:bg-sky-600",
  },
];

/* ---------- scroll-staggered reveal -------------------------------- */

function Reveal({ children, delay = 0, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -36px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`pd-reveal ${inView ? "pd-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ---------- magnetic CTA ------------------------------------------- */

function MagneticLink({ href, className = "", children }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 9;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 7;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`pd-cta transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </a>
  );
}

/* ---------- animated price count-up -------------------------------- */

function AnimatedPrice({ value, fallback }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf;
    const start = performance.now();
    const duration = 950;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  if (value == null) {
    return (
      <p className="font-['Space_Grotesk'] font-bold text-[26px] text-zinc-900 m-0">{fallback}</p>
    );
  }

  return (
    <p className="flex items-baseline gap-2.5 m-0">
      <span className="font-['Space_Grotesk'] font-bold text-[clamp(32px,4vw,42px)] tracking-[-0.02em] text-zinc-900 tabular-nums">
        {display.toLocaleString()}
      </span>
      <span className="font-['JetBrains_Mono'] text-[12px] tracking-[0.2em] font-medium text-red-600">DA</span>
    </p>
  );
}

/* ---------- section heading ---------------------------------------- */

function SectionHeading({ index, title, count }) {
  return (
    <div className="flex items-center gap-4 sm:gap-5 mb-8 sm:mb-10">
      <span className="font-['JetBrains_Mono'] text-[12px] tracking-[0.2em] text-red-600">{index}</span>
      <h2 className="font-['Space_Grotesk'] font-bold text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-zinc-900 m-0">
        {title}
      </h2>
      <span className="flex-1 h-px bg-zinc-200/80" />
      {count != null && (
        <span className="font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] text-zinc-400">{pad(count)}</span>
      )}
    </div>
  );
}

/* ---------- spotlight card (the "important" specs) ----------------- */

function SpecCard({ index, icon: Icon, value, label, color }) {
  return (
    <div
      className={`group relative h-full rounded-[24px] bg-white p-6 ring-1 ${color.ring} ${color.shadow} ${color.hover} transition-all duration-300 hover:-translate-y-1.5 sm:p-7`}
    >
      <span className={`absolute right-4 top-4 font-['JetBrains_Mono'] text-[10px] tracking-[0.1em] ${color.idx}`}>
        {pad(index)}
      </span>
      <span
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${color.tile} ${color.hoverTile} transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-white group-hover:ring-transparent`}
      >
        {Icon ? <Icon c="h-[23px] w-[23px]" /> : null}
      </span>
      <p className="m-0 font-['Space_Grotesk'] text-[clamp(19px,2.2vw,25px)] font-bold leading-none tracking-[-0.02em] text-zinc-900">
        {value}
      </p>
      <p className="mt-2.5 m-0 font-['JetBrains_Mono'] text-[10.5px] uppercase leading-snug tracking-[0.16em] text-zinc-500">
        {label}
      </p>
    </div>
  );
}

/* ---------- point row (the "rest") --------------------------------- */

function SpecPoint({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-100 py-3.5">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-400 ring-1 ring-zinc-200">
        {Icon ? <Icon c="h-[16px] w-[16px]" /> : null}
      </span>
      <span className="text-[13.5px] text-zinc-500">{label}</span>
      <span aria-hidden="true" className="mx-1 flex-1 self-center border-b border-dotted border-zinc-200" />
      <span className="text-right font-['Space_Grotesk'] text-[14px] font-bold text-zinc-900">{value}</span>
    </div>
  );
}

/* ---------- gallery ------------------------------------------------ */

function Gallery({ images, name, active, setActive, onOpenImage }) {
  const safeImages = images?.length ? images : [{ url: null }];
  const activeImage = safeImages[active]?.url;
  const many = safeImages.length > 1;

  const step = (dir) =>
    setActive((c) => (c + dir + safeImages.length) % safeImages.length);

  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-4 rotate-[1.3deg] rounded-[36px] border border-zinc-200/80 pointer-events-none" />
      <div aria-hidden="true" className="absolute top-0 left-0 w-56 h-56 rounded-full bg-red-500/10 blur-[90px] pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-amber-400/10 blur-[100px] pointer-events-none" />

      <div className="group relative w-full aspect-square rounded-[32px] overflow-hidden bg-zinc-100 ring-1 ring-zinc-200/70 shadow-[0_30px_80px_-40px_rgba(24,24,27,0.35)]">
        <button
          type="button"
          onClick={() => onOpenImage(active)}
          aria-label="Zoom"
          className="absolute inset-0 w-full h-full cursor-zoom-in"
        >
          {activeImage ? (
            <img
              key={activeImage}
              src={activeImage}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl text-zinc-300">🏍</div>
          )}
        </button>

        <span aria-hidden="true" className="pointer-events-none absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white/80 rounded-tl-lg mix-blend-difference" />
        <span aria-hidden="true" className="pointer-events-none absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-white/80 rounded-tr-lg mix-blend-difference" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-white/80 rounded-bl-lg mix-blend-difference" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-white/80 rounded-br-lg mix-blend-difference" />

        <span className="pointer-events-none absolute bottom-5 left-5 inline-flex items-baseline gap-1 rounded-full bg-black/45 backdrop-blur-md px-3.5 py-1.5 font-['JetBrains_Mono'] text-[11px] tracking-[0.2em] text-white">
          {pad(active + 1)}
          <span className="text-white/50">/ {pad(safeImages.length)}</span>
        </span>

        <span className="pointer-events-none absolute bottom-5 right-5 inline-flex items-center rounded-full bg-black/45 backdrop-blur-md px-3.5 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Zoom
        </span>

        {many && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 hover:scale-105"
            >
              <ArrowIcon className="w-5 h-5 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 hover:scale-105"
            >
              <ArrowIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="flex gap-3 mt-5 overflow-x-auto pb-2">
          {safeImages.map((img, i) => (
            <button
              key={img._id ?? `img-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 w-[74px] h-[74px] rounded-2xl overflow-hidden transition-all duration-300 ${
                active === i
                  ? "ring-2 ring-red-500 ring-offset-2 ring-offset-white"
                  : "ring-1 ring-zinc-200 opacity-55 grayscale hover:opacity-100 hover:grayscale-0"
              }`}
            >
              {img.url ? (
                <img src={img.url} alt={`${name} — ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-100" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- lightbox (portaled to <body> so it clears the navbar) -- */

function Lightbox({ product, index, setIndex, zoom, setZoom, onClose }) {
  const images = product.images || [];
  const count = images.length;

  const node = (
    <div
      className="pd-lightbox fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-xl"
      onClick={onClose}
    >
      {/* header: counter + model name */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-1">
        {count > 0 && (
          <span className="font-['JetBrains_Mono'] text-[12px] tracking-[0.25em] text-white/80">
            {pad(index + 1)} <span className="text-white/40">/ {pad(count)}</span>
          </span>
        )}
        <span className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/50">
          {product.name}
        </span>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all duration-300 hover:rotate-90 hover:bg-white/15"
      >
        <CloseIcon className="h-5 w-5" />
      </button>

      {count > 1 && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation();
            setIndex((current) => (current === 0 ? count - 1 : current - 1));
            setZoom(1);
          }}
          className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all duration-300 hover:scale-105 hover:bg-white/15"
        >
          <ArrowIcon className="h-5 w-5 rotate-180" />
        </button>
      )}

      <div
        className="relative flex h-full w-full max-w-6xl items-center justify-center p-4 sm:p-10"
        onClick={(event) => event.stopPropagation()}
      >
        {images[index]?.url ? (
          <img
            src={images[index].url}
            alt={product.name}
            onClick={() => setZoom((z) => (z === 1 ? 1.75 : 1))}
            style={{ transform: `scale(${zoom})` }}
            className={`max-h-full max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-500 ease-out ${
              zoom > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
            }`}
          />
        ) : (
          <div className="text-8xl text-white/80">🏍</div>
        )}
      </div>

      {count > 1 && (
        <button
          type="button"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation();
            setIndex((current) => (current + 1) % count);
            setZoom(1);
          }}
          className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all duration-300 hover:scale-105 hover:bg-white/15"
        >
          <ArrowIcon className="h-5 w-5" />
        </button>
      )}

      {count > 1 && (
        <div
          className="absolute bottom-5 left-1/2 z-10 flex max-w-[92vw] -translate-x-1/2 gap-2.5 overflow-x-auto px-2 py-1"
          onClick={(event) => event.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img._id ?? `lb-${i}`}
              type="button"
              onClick={() => {
                setIndex(i);
                setZoom(1);
              }}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
                index === i ? "ring-2 ring-red-500" : "opacity-50 ring-1 ring-white/20 hover:opacity-100"
              }`}
            >
              {img.url ? (
                <img src={img.url} alt={`${product.name} — ${i + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-zinc-800" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}

/* ================================================================== */
/*  page                                                               */
/* ================================================================== */

export default function ProductDetails() {
  const { id } = useParams();
  const { t, isRTL, language } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);
      setProduct(null);
      setActive(0);
      setLightboxIndex(0);

      try {
        const res = await axios.get(`${API_BASE_URL}/products/${id}`, {
          signal: controller.signal,
        });
        if (!ignore) setProduct(res.data);
      } catch (err) {
        if (axios.isCancel(err) || err.code === "ERR_CANCELED") return;
        if (!ignore) {
          if (err.response?.status === 404) setNotFound(true);
          else toast.error("Impossible de charger ce produit");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const count = product?.images?.length || 0;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
        setZoom(1);
      } else if (event.key === "ArrowRight" && count > 1) {
        setLightboxIndex((c) => (c + 1) % count);
        setZoom(1);
      } else if (event.key === "ArrowLeft" && count > 1) {
        setLightboxIndex((c) => (c === 0 ? count - 1 : c - 1));
        setZoom(1);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, product]);

  useEffect(() => {
    if (lightboxOpen) setActive(lightboxIndex);
  }, [lightboxIndex, lightboxOpen]);

  const openLightbox = (index = 0) => {
    setLightboxIndex(index);
    setZoom(1);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoom(1);
  };

  /* ---------- loading skeleton ------------------------------------- */

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-x-clip bg-white px-5 sm:px-[26px] py-8 sm:py-14">
        <PDStyles />
        <div className="mx-auto max-w-[1160px]">
          <div className="mb-12 flex justify-center">
            <span className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 ring-1 ring-zinc-200 shadow-sm font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              <span className="h-3 w-3 rounded-full border-2 border-zinc-200 border-t-red-500 animate-spin" />
              {t("productDetails.loading")}
            </span>
          </div>

          <div className="pd-skel mb-10 h-3.5 w-48 rounded-full" />
          <div className="pd-skel mb-4 h-[clamp(40px,7vw,76px)] w-[82%] rounded-2xl" />
          <div className="pd-skel mb-12 h-[clamp(40px,7vw,76px)] w-[55%] rounded-2xl" />

          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <div className="pd-skel aspect-square w-full rounded-[32px]" />
              <div className="mt-5 flex gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="pd-skel h-[74px] w-[74px] rounded-2xl" />
                ))}
              </div>
            </div>
            <div>
              <div className="pd-skel h-10 w-44 rounded-xl" />
              <div className="mt-7 space-y-3">
                <div className="pd-skel h-3.5 w-full rounded-full" />
                <div className="pd-skel h-3.5 w-[92%] rounded-full" />
                <div className="pd-skel h-3.5 w-[70%] rounded-full" />
              </div>
              <div className="pd-skel mt-9 h-[58px] w-full rounded-full" />
              <div className="mt-10 space-y-3.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="pd-skel h-9 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 404 -------------------------------------------------- */

  if (notFound || !product) {
    return (
      <div className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-x-clip bg-white px-5 text-center">
        <PDStyles />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-red-100/60 blur-[100px]" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-amber-100/60 blur-[100px]" />
        <div aria-hidden="true" className="pd-outline-light pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-['Space_Grotesk'] font-bold leading-none text-[clamp(180px,38vw,420px)]">
          404
        </div>

        <div className="relative">
          <p className="mb-5 text-6xl">🏍</p>
          <h1 className="font-['Space_Grotesk'] font-bold text-[clamp(26px,4vw,36px)] tracking-[-0.02em] text-zinc-900 m-0 mb-3">
            {t("productDetails.notFoundTitle")}
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-zinc-500 m-0">
            {t("productDetails.notFoundMessage")}
          </p>
          <Link
            to="/"
            className="pd-cta mt-8 inline-flex items-center gap-3 rounded-full bg-red-600 px-8 py-4 font-['Space_Grotesk'] text-sm font-bold text-white no-underline shadow-[0_20px_44px_-16px_rgba(220,38,38,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500"
          >
            {t("productDetails.backHome")}
            <ArrowIcon className={`h-[16px] w-[16px] ${isRTL ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- derived ---------------------------------------------- */

  const { length, width, height } = product.dimensions || {};
  const hasDimensions = length != null && width != null && height != null;
  const categoryName = product.category?.name || t("productDetails.categoryFallback");
  const whatsappHref = buildWhatsappLink(product, language);
  const imageCount = product.images?.length || 0;
  const ghostWord = (product.name || "").split(" ")[0];

  const specsList = product.specs || [];
  const REQUIRED_SPEC_KEYS = ["max_speed", "autonomy", "nominal_power", "charging_time"];
  const primaryMap = {};
  const restSpecs = [];

  specsList.forEach((spec) => {
    const norm = normalizePresetValue("spec", spec.label);
    if (REQUIRED_SPEC_KEYS.includes(norm)) {
      primaryMap[norm] = spec.value;
    } else {
      restSpecs.push(spec);
    }
  });

  const primarySpecs = REQUIRED_SPEC_KEYS.map((key) => {
    const value = (primaryMap[key] || "").trim();
    return {
      label: key,
      value: value || (key === "charging_time" ? "6-8H" : "-"),
    };
  });

  const hasPoints = restSpecs.length > 0 || hasDimensions;
  const totalCount = restSpecs.length + REQUIRED_SPEC_KEYS.length + (hasDimensions ? 1 : 0);

  /* ---------- page ------------------------------------------------- */

  return (
    <div className="relative min-h-screen overflow-x-clip bg-white px-5 sm:px-[26px] py-8 sm:py-14">
      <PDStyles />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] opacity-[0.05] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-240px] h-[480px] w-[min(780px,100%)] -translate-x-1/2 rounded-full bg-red-100/50 blur-[130px]" />

      <div className="relative z-[2] mx-auto max-w-[1160px]">
        {/* breadcrumb */}
        <Reveal>
          <nav className="mb-10 flex flex-wrap items-center gap-2.5 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.14em] text-zinc-400">
            <Link to="/" className="text-zinc-400 no-underline transition-colors hover:text-zinc-900">
              {t("productDetails.breadcrumbHome")}
            </Link>
            <span className="text-zinc-300">/</span>
            <span>{categoryName}</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-700">{product.name}</span>
          </nav>
        </Reveal>

        {/* editorial header */}
        <Reveal delay={50}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3.5 py-1.5 ring-1 ring-red-100 font-['JetBrains_Mono'] text-[10px] font-medium uppercase tracking-[0.22em] text-red-600">
              <span className="pd-blink h-1.5 w-1.5 rounded-full bg-red-500" />
              {categoryName}
            </span>
            {!product.available && (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 ring-1 ring-amber-100 font-['JetBrains_Mono'] text-[10px] font-medium uppercase tracking-[0.22em] text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t("productDetails.unavailable")}
              </span>
            )}
            <span className="hidden h-px flex-1 bg-zinc-200/70 sm:block" />
            {imageCount > 0 && (
              <span className="hidden font-['JetBrains_Mono'] text-[10px] tracking-[0.3em] text-zinc-300 sm:block">
                {pad(imageCount)}
              </span>
            )}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="font-['Space_Grotesk'] font-bold text-[clamp(40px,7.5vw,92px)] leading-[0.98] tracking-[-0.035em] text-zinc-900 m-0 mb-10 lg:mb-14">
            {product.name}
          </h1>
        </Reveal>

        {/* gallery + sticky buy rail */}
        <div className="mb-20 grid grid-cols-1 items-start gap-12 lg:mb-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <Reveal delay={150}>
            <Gallery
              key={product._id ?? id}
              images={product.images}
              name={product.name}
              active={active}
              setActive={setActive}
              onOpenImage={openLightbox}
            />
          </Reveal>

          <Reveal delay={220} className="lg:sticky lg:top-8">
            <AnimatedPrice value={product.price} fallback={t("productDetails.priceOnDemand")} />

            {product.description && (
              <p className="mt-6 text-[15.5px] leading-[1.85] text-zinc-500 m-0">
                {product.description}
              </p>
            )}

            <MagneticLink
              href={whatsappHref}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-red-600 px-8 py-[18px] font-['Space_Grotesk'] text-[15.5px] font-bold text-white no-underline ring-1 ring-red-500/50 shadow-[0_24px_50px_-18px_rgba(220,38,38,0.65),inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-red-500"
            >
              <ChatIcon className="h-[18px] w-[18px]" />
              {t("productDetails.contact")}
              <ArrowIcon className={`h-[18px] w-[18px] ${isRTL ? "rotate-180" : ""}`} />
            </MagneticLink>

            <div className="mt-7 flex items-center gap-2.5 font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-[0.14em] text-zinc-400">
              <ChatIcon className="h-[13px] w-[13px] text-emerald-500" />
              {t("productDetails.contact")} · WhatsApp
            </div>
          </Reveal>
        </div>

        {/* characteristics: spotlight cards + point list */}
        {(specsList.length > 0 || hasDimensions) && (
          <section className="mb-16 sm:mb-24">
            <Reveal>
              <SectionHeading index="01" title={t("productDetails.characteristics")} count={totalCount} />
            </Reveal>

            {primarySpecs.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3.5 sm:mb-5 sm:gap-5 lg:grid-cols-4">
                {primarySpecs.map((s, i) => (
                  <Reveal key={i} delay={Math.min(i * 40, 240)}>
                    <SpecCard
                      index={i + 1}
                      icon={iconForLabel(s.label)}
                      value={s.value}
                      label={getPresetLabel("spec", s.label, language)}
                      color={BOX_COLORS[i % BOX_COLORS.length]}
                    />
                  </Reveal>
                ))}
              </div>
            )}

            {hasPoints && (
              <Reveal delay={120}>
                <div className="rounded-[24px] bg-zinc-50/60 px-5 ring-1 ring-zinc-200/70 sm:px-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-12">
                    {restSpecs.map((s, i) => (
                      <SpecPoint
                        key={i}
                        icon={iconForLabel(s.label)}
                        label={getPresetLabel("spec", s.label, language)}
                        value={s.value}
                      />
                    ))}
                    {hasDimensions && (
                      <SpecPoint
                        icon={DimensionIcon}
                        label="L × W × H"
                        value={`${length} × ${width} × ${height} mm`}
                      />
                    )}
                  </div>
                </div>
              </Reveal>
            )}
          </section>
        )}

        {/* equipment manifest */}
        {product.features?.length > 0 && (
          <section className="mb-20 sm:mb-28">
            <Reveal>
              <SectionHeading
                index={specsList.length > 0 || hasDimensions ? "02" : "01"}
                title={t("productDetails.equipments")}
                count={product.features.length}
              />
            </Reveal>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {product.features.map((f, i) => {
                const c = BOX_COLORS[i % BOX_COLORS.length];
                return (
                  <Reveal key={i} as="span" delay={Math.min(i * 40, 320)} className="inline-flex">
                    <span className={`group inline-flex cursor-default items-center gap-2.5 rounded-full bg-white px-[18px] py-2.5 ring-1 ${c.ring} ${c.shadow} text-[13.5px] text-zinc-700 transition-all duration-300 hover:-translate-y-1 ${c.hover}`}>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ${c.tile} ${c.hoverTile} transition-colors duration-300 group-hover:text-white group-hover:ring-transparent`}>
                        <span className="font-['JetBrains_Mono'] text-[13px] leading-none transition-transform duration-300 group-hover:rotate-90">+</span>
                      </span>
                      {getPresetLabel("feature", f, language)}
                    </span>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        {/* cinematic closing panel */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] bg-zinc-950 px-6 py-16 text-center sm:px-16 sm:py-24">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
            <div aria-hidden="true" className="pointer-events-none absolute -top-28 -left-24 h-80 w-80 rounded-full bg-red-600/30 blur-[110px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />
            <div aria-hidden="true" className="pd-outline-dark pointer-events-none absolute inset-x-0 top-4 select-none overflow-hidden whitespace-nowrap text-center font-['Space_Grotesk'] font-bold uppercase leading-none text-[clamp(90px,17vw,240px)]">
              {ghostWord}
            </div>

            <div className="relative">
              <p className="mb-5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.35em] text-white/40 m-0">
                {categoryName}
              </p>
              <h2 className="mx-auto mb-9 max-w-[560px] font-['Space_Grotesk'] font-bold text-[clamp(26px,4.2vw,44px)] leading-[1.12] tracking-[-0.02em] text-white m-0">
                {t("productDetails.ready")} {product.name} ?
              </h2>
              <MagneticLink
                href={whatsappHref}
                className="inline-flex items-center gap-3 rounded-full bg-red-600 px-10 py-[18px] font-['Space_Grotesk'] text-[15.5px] font-bold text-white no-underline ring-1 ring-white/15 shadow-[0_28px_70px_-16px_rgba(220,38,38,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-red-500"
              >
                <ChatIcon className="h-[18px] w-[18px]" />
                {t("productDetails.contact")}
                <ArrowIcon className={`h-[18px] w-[18px] ${isRTL ? "rotate-180" : ""}`} />
              </MagneticLink>
            </div>
          </div>
        </Reveal>
      </div>

      {/* lightbox (portaled, above the navbar) */}
      {lightboxOpen && (
        <Lightbox
          product={product}
          index={lightboxIndex}
          setIndex={setLightboxIndex}
          zoom={zoom}
          setZoom={setZoom}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}