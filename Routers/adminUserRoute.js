// Core imports
import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  blockUser,
  unblockUser,
  deleteUser,
  getUserStats,
} from "../Controllers/adminUserController.js";
import { protect, authorizeRoles } from "../Midddlewares/authMiddleware.js";

// Router setup
const router = express.Router();

// Route-level admin protection
router.use(protect, authorizeRoles("admin"));

// Admin user management routes
router.get("/stats", getUserStats);
router.get("/", getAllUsers);
router.get("/:userId", getUserById);
router.put("/:userId/role", updateUserRole);
router.put("/:userId/block", blockUser);
router.put("/:userId/unblock", unblockUser);
router.delete("/:userId", deleteUser);

// Router export
export default router;


