import logo from "../../assets/Logo.jpg";
import { store } from "../../store.config.js";
import { useLanguage } from "../../i18n.jsx";

/* ------------------------------------------------------------------ *
 *  Hero — brand-forward, and dimensionally identical in every         *
 *  language. The two text blocks (headline + subtitle) reserve a      *
 *  fixed min-height sized to the taller wrap, so switching FR <-> AR  *
 *  never reflows the elements below them. Layout is center-anchored   *
 *  and driven by `dir`, so RTL mirrors cleanly without shifting.      *
 * ------------------------------------------------------------------ */

const heroCss = `
@keyframes heroFade{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes heroSpin{to{transform:rotate(360deg)}}
@keyframes heroFloat{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,7px)}}
.hero-fade{opacity:0;animation:heroFade .8s cubic-bezier(.22,1,.36,1) forwards}
.hero-ring::before{content:"";position:absolute;inset:-6px;border-radius:9999px;background:conic-gradient(from 0deg,#dc2626,#f97316,#fbbf24,#dc2626);animation:heroSpin 6s linear infinite;z-index:0}
.hero-cta{position:relative;overflow:hidden;isolation:isolate}
.hero-cta::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.4) 50%,transparent 60%);transform:translateX(-160%) skewX(-8deg);transition:transform .9s cubic-bezier(.22,1,.36,1)}
.hero-cta:hover::after{transform:translateX(160%) skewX(-8deg)}
.hero-cue{animation:heroFloat 2.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
  .hero-fade{animation:none;opacity:1}
  .hero-ring::before,.hero-cue{animation:none}
  .hero-cta::after{display:none}
}
`;

export default function Hero() {
  const { t, isRTL } = useLanguage();

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const features = t("hero.features") || [];

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="relative w-full min-h-screen overflow-hidden bg-white">
      <style>{heroCss}</style>

      {/* decorative background — dot grid + soft color fields */}
      <div aria-hidden="true" className="pointer-events-none absolute z-100 inset-0">
        <div className="absolute inset-0 opacity-[0.5] [background-image:radial-gradient(#00000014_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-32 left-1/2 h-[520px] w-[min(820px,100%)] -translate-x-1/2 rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute top-1/4 -right-32 h-[480px] w-[480px] rounded-full bg-orange-400/10 blur-[120px]" />
      </div>

      {/* content — center-anchored, so direction never shifts the composition */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[900px] flex-col items-center justify-center px-5 py-24 text-center">
        {/* logo with rotating gradient ring */}
        <div className="hero-fade mb-9" style={{ animationDelay: "0s" }}>
          <div className="hero-ring relative inline-flex rounded-full p-[3px]">
            <img
              src={logo}
              alt={store?.name || "HM Dora Moto"}
              className="relative z-[1] h-32 w-32 rounded-full object-cover ring-4 ring-white sm:h-36 sm:w-36"
            />
          </div>
        </div>

        {/* headline — reserved height keeps FR/AR the same size */}
        <div className="hero-fade flex min-h-[clamp(84px,17vw,184px)] items-center" style={{ animationDelay: ".1s" }}>
          <h1 className="m-0 text-balance font-['Space_Grotesk'] text-[clamp(38px,8vw,84px)] font-bold leading-[1.03] tracking-[-0.03em] text-zinc-900">
            {t("hero.title")}
          </h1>
        </div>

        {/* subtitle — reserved height */}
        <div className="hero-fade flex min-h-[clamp(52px,7vw,64px)] items-start justify-center" style={{ animationDelay: ".2s" }}>
          <p className="m-0 mt-3 max-w-[560px] text-balance text-[15.5px] leading-[1.65] text-zinc-500 sm:text-lg">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* CTAs */}
        <div className="hero-fade mt-8 mb-10 flex flex-wrap justify-center gap-3" style={{ animationDelay: ".3s" }}>
          <button
            onClick={scrollToProducts}
            className="hero-cta inline-flex items-center gap-2.5 rounded-[14px] bg-red-600 px-7 py-4 font-['Space_Grotesk'] text-[16px] font-bold text-white shadow-[0_20px_45px_-18px_rgba(220,38,38,0.6)] ring-1 ring-red-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500"
          >
            {t("hero.cta")}
            <span className="text-lg leading-none">↓</span>
          </button>

          <a
            href={`https://wa.me/${store.contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-[14px] border border-zinc-200 bg-white px-7 py-4 font-['Space_Grotesk'] text-[16px] font-bold text-zinc-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] text-emerald-500" aria-hidden="true">
              <path d="M12 3.5c-4.83 0-8.75 3.58-8.75 8 0 1.97.78 3.77 2.07 5.16L4.4 20.6l4.04-1.55c1.08.35 2.28.45 3.56.45 4.83 0 8.75-3.58 8.75-8s-3.92-8-8.75-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
            {t("hero.whatsapp")}
          </a>
        </div>

        {/* feature pills — order-independent, so RTL/LTR both read cleanly */}
        {features.length > 0 && (
          <div className="hero-fade flex flex-wrap items-center justify-center gap-2.5" style={{ animationDelay: ".4s" }}>
            {features.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3.5 py-1.5 font-['JetBrains_Mono'] text-[12px] text-zinc-500 backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* scroll cue */}
      <button
        onClick={scrollToProducts}
        aria-label={t("hero.scrollLabel")}
        className="hero-cue absolute bottom-7 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-700"
      >
        ↓
      </button>
    </section>
  );
}