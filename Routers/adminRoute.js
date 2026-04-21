// Core imports
import express from "express";
import { getDashboardStats } from "../Controllers/adminController.js";
import { protect, authorizeRoles } from "../Midddlewares/authMiddleware.js";

// Router setup
const router = express.Router();

// Admin dashboard routes
router.get("/dashboard", protect, authorizeRoles("admin"), getDashboardStats);

// Router export
export default router;


