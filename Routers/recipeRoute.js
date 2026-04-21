// Core imports
import express from "express";
import {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  searchRecipes,
} from "../Controllers/recipeController.js";
import upload from "../Midddlewares/uploadMiddleware.js";
import { protect, authorizeRoles } from "../Midddlewares/authMiddleware.js";
import { getRecipesByCategory } from "../Controllers/categoryController.js";

// Router setup
const router = express.Router();

// Public recipe routes
router.get("/", getAllRecipes);
router.get("/search", searchRecipes);
router.get("/by-category", getRecipesByCategory);
router.get("/:id", getRecipeById);

// Admin recipe routes
router.post(
  "/create",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  createRecipe
);

router.put(
  "/update/:id",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  updateRecipe
);

router.delete(
  "/delete/:id",
  protect,
  authorizeRoles("admin"),
  deleteRecipe
);

// Router export
export default router;



