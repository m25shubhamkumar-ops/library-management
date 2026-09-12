const Issue = require('../models/Issue');
const Book = require('../models/Book');
const User = require('../models/User');

const MAX_BOOKS = parseInt(process.env.MAX_BORROW_LIMIT, 10) || 3;
const FINE_PER_DAY = parseInt(process.env.FINE_PER_DAY, 10) || 10;
const DEFAULT_DUE_DAYS = parseInt(process.env.DEFAULT_DUE_DAYS, 10) || 7;

// POST /issues/request/:bookId - Member requests a book
exports.postRequestBook = async (req, res) => {
  const { bookId } = req.params;
  const memberId = req.session.userId;

  try {
    const book = await Book.findById(bookId);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/books');
    }

    // Business Rule 1: Prevent zero-copy issue request
    if (book.availableCopies <= 0) {
      req.flash('error', 'Book currently unavailable. All copies are currently issued.');
      return res.redirect(`/books/${bookId}`);
    }

    // Business Rule 2: Per-member borrowing limit (default 3 books)
    const activeBorrowedCount = await Issue.countDocuments({
      member: memberId,
      status: { $in: ['requested', 'issued'] },
    });

    if (activeBorrowedCount >= MAX_BOOKS) {
      req.flash(
        'error',
        `You have reached your maximum borrowing limit of ${MAX_BOOKS} books. Please return a book before requesting another.`
      );
      return res.redirect(`/books/${bookId}`);
    }

    // Business Rule 3: Member cannot have the same book requested or issued twice concurrently
    const alreadyIssued = await Issue.findOne({
      book: bookId,
      member: memberId,
      status: { $in: ['requested', 'issued'] },
    });

    if (alreadyIssued) {
      req.flash(
        'error',
        `You already have an active request or borrowed copy for "${book.title}".`
      );
      return res.redirect(`/books/${bookId}`);
    }

    // Create Issue in 'requested' state
    const issue = new Issue({
      book: bookId,
      member: memberId,
      status: 'requested',
    });

    await issue.save();
    req.flash('success', `Issue request for "${book.title}" submitted successfully! Awaiting librarian approval.`);
    return res.redirect('/issues/my-books');
  } catch (err) {
    console.error('Error requesting book:', err);
    req.flash('error', 'Unable to submit book request.');
    return res.redirect(`/books/${bookId}`);
  }
};

// GET /issues/requests - Librarian reviews pending requests
exports.getIssueRequests = async (req, res) => {
  try {
    const requests = await Issue.find({ status: 'requested' })
      .populate('book')
      .populate('member', 'name email phone')
      .sort({ createdAt: -1 });

    res.render('issues/requests', {
      title: 'Pending Issue Requests - Library Management',
      path: '/issues/requests',
      requests,
      maxBorrowLimit: MAX_BOOKS,
    });
  } catch (err) {
    console.error('Error fetching issue requests:', err);
    req.flash('error', 'Failed to retrieve issue requests.');
    res.redirect('/dashboard');
  }
};

// POST /issues/approve/:issueId - Librarian approves issue request
exports.postApproveRequest = async (req, res) => {
  const { issueId } = req.params;

  try {
    const issue = await Issue.findById(issueId).populate('book').populate('member');
    if (!issue) {
      req.flash('error', 'Issue request not found.');
      return res.redirect('/issues/requests');
    }

    if (issue.status !== 'requested') {
      req.flash('error', `This request has already been ${issue.status}.`);
      return res.redirect('/issues/requests');
    }

    const book = await Book.findById(issue.book._id);
    if (!book) {
      req.flash('error', 'Associated book record not found.');
      return res.redirect('/issues/requests');
    }

    // Rule 1 Verification: Available copies > 0
    if (book.availableCopies <= 0) {
      req.flash('error', `Cannot approve: No available copies remaining for "${book.title}".`);
      return res.redirect('/issues/requests');
    }

    // Rule 2 Verification: Member limit
    const memberIssuedCount = await Issue.countDocuments({
      member: issue.member._id,
      status: 'issued',
    });

    if (memberIssuedCount >= MAX_BOOKS) {
      req.flash('error', `Member ${issue.member.name} has already reached the maximum limit of ${MAX_BOOKS} active books.`);
      return res.redirect('/issues/requests');
    }

    // Set Dates
    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + DEFAULT_DUE_DAYS);

    // Update Issue
    issue.status = 'issued';
    issue.issueDate = today;
    issue.dueDate = due;
    issue.fine = 0;
    await issue.save();

    // Decrement available copies & increment total borrowCount
    book.availableCopies -= 1;
    book.borrowCount += 1;
    await book.save();

    req.flash('success', `Book "${book.title}" successfully issued to ${issue.member.name}. Due on ${due.toDateString()}.`);
    return res.redirect('/issues/requests');
  } catch (err) {
    console.error('Error approving request:', err);
    req.flash('error', 'Error approving request.');
    return res.redirect('/issues/requests');
  }
};

