const Book = require("../models/books");
const fs = require("fs");

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then((books) => {
            if (books.length === 0) {
                return res.status(404).json({ message: "Aucun livre trouvé" });
            }
            res.status(200).json(books);
        })
        .catch((error) => {
            res.status(500).json({
                message: "Erreur",
                error: error,
            });
        });
};

exports.getBookById = (req, res, next) => {
    const bookId = req.params.id;
    Book.find({ _id: bookId })
        .then((books) => {
            if (books.length === 0) {
                return res.status(404).json({ message: "Livre non trouvé" });
            }
            res.status(200).json(books[0]); 
        })
        .catch((error) => {
            res.status(500).json({
                message: "Erreur",
                error: error,
            });
        });
};

exports.getBooksByBestRating = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then((books) => {
            res.status(200).json(books);
        })
        .catch((error) => {
            res.status(500).json({
                message: "Erreur",
                error: error,
            });
        });
};

const deleteImage = (imagePath) => {
    fs.unlinkSync(imagePath);
};

exports.createBook = async (req, res, next) => {
    try {
        const bookData = JSON.parse(req.body.book);
        delete bookData._id;
        delete bookData._userId;
        const { title, author, genre, year } = bookData;
        const trimmedTitle = title.trim();
        const trimmedAuthor = author.trim();
        const trimmedGenre = genre.trim();
        const trimmedYear = year.trim();

        const existingBook = await Book.findOne({
            title: trimmedTitle,
            author: trimmedAuthor,
        });

        if (existingBook) {
            if (req.file) deleteImage(req.file.path);
            throw new Error("Ce livre existe");
        }

        if (bookData.ratings && bookData.ratings.length === 1 && bookData.ratings[0].grade === 0) {
            bookData.ratings = [];
            bookData.averageRating = 0;
        }

        const book = new Book({
            ...bookData,
            title: trimmedTitle,
            author: trimmedAuthor,
            genre: trimmedGenre,
            year: trimmedYear,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
        });

        await book.save();
        res.status(201).json({ message: "Livre créé" });
        
    } catch (error) {
        if (req.file) deleteImage(req.file.path);
        res.status(400).json({ error: error.message });
    }
};

exports.deleteBook = (req, res, next) => {
    const bookId = req.params.id;
    Book.findOne({ _id: bookId })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: "Livre non trouvé" });
            }
            if (book.userId.toString() !== req.auth.userId) {
                return res.status(403).json({ message: "Non autorisé à supprimer ce livre" });
            }
            const filename = book.imageUrl.split("/images/")[1];
            return Book.deleteOne({ _id: bookId })
                .then(() => {
                    deleteImage(`images/${filename}`);
                    res.status(200).json({ message: "Livre supprimé" });
                });
        })
        .catch((error) => res.status(500).json({ error }));
};