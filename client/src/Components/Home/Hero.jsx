import { useRef, useState } from "react";
import heroVideo from "../../assets/hero-video.mp4";
import logo from "../../assets/Logo.jpg";

export default function Hero() {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full h-screen min-h-[560px] overflow-hidden bg-black">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setVideoReady(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Fallback poster while video loads */}
      {!videoReady && (
        <div className="absolute inset-0 w-full h-full bg-black" />
      )}

      {/* Dark + red-tinted overlay so text stays readable over any footage */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-black/40" />

      {/* Content */}
      <div className="relative z-10 rounded-full h-full flex flex-col items-center justify-center text-center px-5">
        <img
          src={logo}
          alt="HM Dora Moto"
          className="w-[92px] sm:w-[110px] rounded-full mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] [animation:fadeUp_.7s_both]"
        />

       

        <h1 className="font-['Space_Grotesk'] font-bold text-[clamp(36px,8vw,80px)] leading-[1.02] tracking-[-0.03em] text-white m-0 mb-4 [animation:fadeUp_.8s_.15s_both]">
          <span className="text-red-500">HM</span> Dora Moto
        </h1>

        <p className="max-w-[520px] text-[15.5px] sm:text-lg leading-[1.6] text-white/75 mt-0 mb-9 [animation:fadeUp_.8s_.25s_both]">
          Scooters électriques fiables, puissants et disponibles à Sétif.
          Découvrez la gamme et commandez directement sur WhatsApp.
        </p>

        <div className="flex gap-3 flex-wrap justify-center [animation:fadeUp_.8s_.35s_both]">
          <button
            onClick={scrollToProducts}
            className="inline-flex items-center gap-2.5 px-7 py-4 border-none rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-['Space_Grotesk'] font-bold text-[16px] cursor-pointer shadow-[0_16px_40px_-12px_rgba(220,38,38,0.7)] transition-colors duration-200"
          >
            Voir les modèles <span className="text-lg">↓</span>
          </button>
          
          <a
            href="https://wa.me/213000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-[14px] bg-white/10 border border-white/25 text-white font-['Space_Grotesk'] font-bold text-[16px] cursor-pointer backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.18] hover:border-white/40"
          >
            WhatsApp
          </a>
        </div>
      </div>

      {/* scroll cue */}
      <button
        onClick={scrollToProducts}
        aria-label="Défiler vers les produits"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-colors [animation:floatySlow_2.4s_ease-in-out_infinite]"
      >
        ↓
      </button>
    </section>
  );
}