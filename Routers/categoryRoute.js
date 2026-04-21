// Core imports
import express from "express";
import {
  createCategory,
  getAllCategories,
  getGroupedCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getRecipesByCategorySlug,
  syncAllCategoryRecipeCounts,
} from "../Controllers/categoryController.js";
import { protect, authorizeRoles } from "../Midddlewares/authMiddleware.js";

// Router setup
const router = express.Router();

// Public category routes
router.get("/grouped", getGroupedCategories);
router.get("/", getAllCategories);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/slug/:slug/recipes", getRecipesByCategorySlug);
router.get("/:id", getCategoryById);

// Admin category routes
router.post("/create", protect, authorizeRoles("admin"), createCategory);
router.put("/:id", protect, authorizeRoles("admin"), updateCategory);
router.delete("/:id", protect, authorizeRoles("admin"), deleteCategory);
router.patch(
  "/sync-recipe-counts",
  protect,
  authorizeRoles("admin"),
  syncAllCategoryRecipeCounts,
);

// Router export
export default router;



