// Third-party imports
import multer from "multer";

// Multer storage configuration
const storage = multer.memoryStorage();

// File validation helper
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Shared upload middleware instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

export default upload;
