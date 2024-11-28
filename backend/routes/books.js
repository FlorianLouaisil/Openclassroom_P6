const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require('../middleware/multer-config');
const bookController = require("../controllers/books");

router.get("/", bookController.getAllBooks);
router.get("/bestrating", bookController.getBooksByBestRating);
router.get("/:id", bookController.getBookById);
router.post("/", auth, multer, bookController.createBook); 
router.delete("/:id", auth,  bookController.deleteBook);
// Modifier à faire

module.exports = router;
