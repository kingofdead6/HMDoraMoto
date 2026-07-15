import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { toast } from "react-toastify";
import { Plus, Search, Trash2, Edit, X, AlertTriangle, Check } from "lucide-react";

const MAX_IMAGES = 8;
const MAX_IMAGE_MB = 5;

const authHeaders = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

// Pulled from both brochure sheets (Nova + Mantis) so the admin never has
// to type a label from scratch — just tick the ones that apply to this
// model and fill in the value.
const SPEC_PRESETS = [
  "Puissance nominale",
  "Tension nominale",
  "Contrôleur",
  "Type de batterie",
  "Spécifications de la batterie",
  "Vitesse maximale",
  "Autonomie",
  "Type de moteur",
  "Angle de pente",
  "Temps de charge",
  "Freins avant / arrière",
  "Spécifications des pneus",
  "Spécifications du moyeu",
  "Charge maximale",
  "Empattement",
  "Réservoir de carrosserie",
  "Hauteur du siège",
  "Pneus avant",
  "Pneus arrière",
  "Jante avant",
  "Suspension avant",
  "Amortisseur arrière",
  "Phares",
  "Instruments",
];

// "Autres configurations" from the brochures
const FEATURE_PRESETS = [
  "Réparation en un clic",
  "Frein de stationnement en position P",
  "Trois vitesses",
  "Marche arrière",
  "Port USB",
  "Démarrage intelligent sans clé",
  "Régulateur de vitesse",
];

const emptyForm = {
  name: "",
  price: "",
  description: "",
  featured: false,
  available: true,
  showOnMainPage: false,
  specs: [],
  features: [],
  dimensions: { length: "", width: "", height: "" },
};

// Checks that mirror what actually keeps a product from looking right on
// the public site, so the admin gets a plain-language reason instead of
// silently wondering why something looks off.
function getVisibilityIssues(p) {
  const issues = [];
  if (!p.name?.trim()) issues.push("Le nom du produit est manquant.");
  if (!p.available) issues.push("Le produit est marqué « indisponible » — il n'apparaîtra pas sur le site.");
  if (!p.images || p.images.length === 0)
    issues.push("Aucune image n'a été ajoutée — la fiche affichera un cadre vide.");
  if (!p.specs || p.specs.length === 0)
    issues.push("Aucune caractéristique technique renseignée.");
  if (!p.description?.trim())
    issues.push("Aucune description — la fiche produit paraîtra incomplète.");
  return issues;
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block mb-4">
      <span className="block font-semibold text-[12px] tracking-[.02em] text-gray-500 uppercase mb-1.5">
        {label}
      </span>
      {children}
      {hint && !error && <p className="mt-1 text-[12px] text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-[12px] text-red-600 font-medium">{error}</p>}
    </label>
  );
}

function TextField({ label, hint, error, ...props }) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input
        {...props}
        className={`w-full px-3.5 py-[10px] rounded-[10px] bg-white border text-gray-900 text-sm placeholder:text-gray-350 outline-none transition-colors ${
          error ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-red-500"
        }`}
      />
    </Field>
  );
}

