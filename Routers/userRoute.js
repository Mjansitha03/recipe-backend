// Core imports
import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  getMyFavoriteRecipes,
  getMyOwnReviews,
  getMyDashboard,
} from "../Controllers/userController.js";
import { protect } from "../Midddlewares/authMiddleware.js";

// Router setup
const router = express.Router();

// Protected user routes
router.get("/dashboard", protect, getMyDashboard);

router.get("/me", protect, getMyProfile);

router.put("/me", protect, updateMyProfile);

router.get("/me/favorites", protect, getMyFavoriteRecipes);

router.get("/me/reviews", protect, getMyOwnReviews);

// Router export
export default router;



