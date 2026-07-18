import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { store } from "../store.config.js";
import { useLanguage, getPresetLabel } from "../i18n.jsx";

const sectionCss = `
@keyframes psFade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@keyframes psFadeIn{from{opacity:0}to{opacity:1}}
@keyframes psScaleIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
@keyframes psShimmer{to{background-position:-220% 0}}
.ps-fade{opacity:0;animation:psFade .7s cubic-bezier(.22,1,.36,1) forwards}
.ps-skel{background:linear-gradient(100deg,#f4f4f5 30%,#e9e9ec 45%,#f4f4f5 60%);background-size:220% 100%;animation:psShimmer 1.5s linear infinite}
.ps-modal-bg{animation:psFadeIn .2s ease both}
.ps-modal{animation:psScaleIn .25s cubic-bezier(.22,1,.36,1) both}
@media (prefers-reduced-motion:reduce){
  .ps-fade,.ps-modal-bg,.ps-modal{animation:none;opacity:1}
  .ps-skel{animation:none}
}
`;

function buildWhatsappLink(product, language) {
  const text = language === "ar"
    ? `مرحباً، أنا مهتم بالطراز "${product.name}". هل هو متوفر؟`
    : `Bonjour, je suis intéressé par le modèle "${product.name}". Est-il disponible ?`;
  return `https://wa.me/${store.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

/* ---------- polished modal (kept; note: not currently opened) ------ */

function ProductModal({ product, onClose }) {
  const { t, language } = useLanguage();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const { length, width, height } = product.dimensions || {};
  const hasDimensions = length && width && height;

  return (
    <div
      onClick={onClose}
      className="ps-modal-bg fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ps-modal relative max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] border border-zinc-200 bg-white shadow-2xl sm:max-w-[720px] sm:rounded-[24px]"
      >
        <button
          onClick={onClose}
          aria-label={t("products.modalClose")}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-lg text-zinc-500 shadow-sm backdrop-blur transition-all hover:rotate-90 hover:border-zinc-300 hover:text-zinc-900"
        >
          ✕
        </button>

        {product.images?.[0]?.url && (
          <div className="relative h-[260px] w-full bg-zinc-100 sm:h-[320px]">
            <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <p className="m-0 mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[.08em] text-red-600">
            {product.category?.name || t("products.categoryFallback")}
          </p>
          <h2 className="m-0 mb-2 font-['Space_Grotesk'] text-[26px] font-bold text-zinc-900 sm:text-[30px]">
            {product.name}
          </h2>
          <p className="mb-5 font-['Space_Grotesk'] text-xl font-bold text-red-600">
            {product.price ? `${product.price.toLocaleString()} DA` : t("products.priceOnDemand")}
          </p>

          {product.description && (
            <p className="mb-6 text-[14.5px] leading-[1.7] text-zinc-600">{product.description}</p>
          )}

          {hasDimensions && (
            <div className="mb-6">
              <p className="m-0 mb-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[.08em] text-zinc-400">
                {t("products.dimensions")}
              </p>
              <p className="m-0 text-[14px] text-zinc-700">{length} × {width} × {height} mm</p>
            </div>
          )}

          {product.specs?.length > 0 && (
            <div className="mb-6">
              <p className="m-0 mb-3 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[.08em] text-zinc-400">
                {t("products.characteristics")}
              </p>
              <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                {product.specs.map((s, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-zinc-100 py-2.5 text-[13.5px]">
                    <span className="text-zinc-500">{getPresetLabel("spec", s.label, language)}</span>
                    <span className="font-['Space_Grotesk'] font-bold text-zinc-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.features?.length > 0 && (
            <div className="mb-7">
              <p className="m-0 mb-3 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[.08em] text-zinc-400">
                {t("products.features")}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.features.map((f, i) => (
                  <span key={i} className="rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-[7px] text-[12.5px] text-zinc-700">
                    {getPresetLabel("feature", f, language)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <a
            href={buildWhatsappLink(product, language)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-red-600 py-4 font-['Space_Grotesk'] text-[15.5px] font-bold text-white transition-colors duration-200 hover:bg-red-500"
          >
            {t("products.contact")}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- product card ------------------------------------------- */

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  return (
    <article
      onClick={() => navigate(`/product/${product._id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-red-200 hover:shadow-[0_28px_50px_-24px_rgba(220,38,38,0.35)]"
    >
      {/* image */}
      <div className="relative h-[230px] overflow-hidden bg-zinc-100">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-6xl text-zinc-300">🏍</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* featured / unavailable badges */}
        {product.showOnMainPage && product.available && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-red-600 shadow-sm backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
              <path d="m12 2 2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2Z" />
            </svg>
          </span>
        )}
        {!product.available && (
          <span className="absolute right-3 top-3 rounded-full bg-zinc-900/85 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.12em] text-white backdrop-blur">
            {t("products.unavailable")}
          </span>
        )}
      </div>

      {/* body */}
      <div className="p-5">
        <p className="m-0 mb-1.5 font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-[.08em] text-red-600">
          {product.category?.name || t("products.categoryFallback")}
        </p>
        <h3 className="m-0 mb-4 font-['Space_Grotesk'] text-[17px] font-bold leading-snug tracking-[-0.01em] text-zinc-900">
          {product.name}
        </h3>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
          <span className="font-['Space_Grotesk'] text-[16px] font-bold text-zinc-900">
            {product.price ? `${product.price.toLocaleString()} DA` : t("products.priceOnDemand")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-['JetBrains_Mono'] text-[12px] font-medium text-zinc-400 transition-colors group-hover:text-red-600">
            {t("products.details")}
            <span className={`transition-transform duration-300 ${isRTL ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}>
              {isRTL ? "←" : "→"}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

/* ---------- section ------------------------------------------------ */

export default function ProductsSection() {
  const { t, isRTL } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products`, {
          params: { available: true },
        });
        setProducts(res.data || []);
      } catch {
        toast.error(t("adminProducts.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const sorted = useMemo(
    () =>
      [...products].sort(
        (a, b) => (b.showOnMainPage === true) - (a.showOnMainPage === true)
      ),
    [products]
  );

  return (
    <section id="products" dir={isRTL ? "rtl" : "ltr"} className="relative bg-white px-5 py-16 sm:px-[26px] sm:py-24">
      <style>{sectionCss}</style>

      <div className="mx-auto max-w-[1280px]">
        {/* heading */}
        <div className="ps-fade mb-12 text-center">
          <p className="m-0 mb-3 inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[12px] uppercase tracking-[.16em] text-red-600">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {t("products.heading")}
          </p>
          <h2 className="m-0 font-['Space_Grotesk'] text-[clamp(28px,4.5vw,46px)] font-bold tracking-[-0.02em] text-zinc-900">
            {t("products.title")}
          </h2>
        </div>

        {/* states */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[22px] border border-zinc-200 bg-white">
                <div className="ps-skel h-[230px] w-full" />
                <div className="space-y-3 p-5">
                  <div className="ps-skel h-3 w-20 rounded-full" />
                  <div className="ps-skel h-4 w-3/4 rounded-full" />
                  <div className="ps-skel mt-4 h-4 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="ps-fade flex flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-20 text-center">
            <span className="mb-4 text-5xl grayscale">🏍</span>
            <p className="m-0 font-['Space_Grotesk'] text-lg font-bold text-zinc-700">{t("products.empty")}</p>
            <a
              href={`https://wa.me/${store.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-['Space_Grotesk'] text-sm font-bold text-white no-underline transition-colors hover:bg-red-500"
            >
              {t("products.contact")}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((product, i) => (
              <div key={product._id} className="ps-fade" style={{ animationDelay: `${Math.min(i * 60, 480)}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}