// Popup rendered straight onto document.body so it always sits above
// everything else (navbar included), no matter the surrounding stacking
// context. Also doubles as the "why isn't this visible" explainer.
function VisibilityIssuesPopup({ issues, onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-[18px] shadow-2xl p-6"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <h3 className="font-bold text-[16px] text-gray-900 m-0">
            Ce produit a des points à corriger
          </h3>
        </div>
        <ul className="flex flex-col gap-2.5 mb-5">
          {issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2 text-[13.5px] text-gray-600 leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-[6px] shrink-0" />
              {issue}
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-[10px] bg-gray-900 hover:bg-black text-white font-semibold text-sm transition-colors"
        >
          Compris
        </button>
      </div>
    </div>,
    document.body
  );
}

function ProductForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [existingImages, setExistingImages] = useState(initial?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const objectUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Live warnings shown right in the form as the admin fills it in — the
  // same checks used for the post-save popup, so there's no surprise.
  const liveIssues = getVisibilityIssues({
    ...form,
    images: [...existingImages, ...newFiles],
  });

  const addSpec = (label = "") => set("specs", [...form.specs, { label, value: "" }]);
  const updateSpec = (i, key, value) => {
    const next = [...form.specs];
    next[i] = { ...next[i], [key]: value };
    set("specs", next);
  };
  const removeSpec = (i) => set("specs", form.specs.filter((_, idx) => idx !== i));
  const activeSpecLabels = new Set(form.specs.map((s) => s.label));
  const togglePresetSpec = (label) => {
    if (activeSpecLabels.has(label)) {
      set("specs", form.specs.filter((s) => s.label !== label));
    } else {
      addSpec(label);
    }
  };

  const activeFeatureSet = new Set(form.features);
  const toggleFeature = (feature) => {
    if (activeFeatureSet.has(feature)) {
      set("features", form.features.filter((f) => f !== feature));
    } else {
      set("features", [...form.features, feature]);
    }
  };
  const addCustomFeature = () => set("features", [...form.features, ""]);
  const updateFeature = (i, value) => {
    const next = [...form.features];
    next[i] = value;
    set("features", next);
  };
  const removeFeature = (i) => set("features", form.features.filter((_, idx) => idx !== i));
  const customFeatures = form.features
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => !FEATURE_PRESETS.includes(f));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    const remainingSlots = MAX_IMAGES - existingImages.length - newFiles.length;
    if (files.length > remainingSlots) {
      toast.error(
        remainingSlots > 0
          ? `8 images maximum — il ne reste que ${remainingSlots} emplacement(s).`
          : "8 images maximum atteintes."
      );
      return;
    }

    const oversized = files.find((f) => f.size > MAX_IMAGE_MB * 1024 * 1024);
    if (oversized) {
      toast.error(`"${oversized.name}" dépasse ${MAX_IMAGE_MB} Mo.`);
      return;
    }

    const withPreviews = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl);
      return { file, previewUrl };
    });
    setNewFiles((prev) => [...prev, ...withPreviews]);
  };

  const removeExistingImage = (imgId) => {
    setExistingImages((prev) => prev.filter((img) => img._id !== imgId));
    setRemovedImageIds((prev) => [...prev, imgId]);
  };

  const removeNewFile = (idx) => {
    setNewFiles((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = "Le nom du produit est requis.";
    if (form.price !== "" && Number(form.price) < 0) errors.price = "Le prix ne peut pas être négatif.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit({ form, newFiles: newFiles.map((nf) => nf.file), removedImageIds });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-[680px] max-h-[92vh] overflow-y-auto bg-white rounded-t-[22px] sm:rounded-[22px] p-6 sm:p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        <h2 className="font-bold text-xl text-gray-900 m-0 mb-1">
          {initial ? "Modifier le produit" : "Nouveau produit"}
        </h2>
        <p className="text-[13px] text-gray-400 m-0 mb-6">
          Remplissez les champs ci-dessous — les caractéristiques courantes sont déjà listées.
        </p>

        {liveIssues.length > 0 && (
          <div className="flex items-start gap-2.5 mb-6 p-3.5 rounded-[12px] bg-amber-50 border border-amber-200">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12.5px] font-semibold text-amber-800 m-0 mb-1">
                À corriger avant publication idéale :
              </p>
              <ul className="m-0 pl-4 text-[12.5px] text-amber-700 space-y-0.5">
                {liveIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <TextField
          label="Nom du modèle"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ex : H360-Nova"
          error={fieldErrors.name}
        />

        <TextField
          label="Prix (DA)"
          hint="Laisser vide pour afficher « Sur demande »"
          type="number"
          value={form.price}
          onChange={(e) => set("price", e.target.value)}
          placeholder="Ex : 185000"
          error={fieldErrors.price}
        />

        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full px-3.5 py-[10px] rounded-[10px] bg-white border border-gray-200 text-gray-900 text-sm outline-none focus:border-red-500 resize-none transition-colors"
          />
        </Field>

        <span className="block font-semibold text-[12px] tracking-[.02em] text-gray-500 uppercase mb-1.5">
          Dimensions extérieures du véhicule (mm)
        </span>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <TextField
            label="Longueur"
            type="number"
            value={form.dimensions.length}
            onChange={(e) => set("dimensions", { ...form.dimensions, length: e.target.value })}
          />
          <TextField
            label="Largeur"
            type="number"
            value={form.dimensions.width}
            onChange={(e) => set("dimensions", { ...form.dimensions, width: e.target.value })}
          />
          <TextField
            label="Hauteur"
            type="number"
            value={form.dimensions.height}
            onChange={(e) => set("dimensions", { ...form.dimensions, height: e.target.value })}
          />
        </div>

        {/* toggles */}
        <div className="flex flex-wrap gap-4 mb-7 pb-6 border-b border-gray-100">
          {[
            ["available", "Disponible"],
            ["featured", "Mis en avant"],
            ["showOnMainPage", "Priorité page d'accueil"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-[13px] text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {/* spec presets — configuration de base */}
        <div className="mb-3">
          <span className="block font-semibold text-[12px] tracking-[.02em] text-gray-500 uppercase mb-2.5">
            Configuration de base — cochez ce qui s'applique
          </span>
          <div className="flex flex-wrap gap-2 mb-4">
            {SPEC_PRESETS.map((label) => {
              const active = activeSpecLabels.has(label);
              return (
                <button
                  type="button"
                  key={label}
                  onClick={() => togglePresetSpec(label)}
                  className={`inline-flex items-center gap-1.5 text-[12.5px] px-3 py-[7px] rounded-full border transition-colors ${
                    active
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-350"
                  }`}
                >
                  {active && <Check size={12} />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {form.specs.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {form.specs.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={s.label}
                  onChange={(e) => updateSpec(i, "label", e.target.value)}
                  placeholder="Nom de la caractéristique"
                  className="flex-[1.1] px-3 py-2 rounded-[9px] bg-gray-50 border border-gray-200 text-gray-900 text-[13px] outline-none focus:border-red-500 transition-colors"
                />
                <input
                  value={s.value}
                  onChange={(e) => updateSpec(i, "value", e.target.value)}
                  placeholder="Valeur — ex : 80 km"
                  className="flex-1 px-3 py-2 rounded-[9px] bg-white border border-gray-200 text-gray-900 text-[13px] outline-none focus:border-red-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  className="px-2 text-gray-350 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => addSpec()}
          className="text-[12.5px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 mb-7"
        >
          <Plus size={13} /> Ajouter une caractéristique personnalisée
        </button>

        {/* features presets — autres configurations */}
        <div className="mb-3">
          <span className="block font-semibold text-[12px] tracking-[.02em] text-gray-500 uppercase mb-2.5">
            Autres configurations
          </span>
          <div className="flex flex-wrap gap-2 mb-4">
            {FEATURE_PRESETS.map((feature) => {
              const active = activeFeatureSet.has(feature);
              return (
                <button
                  type="button"
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  className={`inline-flex items-center gap-1.5 text-[12.5px] px-3 py-[7px] rounded-full border transition-colors ${
                    active
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-350"
                  }`}
                >
                  {active && <Check size={12} />}
                  {feature}
                </button>
              );
            })}
          </div>
        </div>

        {customFeatures.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {customFeatures.map(({ f, i }) => (
              <div key={i} className="flex gap-2">
                <input
                  value={f}
                  onChange={(e) => updateFeature(i, e.target.value)}
                  placeholder="Équipement personnalisé"
                  className="flex-1 px-3 py-2 rounded-[9px] bg-gray-50 border border-gray-200 text-gray-900 text-[13px] outline-none focus:border-red-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="px-2 text-gray-350 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addCustomFeature}
          className="text-[12.5px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 mb-7"
        >
          <Plus size={13} /> Ajouter un équipement personnalisé
        </button>

        {/* images */}
        <div className="mb-7">
          <span className="block font-semibold text-[12px] tracking-[.02em] text-gray-500 uppercase mb-2.5">
            Images
          </span>
          <div className="flex flex-wrap gap-2.5 mb-3">
            {existingImages.map((img) => (
              <div key={img._id} className="relative w-20 h-20 rounded-[10px] overflow-hidden border border-gray-200">
                <img src={img.url} alt="Photo du produit" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img._id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            {newFiles.map((nf, i) => (
              <div key={nf.previewUrl} className="relative w-20 h-20 rounded-[10px] overflow-hidden border-2 border-red-500">
                <img src={nf.previewUrl} alt={nf.file.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-[10px] border-2 border-dashed border-gray-250 flex items-center justify-center cursor-pointer text-gray-350 hover:text-gray-600 hover:border-gray-400 transition-colors">
              <Plus size={18} />
              <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
            </label>
          </div>
          <p className="text-[11px] text-gray-400 m-0">8 images maximum, 5 Mo par image.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3 rounded-[12px] bg-white border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-[12px] bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            {saving ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [issuesPopup, setIssuesPopup] = useState(null); // array of issue strings or null

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/products`);
      setProducts(res.data || []);
    } catch {
      toast.error("Impossible de charger les produits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const buildFormData = ({ form }) => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    if (form.price !== "") fd.append("price", form.price);
    fd.append("description", form.description);
    fd.append("featured", form.featured);
    fd.append("available", form.available);
    fd.append("showOnMainPage", form.showOnMainPage);
    fd.append(
      "specs",
      JSON.stringify(form.specs.filter((s) => s.label.trim() && s.value.trim()))
    );
    fd.append("features", JSON.stringify(form.features.filter((f) => f.trim())));
    fd.append(
      "dimensions",
      JSON.stringify({
        length: form.dimensions.length || null,
        width: form.dimensions.width || null,
        height: form.dimensions.height || null,
      })
    );
    return fd;
  };

  const handleSubmit = async ({ form, newFiles, removedImageIds }) => {
    setSaving(true);
    try {
      const fd = buildFormData({ form });
      newFiles.forEach((file) => fd.append("images", file));

      const isEdit = Boolean(editing && editing._id);
      const url = isEdit
        ? `${API_BASE_URL}/products/${editing._id}`
        : `${API_BASE_URL}/products`;
      const method = isEdit ? "put" : "post";

      const { data: saved } = await axios[method](url, fd, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      if (isEdit && removedImageIds.length > 0) {
        const results = await Promise.allSettled(
          removedImageIds.map((imgId) =>
            axios.delete(`${API_BASE_URL}/products/${editing._id}/images/${imgId}`, {
              headers: authHeaders(),
            })
          )
        );
        const failedCount = results.filter((r) => r.status === "rejected").length;
        if (failedCount > 0) {
          toast.error(`${failedCount} image(s) n'ont pas pu être supprimée(s), réessayez.`);
        }
      }

      toast.success(isEdit ? "Produit mis à jour" : "Produit créé");
      setEditing(null);
      await fetchAll();

      // Surface a clear reason if the saved product still won't show
      // properly, instead of leaving the admin to guess.
      const issues = getVisibilityIssues(saved);
      if (issues.length > 0) setIssuesPopup(issues);
    } catch (err) {
      toast.error(err.response?.data?.message || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer "${product.name}" définitivement ?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${product._id}`, {
        headers: authHeaders(),
      });
      toast.success("Produit supprimé");
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch {
      toast.error("Suppression impossible");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen px-5 sm:px-[26px] py-10">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="font-bold text-2xl sm:text-3xl text-gray-900 m-0">Produits</h1>
          <button
            onClick={() => setEditing({})}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[12px] bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
          >
            <Plus size={16} /> Nouveau produit
          </button>
        </div>

        <div className="relative mb-6 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-350" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full pl-10 pr-3.5 py-[10px] rounded-[10px] bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-350 outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">Aucun produit trouvé.</p>
        ) : (
          <div className="rounded-[16px] border border-gray-200 overflow-hidden bg-white">
            {filtered.map((p, i) => {
              const issues = getVisibilityIssues(p);
              return (
                <div
                  key={p._id}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    i !== filtered.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-gray-100 shrink-0">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">
                        🏍
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 m-0 truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-400 m-0 mt-0.5">
                      {p.price != null ? `${p.price.toLocaleString()} DA` : "Sur demande"}
                    </p>
                  </div>

                  <div className="hidden sm:flex gap-1.5">
                    {p.showOnMainPage && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 font-semibold uppercase">
                        Accueil
                      </span>
                    )}
                    {!p.available && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500 font-semibold uppercase">
                        Indispo
                      </span>
                    )}
                  </div>

                  {issues.length > 0 && (
                    <button
                      onClick={() => setIssuesPopup(issues)}
                      title="Voir pourquoi ce produit a des points à corriger"
                      className="w-9 h-9 rounded-[9px] bg-amber-50 border border-amber-200 text-amber-500 hover:bg-amber-100 flex items-center justify-center transition-colors shrink-0"
                    >
                      <AlertTriangle size={14} />
                    </button>
                  )}

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditing(p)}
                      className="w-9 h-9 rounded-[9px] bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="w-9 h-9 rounded-[9px] bg-gray-50 border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing !== null && (
        <ProductForm
          initial={
            editing._id
              ? {
                  ...editing,
                  price: editing.price ?? "",
                  specs: editing.specs || [],
                  features: editing.features || [],
                  dimensions: {
                    length: editing.dimensions?.length ?? "",
                    width: editing.dimensions?.width ?? "",
                    height: editing.dimensions?.height ?? "",
                  },
                }
              : null
          }
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {issuesPopup && (
        <VisibilityIssuesPopup issues={issuesPopup} onClose={() => setIssuesPopup(null)} />
      )}
    </div>
  );
}