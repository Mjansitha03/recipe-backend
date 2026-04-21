// Core imports
import express from "express";
import {
  createReview,
  getApprovedReviewsByRecipe,
  getMyReviews,
  deleteMyReview,
} from "../Controllers/reviewController.js";
import { protect } from "../Midddlewares/authMiddleware.js";

// Router setup
const router = express.Router();

// Public review routes
router.get("/recipe/:recipeId", getApprovedReviewsByRecipe);

// Protected review routes
router.post("/create", protect, createReview);

router.get("/my", protect, getMyReviews);

router.delete("/my/:id", protect, deleteMyReview);

// Router export
export default router;


