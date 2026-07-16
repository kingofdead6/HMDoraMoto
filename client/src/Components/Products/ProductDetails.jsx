import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { store } from "../../store.config.js";
import { toast } from "react-toastify";

// rotating accent palette for spec/feature chips — keeps things
// playful without every tag looking identical
const ACCENTS = [
  { bg: "bg-red-50", text: "text-red-600", ring: "ring-red-100", dot: "bg-red-500" },
  { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", dot: "bg-amber-500" },
  { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", dot: "bg-emerald-500" },
  { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100", dot: "bg-blue-500" },
  { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-100", dot: "bg-purple-500" },
];

function buildWhatsappLink(product) {
  const productUrl = `${window.location.origin}/${product._id}`;

  const text = `Bonjour,

Je suis intéressé par ce modèle.

📌 Modèle : ${product.name}

🔗 ${productUrl}

Est-il disponible ?`;

  return `https://wa.me/${store.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

function Gallery({ images, name, active, setActive }) {
  const safeImages = images?.length ? images : [{ url: null }];
  const activeImage = safeImages[active]?.url;

  return (
    <div>
      <div className="relative w-full aspect-square rounded-[28px] overflow-hidden bg-zinc-50 ring-1 ring-zinc-100">
        {activeImage ? (
          <img key={activeImage} src={activeImage} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl text-zinc-300">🏍</div>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
          {safeImages.map((img, i) => (
            <button
              key={img._id ?? `img-${i}`}
              onClick={() => setActive(i)}
              className={`shrink-0 w-[72px] h-[72px] rounded-2xl overflow-hidden transition-all duration-200 ${
                active === i
                  ? "ring-2 ring-red-500 ring-offset-2"
                  : "ring-1 ring-zinc-200 opacity-60 hover:opacity-100"
              }`}
            >
              {img.url ? (
                <img src={img.url} alt={`${name} - photo ${i + 1}`} className="w-full h-full object-cover" />
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

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);
      setProduct(null);
      setActive(0);

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <p className="text-zinc-400 font-['Space_Grotesk']">Chargement…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-white px-5 text-center">
        <p className="text-5xl">🏍</p>
        <h1 className="font-['Space_Grotesk'] font-bold text-2xl text-zinc-900 m-0">
          Produit introuvable
        </h1>
        <p className="text-zinc-500 text-sm max-w-xs">
          Ce modèle n'existe plus ou a été retiré du catalogue.
        </p>
        <Link
          to="/"
          className="mt-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-['Space_Grotesk'] font-bold text-sm no-underline transition-colors duration-200"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const { length, width, height } = product.dimensions || {};
  const hasDimensions = length != null && width != null && height != null;

  return (
    <div className="bg-white min-h-screen px-5 sm:px-[26px] py-8 sm:py-12">
      <div className="max-w-[1160px] mx-auto">
        {/* breadcrumb */}
        <div className="flex items-center gap-2 mb-8 font-['JetBrains_Mono'] text-[12px] text-zinc-400">
          <Link to="/" className="text-zinc-400 no-underline hover:text-zinc-700 transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <span className="text-zinc-500">{product.category?.name || "Scooter"}</span>
          <span>/</span>
          <span className="text-zinc-700">{product.name}</span>
        </div>

        {/* ---------- gallery + buy box, side by side ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
          <Gallery
            key={product._id ?? id}
            images={product.images}
            name={product.name}
            active={active}
            setActive={setActive}
          />

          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-red-50 text-red-600 font-['JetBrains_Mono'] text-[11px] tracking-[.06em] font-medium uppercase">
                {product.category?.name || "Scooter"}
              </span>
              {!product.available && (
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-500 font-['JetBrains_Mono'] text-[11px] tracking-[.06em] font-medium uppercase">
                  Indisponible
                </span>
              )}
            </div>

            <h1 className="font-['Space_Grotesk'] font-bold text-[34px] sm:text-[42px] leading-[1.06] tracking-[-0.02em] text-zinc-900 m-0 mb-3">
              {product.name}
            </h1>

            <p className="font-['Space_Grotesk'] font-bold text-[26px] text-red-600 m-0 mb-6">
              {product.price != null ? `${product.price.toLocaleString()} DA` : "Prix sur demande"}
            </p>

            {product.description && (
              <p className="text-[15px] leading-[1.7] text-zinc-500 mb-7">
                {product.description}
              </p>
            )}

            
             <a href={buildWhatsappLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] text-white font-['Space_Grotesk'] font-bold text-[15.5px] no-underline transition-all duration-200 shadow-[0_16px_36px_-14px_rgba(220,38,38,0.6)] mb-8"
            >
              Commander via WhatsApp
            </a>

            {/* quick spec chips — colorful, scannable */}
            {(product.specs?.length > 0 || hasDimensions) && (
              <div className="flex flex-wrap gap-2">
                {product.specs?.slice(0, 6).map((s, i) => {
                  const a = ACCENTS[i % ACCENTS.length];
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full ${a.bg} ${a.text} ring-1 ${a.ring} text-[12.5px] font-medium`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                      {s.label}: <span className="font-bold">{s.value}</span>
                    </span>
                  );
                })}
                {hasDimensions && (
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100 text-[12.5px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    {length} × {width} × {height} mm
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ---------- full specs table ---------- */}
        {product.specs?.length > 0 && (
          <div className="mb-14">
            <h2 className="font-['Space_Grotesk'] font-bold text-[22px] text-zinc-900 m-0 mb-5">
              Caractéristiques
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.specs.map((s, i) => {
                const a = ACCENTS[i % ACCENTS.length];
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center px-5 py-4 rounded-2xl bg-zinc-50/70 border border-zinc-100"
                  >
                    <span className="flex items-center gap-2.5 text-zinc-500 text-[13.5px]">
                      <span className={`w-2 h-2 rounded-full ${a.dot}`} />
                      {s.label}
                    </span>
                    <span className="text-zinc-900 font-['Space_Grotesk'] font-bold text-[14px]">
                      {s.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- features ---------- */}
        {product.features?.length > 0 && (
          <div className="mb-16">
            <h2 className="font-['Space_Grotesk'] font-bold text-[22px] text-zinc-900 m-0 mb-5">
              Équipements
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {product.features.map((f, i) => {
                const a = ACCENTS[i % ACCENTS.length];
                return (
                  <span
                    key={i}
                    className={`text-[13px] px-4 py-2.5 rounded-full ${a.bg} ${a.text} ring-1 ${a.ring} font-['Space_Grotesk'] font-medium`}
                  >
                    {f}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- closing CTA ---------- */}
        <div className="relative overflow-hidden rounded-[28px] bg-zinc-50 px-8 sm:px-14 py-14 sm:py-16 text-center">
          <div className="absolute -top-20 -left-16 w-64 h-64 rounded-full bg-red-200/40 blur-[70px]" />
          <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-amber-200/40 blur-[80px]" />
          <div className="relative">
            <h2 className="font-['Space_Grotesk'] font-bold text-[clamp(24px,4vw,36px)] leading-[1.15] text-zinc-900 max-w-[520px] mx-auto m-0 mb-7">
              Prêt à rouler avec le {product.name} ?
            </h2>
            
              <a href={buildWhatsappLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] text-white font-['Space_Grotesk'] font-bold text-[15.5px] no-underline transition-all duration-200 shadow-[0_16px_36px_-14px_rgba(220,38,38,0.6)]"
            >
              Commander via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}