import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5 sm:px-8 lg:px-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="font-['Space_Grotesk'] font-light leading-none text-red-600/20 mb-6"
        style={{ fontSize: "clamp(96px,18vw,192px)", letterSpacing: "-.04em" }}
      >
        404
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="font-['Space_Grotesk'] font-bold text-[clamp(28px,5vw,52px)] tracking-[-0.02em] text-zinc-900 m-0 mb-4"
      >
        Page introuvable
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="max-w-[520px] text-[15.5px] sm:text-lg leading-[1.65] text-zinc-500 mt-0 mb-10"
      >
        La page que vous cherchez n'existe pas ou a été déplacée. Retournez à
        l'accueil pour découvrir nos scooters.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-['Space_Grotesk'] font-bold text-[15.5px] no-underline shadow-[0_20px_45px_-18px_rgba(220,38,38,0.55)] transition-colors duration-200"
        >
          Retour à l'accueil
        </Link>
      </motion.div>
    </div>
  );
}