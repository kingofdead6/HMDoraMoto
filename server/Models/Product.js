import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  price: {
    type: Number,
    min: 0,
    default: null,
  },
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, default: null },
    },
  ],

  dimensions: {
    length: { type: Number, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
  },

  specs: [
    {
      label: { type: String, required: true, trim: true },
      value: { type: String, required: true, trim: true },
    },
  ],

  features: [{ type: String, trim: true }],

  available: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  showOnMainPage: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

productSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  
});

export default mongoose.model('Product', productSchema);