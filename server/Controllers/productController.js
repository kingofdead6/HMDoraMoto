import asyncHandler from 'express-async-handler';
import Product from '../Models/Product.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const parseJSONField = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const SPEC_PRESET_LOOKUP = {
  nominal_power: ['Puissance nominale', 'الاستطاعة المقدرة'],
  nominal_voltage: ['Tension nominale', 'التوتر المقدر'],
  controller: ['Contrôleur', 'المتحكم'],
  battery_type: ['Type de batterie', 'نوع البطارية'],
  battery_specs: ['Spécifications de la batterie', 'مواصفات البطارية'],
  max_speed: ['Vitesse maximale', 'السرعة القصوى'],
  autonomy: ['Autonomie', 'المدى'],
  motor_type: ['Type de moteur', 'نوع المحرك'],
  slope_angle: ['Angle de pente', 'زاوية المنحدر'],
  charging_time: ['Temps de charge', 'وقت الشحن'],
  brakes: ['Freins avant / arrière', 'الفرامل الأمامية / الخلفية'],
  tire_specs: ['Spécifications des pneus', 'مواصفات الإطارات'],
  hub_specs: ['Spécifications du moyeu', 'مواصفات المحور'],
  max_load: ['Charge maximale', 'الحمولة القصوى'],
  wheelbase: ['Empattement', 'المسافة بين العجلات'],
  body_tank: ['Réservoir de carrosserie', 'سعة خزان الدراجة'],
  seat_height: ['Hauteur du siège', 'ارتفاع المقعد'],
  front_tires: ['Pneus avant', 'الإطارات الأمامية'],
  rear_tires: ['Pneus arrière', 'الإطارات الخلفية'],
  front_wheel: ['Jante avant', 'العجلة الأمامية'],
  front_suspension: ['Suspension avant', 'التعليق الأمامي'],
  rear_shock: ['Amortisseur arrière', 'المُخمد الخلفي'],
  lights: ['Phares', 'الأضواء'],
  instruments: ['Instruments', 'الأدوات'],
};

const FEATURE_PRESET_LOOKUP = {
  repair_in_one_click: ['Réparation en un clic', 'إصلاح بنقرة واحدة'],
  parking_brake_p: ['Frein de stationnement en position P', 'الفرامل اليدوية في وضع P'],
  three_speeds: ['Trois vitesses', 'ثلاث سرعات'],
  reverse: ['Marche arrière', 'الرجوع للخلف'],
  usb_port: ['Port USB', 'منفذ USB'],
  smart_start: ['Démarrage intelligent sans clé', 'التشغيل الذكي بدون مفتاح'],
  cruise_control: ['Régulateur de vitesse', 'منظم السرعة'],
};

const normalizePresetValue = (type, value) => {
  const lookup = type === 'feature' ? FEATURE_PRESET_LOOKUP : SPEC_PRESET_LOOKUP;
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return value;
  if (lookup[text]) return text;
  const normalized = text.toLowerCase();
  for (const [key, labels] of Object.entries(lookup)) {
    if (labels.some((label) => label.toLowerCase() === normalized)) return key;
  }
  return value;
};

const normalizeSpecs = (specs = []) => {
  if (!Array.isArray(specs)) return [];
  return specs.map((spec) => ({
    label: normalizePresetValue('spec', spec?.label),
    value: typeof spec?.value === 'string' ? spec.value : String(spec?.value ?? ''),
  }));
};

const normalizeFeatures = (features = []) => {
  if (!Array.isArray(features)) return [];
  return features.map((feature) => normalizePresetValue('feature', feature));
};

const normalizeProductPayload = (product) => {
  if (!product) return product;
  return {
    ...product,
    specs: normalizeSpecs(product.specs),
    features: normalizeFeatures(product.features),
  };
};

const generateUniqueSlug = async (name, excludeId = null) => {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (
    await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
  ) {
    slug = `${base}-${counter++}`;
  }
  return slug;
};

export const getProducts = asyncHandler(async (req, res) => {
  const { featured, showOnMainPage, available } = req.query;
  const query = {};
  if (featured !== undefined) query.featured = featured === 'true';
  if (showOnMainPage !== undefined) query.showOnMainPage = showOnMainPage === 'true';
  if (available !== undefined) query.available = available === 'true';

  const products = await Product.find(query).sort({ createdAt: -1 }).lean();
  res.json(products.map(normalizeProductPayload));
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(normalizeProductPayload(product));
});

