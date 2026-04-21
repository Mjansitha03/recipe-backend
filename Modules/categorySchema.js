// Core imports
import mongoose from "mongoose";

// Category schema definition
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [60, "Category name cannot exceed 60 characters"],
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    type: {
      type: String,
      required: [true, "Category type is required"],
      enum: {
        values: ["meal", "cuisine", "foodType", "tag"],
        message: "Invalid category type",
      },
      default: "meal",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },

    icon: {
      type: String,
      trim: true,
      default: "",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: [0, "Sort order cannot be negative"],
    },

    // ✅ ADD THIS
    recipeCount: {
      type: Number,
      default: 0,
      min: [0, "Recipe count cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

// Slug generation helper
const generateSlug = (value = "") => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Schema middleware
categorySchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = generateSlug(this.name);
  } else if (this.slug) {
    this.slug = generateSlug(this.slug);
  }
});

// Schema indexes
categorySchema.index({ name: 1, type: 1 }, { unique: true });
categorySchema.index({ type: 1, isActive: 1, sortOrder: 1, createdAt: -1 });

// Category model
const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

// Model export
export default Category;


