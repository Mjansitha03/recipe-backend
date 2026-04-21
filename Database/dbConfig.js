// Core imports
import mongoose from "mongoose";
import dns from "dns";

// DNS configuration
dns.setDefaultResultOrder("ipv4first");

// Database connection helper
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("DB Error:", err.message);
  }
};

// Shared database connector export
export default connectDB;