export const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log("===== CREATE PRODUCT =====");
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const {
      name,
      price,
      description,
      featured,
      available,
      showOnMainPage,
    } = req.body;

    if (!name) {
      res.status(400);
      throw new Error("Le nom du produit est requis");
    }

    const images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log("Uploading:", file.originalname);

        const result = await uploadToCloudinary(file);

        console.log("Cloudinary Result:", result);

        images.push({
          url: result.url,
          public_id: result.public_id,
        });
      }
    }

    const specs = normalizeSpecs(parseJSONField(req.body.specs, []));

    const requiredSpecs = ['max_speed', 'autonomy', 'nominal_power', 'charging_time'];
    const missingSpecs = requiredSpecs.filter(key => {
      const spec = specs.find(s => s.label === key);
      return !spec || !spec.value || !spec.value.trim();
    });

    if (missingSpecs.length > 0) {
      res.status(400);
      throw new Error(`Les caractéristiques suivantes sont obligatoires : ${missingSpecs.map(k => SPEC_PRESET_LOOKUP[k][0]).join(', ')}`);
    }

    const features = normalizeFeatures(parseJSONField(req.body.features, []));
    const dimensions = parseJSONField(req.body.dimensions, {
      length: null,
      width: null,
      height: null,
    });

    const normalizedDescription = typeof description === 'string' ? description.trim() : description ?? '';

    const product = await Product.create({
      name: name.trim(),
      slug: await generateUniqueSlug(name),
      price:
        price !== undefined && price !== ""
          ? Number(price)
          : null,
      description: normalizedDescription,
      featured: featured === "true" || featured === true,
      available:
        available === undefined
          ? true
          : available === "true" || available === true,
      showOnMainPage:
        showOnMainPage === "true" || showOnMainPage === true,
      images,
      specs,
      features,
      dimensions,
    });

    console.log("Created Product:", product);

    res.status(201).json(normalizeProductPayload(product));
  } catch (err) {
    console.error("CREATE PRODUCT ERROR:");
    console.error(err);

    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { name, price, description, featured, available, showOnMainPage } = req.body;

  if (name) {
    product.name = name.trim();
    product.slug = await generateUniqueSlug(name, product._id);
  }
  if (price !== undefined) product.price = price === '' ? null : Number(price);
  if (description !== undefined) {
    product.description = typeof description === 'string' ? description.trim() : description ?? '';
  }
  if (featured !== undefined) product.featured = featured === 'true' || featured === true;
  if (available !== undefined) product.available = available === 'true' || available === true;
  if (showOnMainPage !== undefined)
    product.showOnMainPage = showOnMainPage === 'true' || showOnMainPage === true;

  if (req.body.specs !== undefined) {
    const specs = normalizeSpecs(parseJSONField(req.body.specs, product.specs));
    
    const requiredSpecs = ['max_speed', 'autonomy', 'nominal_power', 'charging_time'];
    const missingSpecs = requiredSpecs.filter(key => {
      const spec = specs.find(s => s.label === key);
      return !spec || !spec.value || !spec.value.trim();
    });

    if (missingSpecs.length > 0) {
      res.status(400);
      throw new Error(`Les caractéristiques suivantes sont obligatoires : ${missingSpecs.map(k => SPEC_PRESET_LOOKUP[k][0]).join(', ')}`);
    }

    product.specs = specs;
  }
  
  if (req.body.features !== undefined)
    product.features = normalizeFeatures(parseJSONField(req.body.features, product.features));
  if (req.body.dimensions !== undefined)
    product.dimensions = parseJSONField(req.body.dimensions, product.dimensions);

  const queuedFiles = Array.isArray(req.files) ? [...req.files] : [];
  let nextNewFileIndex = 0;

  if (req.body.imageOrder !== undefined) {
    const imageOrder = parseJSONField(req.body.imageOrder, []);
    if (Array.isArray(imageOrder) && imageOrder.length > 0) {
      const originalImages = Array.isArray(product.images) ? product.images.slice() : [];
      const byId = new Map(originalImages.map((img) => [String(img._id), img]));
      const byUrl = new Map(originalImages.map((img) => [img.url, img]));
      const ordered = [];
      const consumedIds = new Set();
      const consumedUrls = new Set();

      for (const token of imageOrder) {
        if (typeof token === 'string' && token.startsWith('new-')) {
          const file = queuedFiles[nextNewFileIndex];
          if (file) {
            const { url, public_id } = await uploadToCloudinary(file);
            ordered.push({ url, public_id });
            nextNewFileIndex += 1;
          }
        } else {
          let img = byId.get(String(token));
          if (img) {
            ordered.push(img);
            consumedIds.add(String(img._id));
          } else {
            img = byUrl.get(token);
            if (img) {
              ordered.push(img);
              consumedUrls.add(img.url);
            }
          }
        }
      }

      const remainingExisting = originalImages.filter((img) => {
        return !consumedIds.has(String(img._id)) && !consumedUrls.has(img.url);
      });
      product.images = [...ordered, ...remainingExisting];
    }
  }

  const remainingFiles = queuedFiles.slice(nextNewFileIndex);
  if (remainingFiles.length > 0) {
    const newImages = [];
    for (const file of remainingFiles) {
      const { url, public_id } = await uploadToCloudinary(file);
      newImages.push({ url, public_id });
    }
    product.images = [...(Array.isArray(product.images) ? product.images : []), ...newImages];
  }

  const updated = await product.save();
  res.json(updated);
});

export const removeProductImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const image = product.images.id(imageId);
  if (!image) {
    res.status(404);
    throw new Error('Image not found on this product');
  }

  await deleteFromCloudinary(image.public_id);
  product.images.pull(imageId);

  const updated = await product.save();
  res.json(updated);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await Promise.all(product.images.map((img) => deleteFromCloudinary(img.public_id)));

  await product.deleteOne();
  res.json({ message: 'Product deleted' });
});