import { Link } from "react-router-dom";
import { store } from "../../store.config.js";
import logo from "../../assets/Logo.jpg";

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm text-white/50 no-underline transition-colors duration-200 hover:text-white"
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/[0.08] px-5 sm:px-[26px] pt-16 pb-8 ">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div>
            <div className="flex items-center gap-[10px] mb-4">
              <img src={logo} alt={store.brand.name} className="h-9 w-9 object-contain" />
              <span className="font-['Space_Grotesk'] font-bold text-lg text-white">
                {store.brand.name}
              </span>
            </div>
            <p className="text-sm leading-[1.65] text-white/45 m-0">
              {store.brand.tagline}
            </p>
          </div>

          <div>
            <h3 className="font-['Space_Grotesk'] font-bold text-[13px] tracking-[.08em] text-white uppercase m-0 mb-4">
              Navigation
            </h3>
            <div className="flex flex-col gap-2.5">
              <FooterLink to="/">Accueil</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </div>
          </div>

          <div>
            <h3 className="font-['Space_Grotesk'] font-bold text-[13px] tracking-[.08em] text-white uppercase m-0 mb-4">
              Contact
            </h3>
            <div className="flex flex-col gap-2.5 text-sm text-white/50">
              <a
                href={`tel:${store.contact.phoneHref}`}
                className="text-white/50 no-underline transition-colors duration-200 hover:text-white"
              >
                {store.contact.phone}
              </a>
              <a
                href={`https://wa.me/${store.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 no-underline transition-colors duration-200 hover:text-white"
              >
                WhatsApp
              </a>
              <span>{store.contact.address}</span>
            </div>
          </div>

          <div className="bg-red-600/10 border border-red-600/25 rounded-[18px] p-6">
            <p className="font-['Space_Grotesk'] font-bold text-base text-white m-0 mb-2">
              Une question sur un modèle ?
            </p>
            <p className="text-[13px] text-white/50 m-0 mb-4 leading-[1.5]">
              Contactez-nous sur WhatsApp, on vous répond rapidement.
            </p>
            <a
              href={`https://wa.me/${store.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-[10px] rounded-[11px] bg-red-600 hover:bg-red-700 text-white font-['Space_Grotesk'] font-bold text-sm no-underline transition-colors duration-200"
            >
              Écrire sur WhatsApp →
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.07] flex justify-between items-center flex-wrap gap-3">
          <p className="font-['JetBrains_Mono'] text-xs text-white/25 m-0">
            © {new Date().getFullYear()} {store.brand.fullName}. Tous droits réservés.
          </p>
          <p className="font-['JetBrains_Mono'] text-xs text-white/25 m-0">Sétif, Algérie</p>
        </div>
      </div>
    </footer>
  );
}