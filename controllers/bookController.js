const Book = require('../models/Book');
const Issue = require('../models/Issue');

const CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science & Tech',
  'History',
  'Biography',
  'Philosophy',
  'Self-Help',
  'Literature',
  'Other',
];

// GET /books - View & Search & Filter
exports.getAllBooks = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { ISBN: searchRegex },
      ];
    }

    if (category && category.trim() !== '' && category !== 'All') {
      filter.category = category.trim();
    }

    const books = await Book.find(filter).sort({ title: 1 });
    const totalCount = await Book.countDocuments();

    res.render('books/allbooks', {
      title: 'Book Catalog - Library Management',
      path: '/books',
      books,
      categories: CATEGORIES,
      selectedCategory: category || 'All',
      searchQuery: search || '',
      totalCatalogCount: totalCount,
    });
  } catch (err) {
    console.error('Error fetching books:', err);
    req.flash('error', 'Unable to fetch books catalog.');
    res.redirect('/dashboard');
  }
};

// GET /books/:id - Details view
exports.getBookDetails = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/books');
    }

    let userActiveIssue = null;
    let memberBorrowedCount = 0;
    const MAX_BOOKS = parseInt(process.env.MAX_BORROW_LIMIT, 10) || 3;

    if (req.session && req.session.userId) {
      // Check if current user has an active/pending issue for this specific book
      userActiveIssue = await Issue.findOne({
        book: book._id,
        member: req.session.userId,
        status: { $in: ['requested', 'issued'] },
      });

      // Check current user's total active issues
      memberBorrowedCount = await Issue.countDocuments({
        member: req.session.userId,
        status: { $in: ['requested', 'issued'] },
      });
    }

    // Recent issue history for librarians
    let recentIssues = [];
    if (req.session && req.session.role === 'librarian') {
      recentIssues = await Issue.find({ book: book._id })
        .populate('member', 'name email')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.render('books/bookdetails', {
      title: `${book.title} - Book Details`,
      path: '/books',
      book,
      userActiveIssue,
      memberBorrowedCount,
      maxBorrowLimit: MAX_BOOKS,
      recentIssues,
    });
  } catch (err) {
    console.error('Error fetching book details:', err);
    req.flash('error', 'Unable to load book details.');
    res.redirect('/books');
  }
};

// GET /books/add (Librarian only)
exports.getAddBook = (req, res) => {
  res.render('books/addbook', {
    title: 'Add New Book - Library Management',
    path: '/books/add',
    categories: CATEGORIES,
    formData: {},
  });
};

// POST /books/add (Librarian only)
exports.postAddBook = async (req, res) => {
  const { title, author, ISBN, category, totalCopies, description, publishedYear } = req.body;
  const formData = req.body;

  if (!title || !author || !ISBN || !category || !totalCopies) {
    req.flash('error', 'Please fill in all mandatory fields.');
    return res.render('books/addbook', {
      title: 'Add New Book',
      path: '/books/add',
      categories: CATEGORIES,
      formData,
    });
  }

  const copies = parseInt(totalCopies, 10);
  if (isNaN(copies) || copies < 0) {
    req.flash('error', 'Total copies must be a non-negative number.');
    return res.render('books/addbook', {
      title: 'Add New Book',
      path: '/books/add',
      categories: CATEGORIES,
      formData,
    });
  }

  try {
    const existingISBN = await Book.findOne({ ISBN: ISBN.trim() });
    if (existingISBN) {
      req.flash('error', 'A book with this ISBN already exists.');
      return res.render('books/addbook', {
        title: 'Add New Book',
        path: '/books/add',
        categories: CATEGORIES,
        formData,
      });
    }

    const newBook = new Book({
      title: title.trim(),
      author: author.trim(),
      ISBN: ISBN.trim(),
      category: category.trim(),
      totalCopies: copies,
      availableCopies: copies, // Rule: Initially availableCopies = totalCopies
      borrowCount: 0,
      description: description ? description.trim() : '',
      publishedYear: publishedYear ? parseInt(publishedYear, 10) : new Date().getFullYear(),
    });

    await newBook.save();
    req.flash('success', `"${newBook.title}" added to the catalog successfully.`);
    return res.redirect('/books');
  } catch (err) {
    console.error('Error creating book:', err);
    req.flash('error', 'Error adding book. Please verify inputs.');
    return res.render('books/addbook', {
      title: 'Add New Book',
      path: '/books/add',
      categories: CATEGORIES,
      formData,
    });
  }
};

// GET /books/edit/:id (Librarian only)
exports.getEditBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/books');
    }

    const issuedCopies = book.totalCopies - book.availableCopies;

    res.render('books/editbook', {
      title: `Edit ${book.title}`,
      path: '/books',
      book,
      categories: CATEGORIES,
      issuedCopies,
    });
  } catch (err) {
    console.error('Error fetching book for edit:', err);
    req.flash('error', 'Unable to open book for editing.');
    res.redirect('/books');
  }
};

// POST /books/edit/:id (Librarian only)
exports.postEditBook = async (req, res) => {
  const { title, author, category, totalCopies, description, publishedYear } = req.body;

  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/books');
    }

    const newTotal = parseInt(totalCopies, 10);
    if (isNaN(newTotal) || newTotal < 0) {
      req.flash('error', 'Total copies must be a non-negative number.');
      return res.redirect(`/books/edit/${book._id}`);
    }

    // Business Rule 8: Copy update safeguard
    const issuedCopies = book.totalCopies - book.availableCopies;
    if (newTotal < issuedCopies) {
      req.flash(
        'error',
        `Cannot reduce total copies below currently issued copies (${issuedCopies} copies are currently issued).`
      );
      return res.redirect(`/books/edit/${book._id}`);
    }

    const delta = newTotal - book.totalCopies;
    const newAvailable = book.availableCopies + delta;

    book.title = title.trim();
    book.author = author.trim();
    book.category = category.trim();
    book.totalCopies = newTotal;
    book.availableCopies = newAvailable;
    book.description = description ? description.trim() : '';
    if (publishedYear) book.publishedYear = parseInt(publishedYear, 10);

    await book.save();
    req.flash('success', `"${book.title}" updated successfully.`);
    return res.redirect(`/books/${book._id}`);
  } catch (err) {
    console.error('Error updating book:', err);
    req.flash('error', 'Error updating book.');
    return res.redirect(`/books/edit/${req.params.id}`);
  }
};

// POST /books/delete/:id (Librarian only)
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/books');
    }

    // Business Rule 4: Don't allow deletion if books are currently issued or pending
    if (book.totalCopies !== book.availableCopies) {
      const issuedCount = book.totalCopies - book.availableCopies;
      req.flash(
        'error',
        `Cannot delete "${book.title}". ${issuedCount} ${
          issuedCount === 1 ? 'copy is' : 'copies are'
        } currently issued out of the library.`
      );
      return res.redirect(`/books/${book._id}`);
    }

    // Check if there are any active requested or issued records in Issue model
    const activeIssues = await Issue.countDocuments({
      book: book._id,
      status: { $in: ['requested', 'issued'] },
    });

    if (activeIssues > 0) {
      req.flash('error', `Cannot delete "${book.title}". It has ${activeIssues} active issue/request records.`);
      return res.redirect(`/books/${book._id}`);
    }

    await Book.findByIdAndDelete(book._id);
    req.flash('success', `Book "${book.title}" was successfully deleted from the catalog.`);
    return res.redirect('/books');
  } catch (err) {
    console.error('Error deleting book:', err);
    req.flash('error', 'Failed to delete book.');
    return res.redirect('/books');
  }
};
