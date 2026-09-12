const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const { isLibrarian } = require('../middleware/roleMiddleware');

// Public or member/librarian browsing
router.get('/', bookController.getAllBooks);

// Librarian only: Add book
router.get('/add', isLoggedIn, isLibrarian, bookController.getAddBook);
router.post('/add', isLoggedIn, isLibrarian, bookController.postAddBook);

// Book details
router.get('/:id', bookController.getBookDetails);

// Librarian only: Edit book
router.get('/edit/:id', isLoggedIn, isLibrarian, bookController.getEditBook);
router.post('/edit/:id', isLoggedIn, isLibrarian, bookController.postEditBook);

// Librarian only: Delete book
router.post('/delete/:id', isLoggedIn, isLibrarian, bookController.deleteBook);

module.exports = router;
