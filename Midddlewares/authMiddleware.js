// Core imports
import jwt from "jsonwebtoken";
import User from "../Modules/userSchema.js";

// Shared response helpers
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const normalizeRole = (role) => role?.toLowerCase().trim();

// Authentication guard
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Access denied. No token provided");
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables");
      return sendError(res, 500, "Server configuration error");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return sendError(res, 401, "User not found");
    }

    if (user.isBlocked) {
      return sendError(
        res,
        403,
        "Your account has been blocked by admin. Please contact support."
      );
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Protect Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token expired. Please login again");
    }

    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token");
    }

    return sendError(res, 401, "Authentication failed");
  }
};

// Role-based authorization guard
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return sendError(res, 401, "Unauthorized access");
      }

      const userRole = normalizeRole(req.user.role);
      const allowedRoles = roles.map(normalizeRole);

      if (!allowedRoles.includes(userRole)) {
        return sendError(res, 403, `Access denied for role: ${req.user.role}`);
      }

      next();
    } catch (error) {
      console.error("Authorize Roles Error:", error.message);
      return sendError(res, 500, "Authorization check failed");
    }
  };
};
