// Core imports
import express from "express";
import {
  getAllReviews,
  getPendingReviews,
  approveReview,
  deleteReview,
} from "../Controllers/adminReviewController.js";
import { protect, authorizeRoles } from "../Midddlewares/authMiddleware.js";

// Router setup
const router = express.Router();

// Route-level admin protection
router.use(protect, authorizeRoles("admin"));

// Review management routes
router.get("/", getAllReviews);

router.get("/pending", getPendingReviews);

router.put("/approve/:id", approveReview);

router.delete("/delete/:id", deleteReview);

// Router export
export default router;


