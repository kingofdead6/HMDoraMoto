import { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../api";
import logo from "../assets/Logo.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Veuillez entrer votre email.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Format d'email invalide.";
    if (!password) e.password = "Veuillez entrer votre mot de passe.";
    else if (password.length < 6) e.password = "Le mot de passe doit contenir au moins 6 caractères.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        const { token, usertype } = response.data;

        if (remember) {
          localStorage.setItem("token", token);
        } else {
          sessionStorage.setItem("token", token);
        }

        window.dispatchEvent(new Event("authChanged"));
        setErrors({});
        toast.success("Connexion réussie !");

        if (usertype === "admin" || usertype === "superadmin") {
          navigate("/admin/products");
        } else {
          navigate("/");
        }
      } catch (error) {
        const message = error.response?.data?.message || "Échec de la connexion.";
        setErrors({ form: message });
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] px-4 ">
      {/* ambient red glow, consistent with hero */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <img
            src={logo}
            alt="HM Dora Moto"
            className="w-14 h-14 mx-auto mb-5 rounded-full object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          />
          <h1 className="font-['Space_Grotesk'] font-bold text-[clamp(30px,6vw,40px)] tracking-[-0.02em] text-white m-0">
            Espace Admin
          </h1>
          <p className="mt-3 text-[15px] text-white/50 font-['Manrope']">
            Connectez-vous pour gérer HM Dora Moto
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-[22px] p-7 sm:p-9 backdrop-blur-[16px]"
        >
          {errors.form && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 py-3.5 px-5 rounded-[12px] bg-red-600/10 border border-red-600/30 text-red-400 text-center text-sm font-['Manrope']"
            >
              {errors.form}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Email */}
            <div>
              <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-white/40 uppercase mb-2.5">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/30 pointer-events-none">
                  <FaUser size={14} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={`w-full pl-11 pr-4 py-[13px] rounded-[12px] bg-white/[0.04] border text-white text-[15px] outline-none font-['Manrope'] transition-colors duration-200 focus:border-red-600/60 placeholder:text-white/25 ${
                    errors.email ? "border-red-600/50" : "border-white/[0.1]"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-[13px] text-red-400 font-['Manrope']">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block font-['JetBrains_Mono'] text-[11px] tracking-[.08em] text-white/40 uppercase mb-2.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/30 pointer-events-none">
                  <FaLock size={14} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-[13px] rounded-[12px] bg-white/[0.04] border text-white text-[15px] outline-none font-['Manrope'] transition-colors duration-200 focus:border-red-600/60 placeholder:text-white/25 ${
                    errors.password ? "border-red-600/50" : "border-white/[0.1]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/60 bg-transparent border-none cursor-pointer transition-colors duration-200"
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-[13px] text-red-400 font-['Manrope']">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full py-4 rounded-[14px] text-white font-['Space_Grotesk'] font-bold text-[16px] border-none transition-colors duration-200 ${
                loading
                  ? "bg-white/10 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 cursor-pointer shadow-[0_16px_40px_-12px_rgba(220,38,38,0.7)]"
              }`}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}