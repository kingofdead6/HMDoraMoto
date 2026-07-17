import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../api.js";
import { toast } from "react-toastify";
import { Plus, Search, Trash2, Edit, X, AlertTriangle, Check } from "lucide-react";
import {
  useLanguage,
  SPEC_PRESET_OPTIONS,
  FEATURE_PRESET_OPTIONS,
  getPresetLabel,
  normalizePresetValue,
} from "../../i18n.jsx";

const MAX_IMAGES = 16;
const MAX_IMAGE_MB = 5;

const authHeaders = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};


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
function getVisibilityIssues(p, t) {
  const issues = [];
  if (!p.name?.trim()) issues.push(t("adminProducts.visibilityName"));
  if (!p.available) issues.push(t("adminProducts.visibilityAvailability"));
  if (!p.images || p.images.length === 0)
    issues.push(t("adminProducts.visibilityImages"));
  if (!p.specs || p.specs.length === 0)
    issues.push(t("adminProducts.visibilitySpecs"));
  if (!p.description?.trim())
    issues.push(t("adminProducts.visibilityDescription"));
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
  const { t } = useLanguage();
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
            {t("adminProducts.visibilityTitle")}
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
          {t("adminProducts.visibilityConfirm")}
        </button>
      </div>
    </div>,
    document.body
  );
}

