// Core imports
import express from "express";
import {
  forgotPassword,
  resetPassword,
  signin,
  signup,
  verifyResetToken,
} from "../Controllers/authController.js";

// Router setup
const router = express.Router();

// Authentication routes
router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset/:id/:token", verifyResetToken);
router.post("/reset-password/:id/:token", resetPassword);

// Router export
export default router;


