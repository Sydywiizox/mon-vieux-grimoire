const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();
const { upload, optimizeImage } = require("../middleware/multer-config");
const booksCtrl = require("../controllers/book");

router.get("/", booksCtrl.getAllBooks);
router.get("/bestrating", booksCtrl.getBestRatedBooks);
router.get("/:id", booksCtrl.getOneBook);
router.post("/", auth, upload, optimizeImage, booksCtrl.createBook);
router.put("/:id", auth, upload, optimizeImage, booksCtrl.modifyBook);
router.delete("/:id", auth, booksCtrl.deleteBook);
router.post("/:id/rating", auth, booksCtrl.addRating);

module.exports = router;
