import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { store } from "../../store.config.js";
import logo from "../../assets/Logo.jpg";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userType, setUserType] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const checkAuth = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      try { setUserType(jwtDecode(token).usertype); }
      catch { setUserType(null); }
    } else setUserType(null);
  };

  useEffect(() => {
    checkAuth();
    const h = () => checkAuth();
    window.addEventListener("storage", h);
    window.addEventListener("authChanged", h);
    return () => {
      window.removeEventListener("storage", h);
      window.removeEventListener("authChanged", h);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUserType(null);
    window.dispatchEvent(new Event("authChanged"));
    navigate("/login");
  };

  const isAdmin = userType === "admin" || userType === "superadmin";

  const navItems = isAdmin
    ? [
        { label: "Dashboard", to: "/admin/dashboard" },
        { label: "Produits", to: "/admin/products" },
      ]
    : [
        { label: "Accueil", to: "/" },
        { label: "Contact", to: "/contact" },
      ];

  return (
    <>
      <header
        className={`sticky top-0 z-[90] backdrop-blur-[22px] saturate-150 border-b border-white/[0.08] transition-all duration-300 ${
          scrolled ? "bg-black/90" : "bg-black/50"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-[26px] py-3 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-[10px] no-underline shrink-0">
            <img src={logo} alt={store.brand.name} className="h-9 w-9 object-contain" />
            <span className="font-['Space_Grotesk'] font-bold text-lg sm:text-xl tracking-[-0.02em] text-white">
              {store.brand.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((n) => {
              const active =
                n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`font-['Manrope'] font-semibold text-[14.5px] px-4 py-[9px] rounded-[11px] border transition-all duration-[250ms] no-underline ${
                    active
                      ? "text-white bg-red-600/20 border-red-600/50"
                      : "text-white/65 bg-transparent border-transparent hover:text-white hover:bg-white/[0.07] hover:border-white/20"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            {!isAdmin && (
              <a
                href={`https://wa.me/${store.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 font-['Manrope'] font-semibold text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-[9px] rounded-[12px] transition-colors duration-200 no-underline"
              >
                WhatsApp
              </a>
            )}

            {isAdmin && (
              <button
                onClick={handleLogout}
                className="font-['Manrope'] font-semibold text-sm text-white/70 bg-transparent border border-white/[0.12] px-4 py-[9px] rounded-[11px] cursor-pointer hover:text-white hover:border-white/30 transition-all duration-[250ms]"
              >
                Déconnexion
              </button>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden flex flex-col gap-1 items-center justify-center w-[42px] h-[42px] rounded-[12px] bg-white/[0.05] border border-white/[0.08] cursor-pointer text-white"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-[18px] h-0.5 bg-current rounded-sm block" />
              ))}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <nav className="md:hidden bg-black/80 backdrop-blur-lg border-b border-white/[0.08] py-4">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-[26px] flex flex-col gap-2">
            {navItems.map((n) => {
              const active =
                n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`font-['Manrope'] font-semibold text-[14.5px] px-4 py-2 rounded-[11px] block no-underline transition-all duration-[250ms] ${
                    active
                      ? "text-white bg-red-600/20"
                      : "text-white/65 hover:text-white hover:bg-white/[0.07]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            {!isAdmin && (
              <a
                href={`https://wa.me/${store.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-['Manrope'] font-semibold text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-[12px] transition-colors duration-200 no-underline text-center"
              >
                WhatsApp
              </a>
            )}
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="font-['Manrope'] font-semibold text-sm text-white/70 bg-transparent border border-white/[0.12] px-4 py-2 rounded-[11px] cursor-pointer hover:text-white hover:border-white/30 transition-all duration-[250ms] text-left"
              >
                Déconnexion
              </button>
            )}
          </div>
        </nav>
      )}
    </>
  );
}