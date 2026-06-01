import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// ── User ──
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  synagogue_name: { type: String, default: '' },
  logo_url: { type: String, default: '' },
  synagogue_city: { type: String, default: '' },
  synagogue_timezone: { type: String, default: 'Asia/Jerusalem' },
  prayer_calculation_method: { type: String, default: 'GRA' },
  prayer_times: { type: Array, default: [] },
  credits: { type: Number, default: 10 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
userSchema.virtual('id').get(function () { return this._id.toString(); });
export const User = model('User', userSchema);

// ── Announcement ──
const announcementSchema = new Schema({
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  synagogue_name: { type: String, default: '' },
  title: { type: String, default: 'מודעה חדשה' },
  background_url: { type: String, default: '' },
  logo_url: { type: String, default: '' },
  text_elements: { type: Array, default: [] },
  is_draft: { type: Boolean, default: true },
  is_shared: { type: Boolean, default: false },
  category: { type: String, default: '' },
  orientation: { type: String, default: 'portrait' },
  canvas_width: { type: Number, default: 595 },
  canvas_height: { type: Number, default: 842 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
announcementSchema.virtual('id').get(function () { return this._id.toString(); });
export const Announcement = model('Announcement', announcementSchema);

// ── Template ──
const templateSchema = new Schema({
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  background_url: { type: String, default: '' },
  thumbnail_url: { type: String, default: '' },
  text_elements: { type: Array, default: [] },
  is_shared: { type: Boolean, default: false },
  categories: { type: [String], default: [] },
  tags: { type: [String], default: [] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
templateSchema.virtual('id').get(function () { return this._id.toString(); });
export const Template = model('Template', templateSchema);

// ── Background ──
const backgroundSchema = new Schema({
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  image_url: { type: String, required: true },
  is_shared: { type: Boolean, default: false },
  categories: { type: [String], default: [] },
  tags: { type: [String], default: [] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
backgroundSchema.virtual('id').get(function () { return this._id.toString(); });
export const Background = model('Background', backgroundSchema);

// ── TemplateCategory ──
const templateCategorySchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
templateCategorySchema.virtual('id').get(function () { return this._id.toString(); });
export const TemplateCategory = model('TemplateCategory', templateCategorySchema);

// ── BackgroundCategory ──
const backgroundCategorySchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
backgroundCategorySchema.virtual('id').get(function () { return this._id.toString(); });
export const BackgroundCategory = model('BackgroundCategory', backgroundCategorySchema);

// Map entity name → model
export const ENTITY_MODELS = {
  announcements: Announcement,
  templates: Template,
  backgrounds: Background,
  'template-categories': TemplateCategory,
  'background-categories': BackgroundCategory,
  users: User,
};