function ProductForm({ initial, onSubmit, onCancel, saving }) {
  const { t, language } = useLanguage();
  const normalizeForm = (value) => ({
    ...value,
    specs: (value?.specs || []).map((spec) => ({
      ...spec,
      label: normalizePresetValue("spec", spec.label),
    })),
    features: (value?.features || []).map((feature) => normalizePresetValue("feature", feature)),
  });
  const [form, setForm] = useState(() => normalizeForm(initial || emptyForm));
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
  }, t);

  const specPresets = Object.keys(SPEC_PRESET_OPTIONS).map((key) => ({
    key,
    label: getPresetLabel("spec", key, language),
  }));
  const featurePresets = Object.keys(FEATURE_PRESET_OPTIONS).map((key) => ({
    key,
    label: getPresetLabel("feature", key, language),
  }));

  const addSpec = (label = "") => set("specs", [...form.specs, { label, value: "" }]);
  const updateSpec = (i, key, value) => {
    const next = [...form.specs];
    next[i] = { ...next[i], [key]: value };
    set("specs", next);
  };
  const removeSpec = (i) => set("specs", form.specs.filter((_, idx) => idx !== i));
  const activeSpecKeys = new Set(form.specs.map((s) => normalizePresetValue("spec", s.label)));
  const togglePresetSpec = (key) => {
    if (activeSpecKeys.has(key)) {
      set("specs", form.specs.filter((s) => normalizePresetValue("spec", s.label) !== key));
    } else {
      addSpec(key);
    }
  };

  const activeFeatureSet = new Set(form.features.map((feature) => normalizePresetValue("feature", feature)));
  const toggleFeature = (feature) => {
    if (activeFeatureSet.has(feature)) {
      set("features", form.features.filter((f) => normalizePresetValue("feature", f) !== feature));
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
  const featurePresetSet = new Set(Object.keys(FEATURE_PRESET_OPTIONS));
  const customFeatures = form.features
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => !featurePresetSet.has(normalizePresetValue("feature", f)));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    const remainingSlots = MAX_IMAGES - existingImages.length - newFiles.length;
    if (files.length > remainingSlots) {
      toast.error(
        remainingSlots > 0
          ? t("adminProducts.maxImages", { count: remainingSlots })
          : t("adminProducts.maxImagesReached")
      );
      return;
    }

    const oversized = files.find((f) => f.size > MAX_IMAGE_MB * 1024 * 1024);
    if (oversized) {
      toast.error(t("adminProducts.imageTooLarge", { name: oversized.name, size: MAX_IMAGE_MB }));
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
    if (!form.name.trim()) errors.name = t("adminProducts.productNameRequired");
    if (form.price !== "" && Number(form.price) < 0) errors.price = t("adminProducts.priceNegative");
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
          {initial ? t("adminProducts.modalTitleEdit") : t("adminProducts.modalTitleNew")}
        </h2>
        <p className="text-[13px] text-gray-400 m-0 mb-6">
          {t("adminProducts.modalSubtitle")}
        </p>

        {liveIssues.length > 0 && (
          <div className="flex items-start gap-2.5 mb-6 p-3.5 rounded-[12px] bg-amber-50 border border-amber-200">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12.5px] font-semibold text-amber-800 m-0 mb-1">
                {t("adminProducts.modalLiveIssues")}
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
          label={t("adminProducts.fieldName")}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ex : H360-Nova"
          error={fieldErrors.name}
        />

        <TextField
          label={t("adminProducts.fieldPrice")}
          hint={t("adminProducts.fieldPriceHint")}
          type="number"
          value={form.price}
          onChange={(e) => set("price", e.target.value)}
          placeholder="Ex : 185000"
          error={fieldErrors.price}
        />

        <Field label={t("adminProducts.fieldDescription")}>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full px-3.5 py-[10px] rounded-[10px] bg-white border border-gray-200 text-gray-900 text-sm outline-none focus:border-red-500 resize-none transition-colors"
          />
        </Field>

        <span className="block font-semibold text-[12px] tracking-[.02em] text-gray-500 uppercase mb-1.5">
          {t("adminProducts.fieldDimensions")}
        </span>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <TextField
            label={t("adminProducts.fieldLength")}
            type="number"
            value={form.dimensions.length}
            onChange={(e) => set("dimensions", { ...form.dimensions, length: e.target.value })}
          />
          <TextField
            label={t("adminProducts.fieldWidth")}
            type="number"
            value={form.dimensions.width}
            onChange={(e) => set("dimensions", { ...form.dimensions, width: e.target.value })}
          />
          <TextField
            label={t("adminProducts.fieldHeight")}
            type="number"
            value={form.dimensions.height}
            onChange={(e) => set("dimensions", { ...form.dimensions, height: e.target.value })}
          />
        </div>

        {/* toggles */}
        <div className="flex flex-wrap gap-4 mb-7 pb-6 border-b border-gray-100">
          {[
            ["available", t("adminProducts.toggleAvailable")],
            ["featured", t("adminProducts.toggleFeatured")],
            ["showOnMainPage", t("adminProducts.toggleMainPage")],
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
            {t("adminProducts.specSection")}
          </span>
          <div className="flex flex-wrap gap-2 mb-4">
            {specPresets.map(({ key, label }) => {
              const active = activeSpecKeys.has(key);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => togglePresetSpec(key)}
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
                  value={getPresetLabel("spec", s.label, language)}
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
            {t("adminProducts.featureSection")}
          </span>
          <div className="flex flex-wrap gap-2 mb-4">
            {featurePresets.map(({ key, label }) => {
              const active = activeFeatureSet.has(key);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleFeature(key)}
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
            {t("adminProducts.imageSection")}
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
            <label className="w-20 h-20 rounded-[10px]  text-black border-2 border-dashed border-gray-250 flex items-center justify-center cursor-pointer text-gray-350 hover:text-gray-600 hover:border-gray-400 transition-colors">
              <Plus size={18} />
              <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
            </label>
          </div>
          <p className="text-[11px] text-gray-400 m-0">{t("adminProducts.imageHint")}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3 rounded-[12px] bg-white border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t("adminProducts.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-[12px] bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            {saving ? t("adminProducts.save") : initial ? t("adminProducts.update") : t("adminProducts.create")}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function ProductCard({ product, onEdit, onDelete, onShowIssues }) {
  const { t } = useLanguage();
  const issues = getVisibilityIssues(product, t);

  return (
    <div className="group relative bg-white rounded-[20px] border border-gray-100 overflow-hidden hover:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-40 bg-gray-50">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            🏍
          </div>
        )}

        {/* status badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {product.showOnMainPage && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-semibold uppercase ring-1 ring-red-100">
              {t("adminProducts.statusHome")}
            </span>
          )}
          {!product.available && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-gray-900/80 text-white font-semibold uppercase">
              {t("adminProducts.statusUnavailable")}
            </span>
          )}
        </div>

        {issues.length > 0 && (
          <button
            onClick={() => onShowIssues(issues)}
            title={t("adminProducts.visibilityTitle")}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 text-amber-500 hover:bg-amber-50 flex items-center justify-center shadow-sm transition-colors"
          >
            <AlertTriangle size={14} />
          </button>
        )}

        {/* action buttons — reveal on hover */}
        <div className="absolute inset-x-2.5 bottom-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] bg-white/95 backdrop-blur text-gray-700 hover:text-gray-900 text-[12px] font-semibold shadow-sm transition-colors"
          >
            <Edit size={13} /> {t("adminProducts.editAction")}
          </button>
          <button
            onClick={() => onDelete(product)}
            className="w-9 flex items-center justify-center rounded-[10px] bg-white/95 backdrop-blur text-gray-500 hover:text-red-600 shadow-sm transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="font-bold text-[14.5px] text-gray-900 m-0 truncate">{product.name}</p>
        <p className="text-[12.5px] text-gray-400 m-0 mt-1">
          {product.price != null ? `${product.price.toLocaleString()} DA` : t("products.priceOnDemand")}
        </p>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const { t } = useLanguage();
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
      toast.error(t("adminProducts.loadError"));
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

      const { data: saved } = await axios.request({
        method,
        url,
        data: fd,
        headers: authHeaders(),
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
          toast.error(t("adminProducts.imageRemoveError", { count: failedCount }));
        }
      }

      toast.success(isEdit ? t("adminProducts.saveSuccessUpdate") : t("adminProducts.saveSuccessCreate"));
      setEditing(null);
      await fetchAll();

      // Surface a clear reason if the saved product still won't show
      // properly, instead of leaving the admin to guess.
      const issues = getVisibilityIssues(saved, t);
      if (issues.length > 0) setIssuesPopup(issues);
    } catch (err) {
      toast.error(err.response?.data?.message || t("adminProducts.saveError"));
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
      toast.success(t("adminProducts.deleteSuccess"));
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch {
      toast.error(t("adminProducts.deleteError"));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen px-5 sm:px-[26px] py-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="font-bold text-2xl sm:text-3xl text-gray-900 m-0">{t("adminProducts.title")}</h1>
          <button
            onClick={() => setEditing({})}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
          >
            <Plus size={16} /> {t("adminProducts.addProduct")}
          </button>
        </div>

        <div className="relative mb-7 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-350" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("adminProducts.searchPlaceholder")}
            className="w-full pl-10 pr-3.5 py-[10px] rounded-full bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-350 outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">{t("adminProducts.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">{t("adminProducts.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onEdit={setEditing}
                onDelete={handleDelete}
                onShowIssues={setIssuesPopup}
              />
            ))}
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