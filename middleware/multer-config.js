const multer = require("multer");
const sharp = require("sharp"); // Ajoutez cette ligne
const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_");
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + "." + extension);
  },
});

const upload = multer({ storage: storage }).single("image");

// Middleware d'optimisation des images
const optimizeImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    console.log(req);
    const filePath = req.file.path;
    const fileName = path.parse(req.file.filename).name;
    const outputPath = `images/${fileName}.webp`;

    // Convertit et optimise l'image
    await sharp(filePath)
      .webp({ quality: 80 })
      .resize(800, 1000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFile(outputPath);

    console.log("Chemin complet :", filePath);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(
          "Erreur lors de la suppression du fichier original:",
          err
        );
      }
    });

    // Met à jour les informations de fichier dans la requête
    req.file.filename = `${fileName}.webp`;
    req.file.path = outputPath;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, optimizeImage };
