const Book = require("../models/Book");
const fs = require("fs");

// GET /api/books
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: "Une erreur est survenue lors de la récupération des livres",
        error,
      });
    });
};

// GET /api/books/:id
exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error:
          "Une erreur est survenue lors de la récupération du livre " +
          req.params.id,
        error,
      });
    });
};

// GET /api/books/bestrating
exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) //ordre décroissant
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })

    .catch((error) => {
      res.status(400).json({
        error:
          "Une erreur est survenue lors de la récupération des livres les mieux notés",
        error,
      });
    });
};

// POST /api/books
exports.createBook = async (req, res, next) => {
  // Vérifier si l'utilisateur est authentifié
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id; // Supprimer tout id malveillant
    delete bookObject._userId; // Supprimer tout userId malveillant

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId, // Associer le livre à l'utilisateur authentifié
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    });

    await book.save();
    res.status(201).json({ message: "Livre créé avec succès !" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création du livre" });
  }
};

// PUT /api/books/:id
exports.modifyBook = async (req, res, next) => {
  // Vérifier si l'utilisateur est authentifié
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  // Vérifier si un fichier a été inclus dans la requête
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  // Supprimer les champs sensibles pour éviter des manipulations
  delete bookObject._userId;
  delete bookObject._id;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId != req.auth.userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }

      // Si un nouveau fichier est fourni, supprimer l'ancien fichier
      if (req.file) {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, (err) => {
          if (err) {
            console.error("Erreur lors de la suppression du fichier :", err);
          } else {
            console.log("Ancien fichier supprimé :", `images/${filename}`);
          }
        });
      }

      // Mettre à jour l'objet dans la base de données
      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }
      )
        .then(() => res.status(200).json({ message: "Livre modifié !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// DELETE /api/books/:id
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Livre supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// POST /api/books/:id/rating
exports.addRating = (req, res, next) => {
  const userId = req.auth.userId;
  const grade = req.body.rating;
  if (typeof grade !== "number" || grade < 0 || grade > 5) {
    return res
      .status(400)
      .json({ error: "La note doit être comprise entre 0 et 5" });
  }
  const bookId = req.params.id;
  Book.findOne({ _id: bookId })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: "Livre non trouvé" });
      }

      const existingRating = book.ratings.find(
        (rating) => rating.userId === userId
      );
      if (existingRating) {
        return res
          .status(400)
          .json({ error: "Cet utilisateur a deja note ce livre" });
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
      res.status(400).json({
        error: "Une erreur est survenue lors de l'ajout de la note",
        error,
      });
    });
};
