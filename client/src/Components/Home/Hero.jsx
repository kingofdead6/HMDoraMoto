import logo from "../../assets/Logo.jpg";
import { store } from "../../store.config.js";

export default function Hero() {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full min-h-screen  bg-white">
      {/* Simple decorative background — soft color blobs + dot grid, no image/video */}
      <div className="absolute inset-0 z-1000 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.5] [background-image:radial-gradient(#00000014_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
        />
        <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-red-500/10 blur-[110px]" />
        <div className="absolute top-1/4 -right-32 w-[480px] h-[480px] rounded-full bg-orange-400/10 blur-[120px]" />
        <div className="absolute bottom-[-120px] left-1/3 w-[380px] h-[380px] rounded-full bg-red-100 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 min-h-screen py-24">
        <div className="inline-flex items-center   rounded-full bg-red-50 border border-red-100 mb-7 [animation:fadeUp_.6s_both]">
          <img src={logo} alt="HM Dora Moto" className="w-36 h-36 rounded-full object-cover" />
         
        </div>

        <h1 className="font-['Space_Grotesk'] font-bold text-[clamp(38px,8vw,84px)] leading-[1.03] tracking-[-0.03em] text-zinc-900 m-0 mb-5 [animation:fadeUp_.7s_.1s_both]">
          <span className="text-red-600">HM</span> Dora Moto
        </h1>

        <p className="max-w-[540px] text-[15.5px] sm:text-lg leading-[1.65] text-zinc-500 mt-0 mb-10 [animation:fadeUp_.7s_.2s_both]">
          Scooters électriques fiables, 
          Découvrez la gamme et commandez directement sur WhatsApp.
        </p>

        <div className="flex gap-3 flex-wrap justify-center mb-10 [animation:fadeUp_.7s_.3s_both]">
          <button
            onClick={scrollToProducts}
            className="inline-flex items-center gap-2.5 px-7 py-4 border-none rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-['Space_Grotesk'] font-bold text-[16px] cursor-pointer shadow-[0_20px_45px_-18px_rgba(220,38,38,0.55)] transition-colors duration-200"
          >
            Voir les modèles <span className="text-lg">↓</span>
          </button>

          
           <a href={`https://wa.me/${store.contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-[14px] bg-white border border-zinc-200 text-zinc-800 font-['Space_Grotesk'] font-bold text-[16px] cursor-pointer transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50"
          >
            WhatsApp
          </a>
        </div>

        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap justify-center [animation:fadeUp_.7s_.4s_both]">
          {["Garantie officielle", "Paiement à la livraison"].map((t, i) => (
            <span
              key={t}
              className="flex items-center gap-2 text-[12.5px] font-['JetBrains_Mono'] text-zinc-400"
            >
              {i !== 0 && <span className="w-1 h-1 rounded-full bg-zinc-300" />}
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* scroll cue */}
      <button
        onClick={scrollToProducts}
        aria-label="Défiler vers les produits"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:border-zinc-300 transition-colors [animation:floatySlow_2.4s_ease-in-out_infinite]"
      >
        ↓
      </button>
    </section>
  );
}