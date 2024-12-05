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
        .catch(() => {
            res.status(500).json({ message: "Erreur" });
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
        .catch(() => {
            res.status(500).json({ message: "Erreur" });
        });
};

exports.getBooksByBestRating = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then((books) => {
            res.status(200).json(books);
        })
        .catch(() => {
            res.status(500).json({ message: "Erreur" });
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
        .catch(() => res.status(500).json({ message: "Erreur" }));
};

exports.modifyBook = (req, res) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (req.file) {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {});
            }

            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Objet modifié !' }))
                .catch(() => res.status(400).json({ message: "Erreur" }));
        })
        .catch(() => res.status(404).json({ message: "Erreur" }));
};


exports.createRating = async (req, res, next) => {
    const { rating } = req.body;
    const bookId = req.params.id;
    const userId = req.auth.userId;

    // Vérification de la validité de la note
    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5' });
    }

    try {
        // Recherche du livre
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: "Livre non trouvé" });
        }

        // Vérification si l'utilisateur a déjà noté ce livre
        const hasRated = book.ratings.some(rating => rating.userId === userId);
        if (hasRated) {
            return res.status(403).json({ message: 'Non autorisé, vous avez déjà noté ce livre' });
        }

        // Ajout de la nouvelle note
        const ratingObject = { ...req.body, grade: rating };
        const newRatings = [...book.ratings, ratingObject];

        // Calcul de la nouvelle moyenne des notes
        const averageRating = newRatings.reduce((sum, { grade }) => sum + grade, 0) / newRatings.length;

        // Mise à jour du livre avec la nouvelle note et la moyenne
        book.ratings = newRatings;
        book.averageRating = averageRating;

        // Sauvegarde du livre mis à jour
        await book.save();

        // Renvoi du livre mis à jour
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour du livre", error });
    }
};
