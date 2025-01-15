const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  grade: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
});

const bookSchema = mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: { type: [ratingSchema], default: [] },
  averageRating: { type: Number, default: 0 },
});

bookSchema.pre("save", function (next) {
  if (this.ratings.length > 0) {
    const total = this.ratings.reduce((sum, rating) => sum + rating.grade, 0);
    this.averageRating = total / this.ratings.length;
    this.averageRating = Math.round(this.averageRating * 10) / 10;
  } else {
    this.averageRating = 0;
  }
  next();
});

module.exports = mongoose.model("Book", bookSchema);
