const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Vérifie et crée le dossier "images" si nécessaire
const ensureImagesFolderExists = () => {
  if (!fs.existsSync("images")) {
    fs.mkdirSync("images");
  }
};

// Configuration du stockage Multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    ensureImagesFolderExists(); // Assure que le dossier existe
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const name = path.parse(file.originalname.split(" ").join("_")).name; // Remplace les espaces par des '_'
    const extension = path.parse(file.originalname).ext; // Récupère l'extension
    callback(null, name + Date.now() + extension); // Génère un nom unique
  },
});

const uploadAndOptimizeImage = (req, res, next) => {
  const upload = multer({ storage: storage }).single("image");

  upload(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next();
    }

    try {
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

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Erreur lors de la suppression du fichier :", err);
        } else {
          console.log("Ancien fichier supprimé :", filePath);
        }
      });

      // Met à jour les informations de fichier dans la requête
      req.file.filename = `${fileName}.webp`;
      req.file.path = outputPath;
      next();
    } catch (error) {
      console.error("Erreur : Echec de traitement de l'image", error);
      return res.status(500).json({
        message: "Erreur : Echec de traitement de l'image",
        error: error.message,
      });
    }
  });
};

module.exports = { uploadAndOptimizeImage };
