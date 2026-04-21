// Third-party and utility imports
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../Utils/mailer.js";
import User from "../Modules/userSchema.js";

// Environment setup
dotenv.config();

// Auth configuration
const RESET_EXPIRY_MINUTES = 2;

// Account registration
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashed,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Account sign-in
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent blocked users from logging in
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by admin",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "365d" },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signin Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Password reset request flow
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 2. Find user
    const user = await User.findOne({ email });

    // 3. Security: don't reveal user existence
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If user exists, reset link sent",
      });
    }

    // 4. Generate token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // 5. Save token
    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000;

    await user.save();

    // 6. Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${user._id}/${rawToken}`;

    // 7. Email content
    const textMessage = `
You requested a password reset.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${RESET_EXPIRY_MINUTES} minutes.

If you did not request this, please ignore this email.
`.trim();

    const htmlMessage = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
  <h2>Password Reset Request</h2>
  <p>You requested a password reset.</p>

  <p>Click the button below to reset your password:</p>

  <p>
    <a href="${resetUrl}" 
       style="
        display:inline-block;
        padding:10px 18px;
        background:#2563eb;
        color:#fff;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold;">
      Reset Password
    </a>
  </p>

  <p>Or use this link:</p>
  <p><a href="${resetUrl}">${resetUrl}</a></p>

  <p>This link will expire in ${RESET_EXPIRY_MINUTES} minutes.</p>

  <p>If you did not request this, please ignore this email.</p>
</div>
`;

    // 8. Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: textMessage,
      html: htmlMessage,
    });

    // 9. Success response
    return res.status(200).json({
      success: true,
      message: "Reset link sent to email",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Password reset token validation
export const verifyResetToken = async (req, res) => {
  try {
    const { id, token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      _id: id,
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(410).json({
        success: false,
        message: "Reset link is invalid or expired",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token valid",
      expiresInSeconds: Math.ceil((user.resetTokenExpiry - Date.now()) / 1000),
    });
  } catch (err) {
    console.error("Verify Reset Token Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Password reset completion
export const resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      _id: id,
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(410).json({
        success: false,
        message: "Reset link expired or already used",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
