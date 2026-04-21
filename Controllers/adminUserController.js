// Core imports
import mongoose from "mongoose";
import User from "../Modules/userSchema.js";

// Shared constants
const SAFE_USER_FIELDS = "-password -resetToken -resetTokenExpiry";
const ALLOWED_ROLES = ["user", "admin"];

// Shared response helpers
const sendError = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && { error }),
  });
};

const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

// Shared utility helpers
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeRole = (role) => role?.toLowerCase().trim();

const isSelfAction = (req, userId) =>
  req.user?._id?.toString() === userId.toString();

// User management handlers
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select(SAFE_USER_FIELDS)
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Users fetched successfully", {
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error.message);
    return sendError(res, 500, "Failed to fetch users", error.message);
  }
};


export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return sendError(res, 400, "Invalid user ID");
    }

    const user = await User.findById(userId).select(SAFE_USER_FIELDS);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "User fetched successfully", { user });
  } catch (error) {
    console.error("Get User By ID Error:", error.message);
    return sendError(res, 500, "Failed to fetch user", error.message);
  }
};

// User role management
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    let { role } = req.body;

    if (!isValidObjectId(userId)) {
      return sendError(res, 400, "Invalid user ID");
    }

    if (isSelfAction(req, userId)) {
      return sendError(res, 400, "You cannot change your own role");
    }

    role = normalizeRole(role);

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return sendError(res, 400, "Valid role is required (user or admin)");
    }

    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (normalizeRole(user.role) === role) {
      return sendError(res, 400, `User already has role: ${role}`);
    }

    if (user.isSeedData && normalizeRole(user.role) === "admin") {
      return sendError(res, 400, "Seed admin role cannot be changed");
    }

    user.role = role;
    await user.save();

    const safeUser = await User.findById(userId).select(SAFE_USER_FIELDS);

    return sendSuccess(res, 200, `User role updated to ${role}`, {
      user: safeUser,
    });
  } catch (error) {
    console.error("Update User Role Error:", error.message);
    return sendError(res, 500, "Failed to update user role", error.message);
  }
};

// User access control
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return sendError(res, 400, "Invalid user ID");
    }

    if (isSelfAction(req, userId)) {
      return sendError(res, 400, "You cannot block your own account");
    }

    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (user.isBlocked) {
      return sendError(res, 400, "User is already blocked");
    }

    if (user.isSeedData && normalizeRole(user.role) === "admin") {
      return sendError(res, 400, "Seed admin account cannot be blocked");
    }

    user.isBlocked = true;
    await user.save();

    const safeUser = await User.findById(userId).select(SAFE_USER_FIELDS);

    return sendSuccess(res, 200, "User blocked successfully", {
      user: safeUser,
    });
  } catch (error) {
    console.error("Block User Error:", error.message);
    return sendError(res, 500, "Failed to block user", error.message);
  }
};


export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return sendError(res, 400, "Invalid user ID");
    }

    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (!user.isBlocked) {
      return sendError(res, 400, "User is already active");
    }

    user.isBlocked = false;
    await user.save();

    const safeUser = await User.findById(userId).select(SAFE_USER_FIELDS);

    return sendSuccess(res, 200, "User unblocked successfully", {
      user: safeUser,
    });
  } catch (error) {
    console.error("Unblock User Error:", error.message);
    return sendError(res, 500, "Failed to unblock user", error.message);
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return sendError(res, 400, "Invalid user ID");
    }

    if (isSelfAction(req, userId)) {
      return sendError(res, 400, "You cannot delete your own account");
    }

    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (user.isSeedData) {
      return sendError(res, 400, "Seed users cannot be deleted");
    }

    await User.findByIdAndDelete(userId);

    return sendSuccess(res, 200, "User deleted successfully");
  } catch (error) {
    console.error("Delete User Error:", error.message);
    return sendError(res, 500, "Failed to delete user", error.message);
  }
};

// User analytics
export const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalNormalUsers,
      blockedUsers,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ isBlocked: false }),
    ]);

    return sendSuccess(res, 200, "User stats fetched successfully", {
      stats: {
        totalUsers,
        totalAdmins,
        totalNormalUsers,
        activeUsers,
        blockedUsers,
      },
    });
  } catch (error) {
    console.error("Get User Stats Error:", error.message);
    return sendError(res, 500, "Failed to fetch user stats", error.message);
  }
};



