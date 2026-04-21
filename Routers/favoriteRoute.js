// Core imports
import express from "express";
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite,
  toggleFavorite,
} from "../Controllers/favoriteController.js";
import { protect } from "../Midddlewares/authMiddleware.js";

// Router setup
const router = express.Router();

// Favorite routes
router.get("/", protect, getUserFavorites);

router.get("/check/:recipeId", protect, checkFavorite);

router.post("/toggle", protect, toggleFavorite);

router.post("/", protect, addFavorite);

router.delete("/:recipeId", protect, removeFavorite);

// Router export
export default router;


