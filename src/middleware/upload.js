const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(require('os').tmpdir(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userDir = path.join(uploadDir, req.user._id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const random = crypto.randomBytes(8).toString('hex');
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${random}-${cleanName}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept all file types
  cb(null, true);
};

// Multer config
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB max
  },
  fileFilter: fileFilter
});

const handleUpload = upload.single('file');

const handleMultipleUpload = upload.array('files', 10);

module.exports = { upload, handleUpload, handleMultipleUpload };