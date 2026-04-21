// Core imports
import mongoose from "mongoose";

// Recipe schema definition
const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Recipe name is required"],
      trim: true,
      minlength: [2, "Recipe name must be at least 2 characters"],
      maxlength: [120, "Recipe name cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    ingredients: {
      type: [String],
      required: [true, "Ingredients are required"],
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length > 0 &&
          value.every(
            (item) => typeof item === "string" && item.trim().length > 0,
          ),
        message: "At least one valid ingredient is required",
      },
      set: (value) =>
        Array.isArray(value)
          ? value.map((item) => item.trim()).filter(Boolean)
          : value,
    },

    steps: {
      type: [String],
      required: [true, "Steps are required"],
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length > 0 &&
          value.every(
            (item) => typeof item === "string" && item.trim().length > 0,
          ),
        message: "At least one valid step is required",
      },
      set: (value) =>
        Array.isArray(value)
          ? value.map((item) => item.trim()).filter(Boolean)
          : value,
    },

    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
      max: [1440, "Duration cannot exceed 1440 minutes"],
    },

    mealCategory: {
      type: String,
      required: [true, "Meal category is required"],
      trim: true,
      set: (v) => v.trim().toLowerCase(),
    },

    cuisine: {
      type: String,
      required: [true, "Cuisine is required"],
      trim: true,
      set: (v) => v.trim().toLowerCase(),
    },

    foodType: {
      type: String,
      required: [true, "Food type is required"],
      trim: true,
      set: (v) => v.trim().toLowerCase(),
    },

    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.every(
            (item) => typeof item === "string" && item.trim().length > 0,
          ),
        message: "Tags must be a valid array of non-empty strings",
      },
      set: (value) =>
        Array.isArray(value)
          ? [
              ...new Set(
                value.map((item) => item.trim().toLowerCase()).filter(Boolean),
              ),
            ]
          : [],
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Schema indexes
recipeSchema.index({ name: "text", description: "text" });
recipeSchema.index({ mealCategory: 1 });
recipeSchema.index({ cuisine: 1 });
recipeSchema.index({ foodType: 1 });
recipeSchema.index({ tags: 1 });
recipeSchema.index({ createdAt: -1 });

// Recipe model
const Recipe = mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);

// Model export
export default Recipe;
