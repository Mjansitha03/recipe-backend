// Core imports
import mongoose from "mongoose";

// Review schema definition
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: [true, "Recipe is required"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      default: "",
    },

    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Schema indexes
reviewSchema.index({ user: 1, recipe: 1 }, { unique: true });

reviewSchema.index({ recipe: 1, isApproved: 1 });
reviewSchema.index({ createdAt: -1 });

// Review model
const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

// Model export
export default Review;


