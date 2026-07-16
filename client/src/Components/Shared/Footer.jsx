import { FaFacebookF, FaTiktok, FaPhone, FaWhatsapp, FaMapMarkerAlt } from "react-icons/fa";
import { store } from "../../store.config.js";
import logo from "../../assets/Logo.jpg";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-100 px-5 sm:px-[26px] pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-14">
          <div>
            <div className="flex items-center gap-[10px] mb-4">
              <img src={logo} alt={store.brand.name} className="h-9 w-9 object-contain rounded-full" />
              <span className="font-['Space_Grotesk'] font-bold text-lg text-zinc-900">
                {store.brand.name}
              </span>
            </div>
            <p className="text-sm leading-[1.65] text-zinc-500 m-0">
              {store.brand.tagline}
            </p>
          </div>

          <div>
            <h3 className="font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-zinc-400 uppercase m-0 mb-4">
              Contact
            </h3>
            <div className="flex flex-col gap-3 text-sm text-zinc-500">
              <a
                href={`tel:${store.contact.phoneHref}`}
                className="inline-flex items-center gap-2 text-zinc-500 no-underline transition-colors duration-200 hover:text-zinc-900"
              >
                <FaPhone className="text-sm" />
                {store.contact.phone}
              </a>
              <a
                href={`https://wa.me/${store.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-500 no-underline transition-colors duration-200 hover:text-zinc-900"
              >
                <FaWhatsapp className="text-sm" />
                WhatsApp
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=36.772934,3.058845"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-500 no-underline transition-colors duration-200 hover:text-zinc-900"
              >
                <FaMapMarkerAlt className="text-sm text-zinc-400" />
                {store.contact.address}
              </a>
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-[18px] p-6">
            <p className="font-['Space_Grotesk'] font-bold text-base text-zinc-900 m-0 mb-2">
              Follow Us
            </p>
            <p className="text-[13px] text-zinc-500 m-0 mb-4 leading-[1.5]">
              Suivez-nous sur Facebook et TikTok pour voir nos derniers modèles.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={store.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-100 transition-colors duration-200"
                aria-label="Facebook"
              >
                <FaFacebookF className="text-base" />
              </a>
              <a
                href={store.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-100 transition-colors duration-200"
                aria-label="TikTok"
              >
                <FaTiktok className="text-base" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100 flex justify-between items-center flex-wrap gap-3">
          <p className="font-['JetBrains_Mono'] text-xs text-zinc-400 m-0">
            © {new Date().getFullYear()} {store.brand.fullName}. Tous droits réservés.
          </p>
          <p className="font-['JetBrains_Mono'] text-xs text-zinc-400 m-0"> Algérie</p>
        </div>
      </div>
    </footer>
  );
}