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
        { label: "Produits", to: "/admin/products" },
      ]
    : [
        { label: "Accueil", to: "/" },
        { label: "Products", to: "/#products" },
      ];

  const isActive = (item) => {
    if (item.to === "/") {
      return location.pathname === "/" && !location.hash;
    }
    if (item.to.startsWith("/#")) {
      return location.pathname === "/" && location.hash === `#${item.to.split("#")[1]}`;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-[90] bg-white/90 backdrop-blur-[18px] border-b transition-all duration-300 ${
          scrolled ? "border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "border-zinc-100"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-[26px] py-3 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-[10px] no-underline shrink-0">
            <img src={logo} alt={store.brand.name} className="h-9 w-9 object-contain rounded-full" />
            <span className="font-['Space_Grotesk'] font-bold text-lg sm:text-xl tracking-[-0.02em] text-zinc-900">
              {store.brand.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((n) => {
              const active = isActive(n);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`font-['Manrope'] font-semibold text-[14.5px] px-4 py-[9px] rounded-[11px] border transition-all duration-[250ms] no-underline ${
                    active
                      ? "text-red-600 bg-red-50 border-red-100"
                      : "text-zinc-500 bg-transparent border-transparent hover:text-zinc-900 hover:bg-zinc-100"
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
                className="font-['Manrope'] font-semibold text-sm text-zinc-500 bg-transparent border border-zinc-200 px-4 py-[9px] rounded-[11px] cursor-pointer hover:text-zinc-900 hover:border-zinc-300 transition-all duration-[250ms]"
              >
                Déconnexion
              </button>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden flex flex-col gap-1 items-center justify-center w-[42px] h-[42px] rounded-[12px] bg-zinc-100 border border-zinc-200 cursor-pointer text-zinc-700"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-[18px] h-0.5 bg-current rounded-sm block" />
              ))}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <nav className="md:hidden bg-white border-b border-zinc-200 py-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-[26px] flex flex-col gap-2">
            {navItems.map((n) => {
              const active = isActive(n);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`font-['Manrope'] font-semibold text-[14.5px] px-4 py-2 rounded-[11px] block no-underline transition-all duration-[250ms] ${
                    active
                      ? "text-red-600 bg-red-50"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
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
                className="font-['Manrope'] font-semibold text-sm text-zinc-500 bg-transparent border border-zinc-200 px-4 py-2 rounded-[11px] cursor-pointer hover:text-zinc-900 hover:border-zinc-300 transition-all duration-[250ms] text-left"
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