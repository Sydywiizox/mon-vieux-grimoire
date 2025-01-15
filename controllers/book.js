const Book = require("../models/Book");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) // Trie par la note moyenne
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.createBook = async (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  /*
  if (req.file) {
    const optimizedPath = await optimizeImage(req.file);
    req.file.filename = path.basename(optimizedPath);
    req.file.path = optimizedPath;
  }
*/

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  book
    .save()
    .then(() => {
      res.status(201).json({
        message: "Post saved successfully!",
      });
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.modifyBook = async (req, res, next) => {
  console.log(req.file);
  /*
  if (req.file) {
    const optimizedPath = await optimizeImage(req.file);
    req.file.filename = path.basename(optimizedPath);
    req.file.path = optimizedPath;
  }*/
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.updateOne(
            { _id: req.params.id },
            { ...bookObject, _id: req.params.id }
          )
            .then(() => res.status(200).json({ message: "Objet modifié!" }))
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.addRating = (req, res, next) => {
  const userId = req.auth.userId;
  const grade = req.body.rating;
  const bookId = req.params.id;
  Book.findOne({ _id: bookId })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      const existingRating = book.ratings.find(
        (rating) => rating.userId === userId
      );
      if (existingRating) {
        return res
          .status(400)
          .json({ error: "User has already rated this book" });
      }

      const newRating = {
        userId: userId,
        grade: grade,
      };

      book.ratings.push(newRating);
      return book.save();
    })
    .then((updatedBook) => {
      res.status(200).json(updatedBook);
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};

const optimizeImage = async function (file) {
  const filePath = file.path;
  const fileName = path.parse(file.filename).name;
  const outputPath = `images/${fileName}.webp`;

  try {
    // Convertir et optimiser l'image
    await sharp(filePath)
      .webp({ quality: 80 })
      .resize(800, 1000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFile(outputPath);

    // Supprimer l'image originale
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
    return outputPath; // Retourne le chemin du fichier optimisé
  } catch (error) {
    console.error("Erreur lors de l'optimisation de l'image :", error);
    throw error; // Remonte l'erreur pour la gestion en amont
  }
};
