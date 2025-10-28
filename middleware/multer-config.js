const multer = require("multer");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Filtrer uniquement les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Seules les images (JPEG, PNG, WebP) sont autorisées !"));
  }
};

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const name = path.parse(file.originalname.split(" ").join("_")).name;
    return {
      public_id: `book-covers/${name}${Date.now()}`,
      format: "webp",
      transformation: [
        {
          width: 800,
          height: 1000,
          crop: "limit",
          quality: 80,
        },
      ],
    };
  },
});

const uploadAndOptimizeImage = (req, res, next) => {
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
  }).single("image");

  upload(req, res, async (err) => {
    if (err) {
      console.error("Erreur Multer/Cloudinary:", err);
      return res.status(400).json({
        error: "Erreur lors de l'upload de l'image",
        details: err.message,
      });
    }

    if (!req.file) {
      console.log("Aucun fichier reçu");
      return next();
    }

    console.log("Fichier uploadé avec succès sur Cloudinary:", req.file.path);
    // L'URL de l'image est déjà disponible dans req.file.path (Cloudinary)
    next();
  });
};

module.exports = { uploadAndOptimizeImage };
