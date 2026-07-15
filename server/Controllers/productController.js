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
  res.json(products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
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

    const specs = parseJSONField(req.body.specs, []);
    const features = parseJSONField(req.body.features, []);
    const dimensions = parseJSONField(req.body.dimensions, {
      length: null,
      width: null,
      height: null,
    });

    const product = await Product.create({
      name: name.trim(),
      slug: await generateUniqueSlug(name),
      price:
        price !== undefined && price !== ""
          ? Number(price)
          : null,
      description: description?.trim() || "",
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

    res.status(201).json(product);
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
  if (description !== undefined) product.description = description.trim();
  if (featured !== undefined) product.featured = featured === 'true' || featured === true;
  if (available !== undefined) product.available = available === 'true' || available === true;
  if (showOnMainPage !== undefined)
    product.showOnMainPage = showOnMainPage === 'true' || showOnMainPage === true;

  if (req.body.specs !== undefined) product.specs = parseJSONField(req.body.specs, product.specs);
  if (req.body.features !== undefined)
    product.features = parseJSONField(req.body.features, product.features);
  if (req.body.dimensions !== undefined)
    product.dimensions = parseJSONField(req.body.dimensions, product.dimensions);

  if (req.files && req.files.length > 0) {
    const newImages = [];
    for (const file of req.files) {
      const { url, public_id } = await uploadToCloudinary(file);
      newImages.push({ url, public_id });
    }
    product.images = [...product.images, ...newImages];
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