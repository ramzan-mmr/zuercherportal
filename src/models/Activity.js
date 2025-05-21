const mongoose = require('mongoose');

const itineraryStopSchema = new mongoose.Schema({
  stop: { type: String, required: true },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  googlePlaceId: String
});

const reviewSchema = new mongoose.Schema({
  body: { type: String, default: '' },
  rating: { type: Number, min: 0, max: 5, default: null }
});

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  itinerary: [itineraryStopSchema],
  interests: [{ type: String }],
  categories: [{ type: String }],
  price: {
    currency: { type: String, default: 'USD' },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    median: { type: Number, default: 0 }
  },
  time: { type: String, default: '' },
  duration: { type: String, default: '' },
  services: [{ type: String }],
  languages: [{ type: String }],
  departsFrom: { type: String, default: '' },
  starRating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, default: 0 },
  reviews: [reviewSchema],
  images: [{ type: String }],
  scrapeDate: { type: Date, default: Date.now },
  scrapeVersion: { type: String, default: '1.0.0' },
  scrapeId: { type: String, unique: true, required: true },
  activityId: { type: String, unique: true, sparse: true },
  googlePlaceId: { type: String, default: '' }
}, { timestamps: true });

// ✅ Add indexes
activitySchema.index({ title: 'text', description: 'text' });
activitySchema.index({ scrapeId: 1 }, { unique: true });
activitySchema.index({ activityId: 1 }, { unique: true, sparse: true });
activitySchema.index({ title: 1, departsFrom: 1 }, { unique: true, sparse: true });
activitySchema.index({ categories: 1 });
activitySchema.index({ interests: 1 });
activitySchema.index({ languages: 1 });
activitySchema.index({ departsFrom: 1 });
activitySchema.index({ 'price.currency': 1 });
activitySchema.index({ starRating: 1 });

module.exports = mongoose.model('Activity', activitySchema);