// POST /issues/reject/:issueId - Librarian rejects request
exports.postRejectRequest = async (req, res) => {
  const { issueId } = req.params;
  const { rejectionReason } = req.body;

  try {
    const issue = await Issue.findById(issueId).populate('book').populate('member');
    if (!issue) {
      req.flash('error', 'Issue request not found.');
      return res.redirect('/issues/requests');
    }

    issue.status = 'rejected';
    issue.note = rejectionReason ? rejectionReason.trim() : 'Request declined by librarian.';
    await issue.save();

    req.flash('success', `Request for "${issue.book.title}" rejected.`);
    return res.redirect('/issues/requests');
  } catch (err) {
    console.error('Error rejecting request:', err);
    req.flash('error', 'Error rejecting request.');
    return res.redirect('/issues/requests');
  }
};

// GET /issues/issued - Librarian views all active loans & history
exports.getAllIssuedBooks = async (req, res) => {
  try {
    const { filterStatus } = req.query;
    const query = {};

    if (filterStatus && filterStatus !== 'all') {
      query.status = filterStatus;
    } else {
      query.status = { $in: ['issued', 'returned', 'overdue'] };
    }

    const issues = await Issue.find(query)
      .populate('book')
      .populate('member', 'name email phone')
      .sort({ issueDate: -1, createdAt: -1 });

    // Enrich with dynamic overdue & fine details
    const enrichedIssues = issues.map((item) => {
      const overdueInfo = item.getOverdueInfo(FINE_PER_DAY);
      return {
        ...item.toObject(),
        isDynamicallyOverdue: overdueInfo.isOverdue,
        overdueDays: overdueInfo.days,
        calculatedFine: overdueInfo.fine,
      };
    });

    res.render('issues/issued', {
      title: 'Lending Records - Library Management',
      path: '/issues/issued',
      issues: enrichedIssues,
      currentFilter: filterStatus || 'all',
      finePerDay: FINE_PER_DAY,
    });
  } catch (err) {
    console.error('Error fetching lending records:', err);
    req.flash('error', 'Unable to fetch lending records.');
    res.redirect('/dashboard');
  }
};

// POST /issues/return/:issueId - Return flow with automatic fine calculation
exports.postReturnBook = async (req, res) => {
  const { issueId } = req.params;

  try {
    const issue = await Issue.findById(issueId).populate('book').populate('member');
    if (!issue) {
      req.flash('error', 'Issue record not found.');
      return res.redirect('/issues/issued');
    }

    if (issue.status === 'returned') {
      req.flash('error', 'This book has already been marked as returned.');
      return res.redirect(req.session.role === 'librarian' ? '/issues/issued' : '/issues/my-books');
    }

    const today = new Date();
    issue.returnDate = today;

    // Rule 7: Dynamic overdue fine calculation
    let calculatedFine = 0;
    let overdueDays = 0;

    if (issue.dueDate && today > issue.dueDate) {
      const diffMs = today.getTime() - issue.dueDate.getTime();
      overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      calculatedFine = overdueDays * FINE_PER_DAY;
    }

    issue.status = 'returned';
    issue.fine = calculatedFine;
    await issue.save();

    // Increment available copies back
    const book = await Book.findById(issue.book._id);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();
    }

    if (calculatedFine > 0) {
      req.flash(
        'warning',
        `Book "${book ? book.title : 'Book'}" returned successfully. OVERDUE by ${overdueDays} day(s). Fine calculated: ₹${calculatedFine} (₹${FINE_PER_DAY}/day).`
      );
    } else {
      req.flash('success', `Book "${book ? book.title : 'Book'}" returned successfully on time. No fines.`);
    }

    const redirectPath = req.session.role === 'librarian' ? '/issues/issued' : '/issues/my-books';
    return res.redirect(redirectPath);
  } catch (err) {
    console.error('Error returning book:', err);
    req.flash('error', 'Failed to process book return.');
    return res.redirect('/dashboard');
  }
};

// GET /issues/my-books - Member views their borrowed books and history
exports.getMyBooks = async (req, res) => {
  try {
    const memberId = req.session.userId;

    const myIssues = await Issue.find({ member: memberId })
      .populate('book')
      .sort({ createdAt: -1 });

    const activeLoans = [];
    const pendingRequests = [];
    const history = [];
    let totalFines = 0;

    myIssues.forEach((issue) => {
      const overdueInfo = issue.getOverdueInfo(FINE_PER_DAY);
      const enriched = {
        ...issue.toObject(),
        isDynamicallyOverdue: overdueInfo.isOverdue,
        overdueDays: overdueInfo.days,
        currentFine: issue.status === 'returned' ? issue.fine : overdueInfo.fine,
      };

      if (issue.status === 'issued') {
        activeLoans.push(enriched);
        totalFines += overdueInfo.fine;
      } else if (issue.status === 'requested') {
        pendingRequests.push(enriched);
      } else {
        history.push(enriched);
        totalFines += issue.fine || 0;
      }
    });

    res.render('issues/mybooks', {
      title: 'My Borrowed Books - Library Management',
      path: '/issues/my-books',
      activeLoans,
      pendingRequests,
      history,
      totalFines,
      maxBorrowLimit: MAX_BOOKS,
      finePerDay: FINE_PER_DAY,
    });
  } catch (err) {
    console.error('Error fetching member books:', err);
    req.flash('error', 'Unable to retrieve your books.');
    res.redirect('/dashboard');
  }
};
