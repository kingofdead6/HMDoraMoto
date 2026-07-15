import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { store } from "../../store.config.js";
import { toast } from "react-toastify";

function buildWhatsappLink(product) {
  const text = `Bonjour, je suis intéressé par le modèle "${product.name}". Est-il disponible ?`;
  return `https://wa.me/${store.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  const safeImages = images?.length ? images : [{ url: null }];

  return (
    <div>
      <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-[20px] overflow-hidden bg-black/40 border border-white/[0.08]">
        {safeImages[active]?.url ? (
          <img
            src={safeImages[active].url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-white/15">
            🏍
          </div>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
          {safeImages.map((img, i) => (
            <button
              key={img._id ?? `img-${i}`}
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-[10px] overflow-hidden border transition-all duration-200 ${
                active === i
                  ? "border-red-600 ring-2 ring-red-600/40"
                  : "border-white/10 opacity-60 hover:opacity-100"
              }`}
            >
              {img.url ? (
                <img src={img.url} alt={`${name} - photo ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black/40" />
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

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);
      setProduct(null); // clear stale data so a slow request never flashes the previous product

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
      <div className="min-h-[60vh] flex items-center justify-center bg-[#050508]">
        <p className="text-white/40 font-['Space_Grotesk']">Chargement…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#050508] px-5 text-center">
        <p className="text-5xl">🏍</p>
        <h1 className="font-['Space_Grotesk'] font-bold text-2xl text-white m-0">
          Produit introuvable
        </h1>
        <p className="text-white/50 text-sm max-w-xs">
          Ce modèle n'existe plus ou a été retiré du catalogue.
        </p>
        <Link
          to="/"
          className="mt-2 px-6 py-3 rounded-[12px] bg-red-600 hover:bg-red-700 text-white font-['Space_Grotesk'] font-bold text-sm no-underline transition-colors duration-200"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const { length, width, height } = product.dimensions || {};
  const hasDimensions = length != null && width != null && height != null;

  return (
    <div className="bg-[#050508] min-h-screen px-5 sm:px-[26px] py-10 sm:py-14">
      <div className="max-w-[1100px] mx-auto">
        {/* breadcrumb */}
        <div className="flex items-center gap-2 mb-8 font-['JetBrains_Mono'] text-[12px] text-white/35">
          <Link to="/" className="text-white/35 no-underline hover:text-white/70 transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <span className="text-white/60">{product.category?.name || "Scooter"}</span>
          <span>/</span>
          <span className="text-white/80">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <Gallery key={product._id ?? id} images={product.images} name={product.name} />

          <div>
            {!product.available && (
              <div className="inline-block mb-4 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-[11px] font-['JetBrains_Mono'] text-white/60 uppercase">
                Indisponible
              </div>
            )}

            <p className="font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-red-500 uppercase m-0 mb-2">
              {product.category?.name || "Scooter"}
            </p>
            <h1 className="font-['Space_Grotesk'] font-bold text-[32px] sm:text-[40px] leading-[1.08] text-white m-0 mb-3">
              {product.name}
            </h1>
            <p className="font-['Space_Grotesk'] font-bold text-2xl text-white mb-6">
              {product.price != null ? `${product.price.toLocaleString()} DA` : "Prix sur demande"}
            </p>

            {product.description && (
              <p className="text-[15px] leading-[1.7] text-white/65 mb-7">
                {product.description}
              </p>
            )}

            <a
              href={buildWhatsappLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-['Space_Grotesk'] font-bold text-[15.5px] no-underline transition-colors duration-200 shadow-[0_16px_40px_-12px_rgba(220,38,38,0.6)] mb-8"
            >
              Commander via WhatsApp
            </a>

            {hasDimensions && (
              <div className="mb-7 pb-7 border-b border-white/[0.07]">
                <p className="font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-white/40 uppercase m-0 mb-2">
                  Dimensions
                </p>
                <p className="text-[14px] text-white/80 m-0">
                  {length} × {width} × {height} mm (L × l × H)
                </p>
              </div>
            )}

            {product.specs?.length > 0 && (
              <div className="mb-7 pb-7 border-b border-white/[0.07]">
                <p className="font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-white/40 uppercase m-0 mb-3">
                  Caractéristiques
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                  {product.specs.map((s, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2.5 border-b border-white/[0.05] text-[13.5px]"
                    >
                      <span className="text-white/50">{s.label}</span>
                      <span className="text-white/90 font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.features?.length > 0 && (
              <div>
                <p className="font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-white/40 uppercase m-0 mb-3">
                  Équipements
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((f, i) => (
                    <span
                      key={i}
                      className="text-[12.5px] px-3 py-[7px] rounded-full bg-white/[0.06] border border-white/10 text-white/75"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}