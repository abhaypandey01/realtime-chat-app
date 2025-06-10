import multer from "multer";
import path from "path";

// Set up storage for uploaded files
const storage = multer.memoryStorage();

// File type validation
const fileFilter = (req, file, cb) => {
    // Allowed file extensions
    const fileTypes = /jpeg|jpg|png|gif|webp/;
    
    // Check extension
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    
    // Check mime type
    const mimetype = fileTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"));
    }
};

// Create upload instance
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: fileFilter
});

// Middleware for handling single file uploads with field name 'groupProfile'
export const uploadGroupProfile = upload.single("groupProfile");

// Error handling middleware for multer errors
export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

