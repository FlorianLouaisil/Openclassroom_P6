const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require('../middleware/multer-config');
const imageOptimizer = require('../middleware/image-optimizer'); 
const bookController = require("../controllers/books");

router.get("/", bookController.getAllBooks);
router.get("/bestrating", bookController.getBooksByBestRating);
router.get("/:id", bookController.getBookById);
router.post("/", auth, multer, imageOptimizer, bookController.createBook); 
router.delete("/:id", auth,  bookController.deleteBook);
router.put("/:id", auth, multer, imageOptimizer, bookController.modifyBook);
router.post('/:id/rating', auth, bookController.createRating);

module.exports = router;
