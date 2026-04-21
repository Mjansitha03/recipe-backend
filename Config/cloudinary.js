// Third-party imports
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Environment setup
dotenv.config();

// Cloudinary client configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Shared Cloudinary client export
export default cloudinary;

