// Core imports
import mongoose from "mongoose";

// Favorite schema definition
const favoriteSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// Schema indexes
favoriteSchema.index({ user: 1, recipe: 1 }, { unique: true });

// Favorite model
const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);

// Model export
export default Favorite;


