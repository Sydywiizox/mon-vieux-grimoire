const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();
const { uploadAndOptimizeImage } = require("../middleware/multer-config");
const booksCtrl = require("../controllers/book");

router.get("/", booksCtrl.getAllBooks);
router.get("/bestrating", booksCtrl.getBestRatedBooks);
router.get("/:id", booksCtrl.getOneBook);
router.post("/", auth, uploadAndOptimizeImage, booksCtrl.createBook);
router.put("/:id", auth, uploadAndOptimizeImage, booksCtrl.modifyBook);
router.delete("/:id", auth, booksCtrl.deleteBook);
router.post("/:id/rating", auth, booksCtrl.addRating);
router.put("/:id/rating", auth, booksCtrl.updateRating);
router.delete("/:id/rating", auth, booksCtrl.deleteRating);

module.exports = router;
