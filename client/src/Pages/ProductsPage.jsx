import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
const WHATSAPP_NUMBER = "213542021271"; // replace with his real number

function buildWhatsappLink(product) {
  const text = `Bonjour, je suis intéressé par le modèle "${product.name}". Est-il disponible ?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function ProductModal({ product, onClose }) {
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5 [animation:fadeIn_.2s]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-[720px] max-h-[92vh] overflow-y-auto bg-[#0c0c0f] border border-white/10 rounded-t-[22px] sm:rounded-[22px] [animation:scaleIn_.25s_both]"
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 border border-white/15 text-white/80 hover:text-white hover:bg-black/70 flex items-center justify-center text-lg"
        >
          ✕
        </button>

        {product.images?.[0]?.url && (
          <div className="w-full h-[260px] sm:h-[320px] bg-black">
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-red-500 uppercase m-0 mb-2">
            {product.category?.name || "Scooter"}
          </p>
          <h2 className="font-['Space_Grotesk'] font-bold text-[26px] sm:text-[30px] text-white m-0 mb-2">
            {product.name}
          </h2>

          <p className="font-['Space_Grotesk'] font-bold text-xl text-white mb-5">
            {product.price ? `${product.price.toLocaleString()} DA` : "Prix sur demande"}
          </p>

          {product.description && (
            <p className="text-[14.5px] leading-[1.65] text-white/65 mb-6">
              {product.description}
            </p>
          )}

          {hasDimensions && (
            <div className="mb-6">
              <p className="font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-white/40 uppercase m-0 mb-2">
                Dimensions
              </p>
              <p className="text-[14px] text-white/80 m-0">
                {length} × {width} × {height} mm
              </p>
            </div>
          )}

          {product.specs?.length > 0 && (
            <div className="mb-6">
              <p className="font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-white/40 uppercase m-0 mb-3">
                Caractéristiques
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {product.specs.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-white/[0.06] text-[13.5px]"
                  >
                    <span className="text-white/50">{s.label}</span>
                    <span className="text-white/90 font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.features?.length > 0 && (
            <div className="mb-7">
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

          
           <a href={buildWhatsappLink(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-['Space_Grotesk'] font-bold text-[15.5px] transition-colors duration-200"
          >
            Commander via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/${product._id}`)}
      className="group cursor-pointer bg-[#0d0d10] border border-white/8 rounded-[18px] overflow-hidden hover:border-red-500/50 hover:-translate-y-1 transition-all duration-300"
    >
      {product.images?.[0]?.url ? (
        <div className="h-[220px] overflow-hidden">
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-[220px] flex items-center justify-center bg-[#16161a] text-6xl">
          🏍
        </div>
      )}

      {!product.available && (
        <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
          Indisponible
        </div>
      )}

      <div className="p-4">
        <p className="font-['JetBrains_Mono'] text-[10.5px] tracking-[.06em] text-red-500 uppercase m-0 mb-1">
          {product.category?.name || "Scooter"}
        </p>

        <h3 className="font-['Space_Grotesk'] font-bold text-[16.5px] text-white m-0 mb-2 leading-snug">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <span className="font-['Space_Grotesk'] font-bold text-[15px] text-white">
            {product.price
              ? `${product.price.toLocaleString()} DA`
              : "Sur demande"}
          </span>

          <span className="text-[12.5px] font-semibold text-white/50 group-hover:text-white transition-colors">
            Détails →
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ProductsSection() {
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
        toast.error("Impossible de charger les produits");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // homepage-flagged items first, then the rest
  const sorted = useMemo(
    () =>
      [...products].sort(
        (a, b) => (b.showOnMainPage === true) - (a.showOnMainPage === true)
      ),
    [products]
  );

  return (
    <section id="products" className="relative bg-[#050508] px-5 sm:px-[26px] py-16 sm:py-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <p className="font-['JetBrains_Mono'] text-[12px] tracking-[.12em] text-red-500 uppercase m-0 mb-3">
            Notre gamme
          </p>
          <h2 className="font-['Space_Grotesk'] font-bold text-[clamp(28px,4.5vw,44px)] text-white m-0">
            Nos scooters
          </h2>
        </div>

        {loading ? (
          <p className="text-center text-white/50 font-['Space_Grotesk']">Chargement…</p>
        ) : sorted.length === 0 ? (
          <p className="text-center text-white/50 font-['Space_Grotesk']">
            Aucun produit disponible pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}