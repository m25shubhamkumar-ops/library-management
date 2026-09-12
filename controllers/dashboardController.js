const Book = require('../models/Book');
const Issue = require('../models/Issue');
const User = require('../models/User');

const FINE_PER_DAY = parseInt(process.env.FINE_PER_DAY, 10) || 10;
const MAX_BOOKS = parseInt(process.env.MAX_BORROW_LIMIT, 10) || 3;

// GET /dashboard
exports.getDashboard = async (req, res) => {
  const userRole = req.session.role;
  const userId = req.session.userId;
  const today = new Date();

  try {
    if (userRole === 'librarian') {
      // 1. Total Distinct Books
      const totalBooks = await Book.countDocuments();

      // 2. Total Copies & Available Copies Aggregations
      const copyStats = await Book.aggregate([
        {
          $group: {
            _id: null,
            totalCopies: { $sum: '$totalCopies' },
            availableCopies: { $sum: '$availableCopies' },
          },
        },
      ]);
      const totalCopies = copyStats.length > 0 ? copyStats[0].totalCopies : 0;
      const availableCopies = copyStats.length > 0 ? copyStats[0].availableCopies : 0;

      // 3. Issued Books
      const issuedBooks = await Issue.countDocuments({ status: 'issued' });

      // 4. Overdue Books (dynamically computed where dueDate < today)
      const overdueBooks = await Issue.countDocuments({
        status: 'issued',
        dueDate: { $lt: today },
      });

      // 5. Total Members
      const totalMembers = await User.countDocuments({ role: 'member' });

      // 6. Pending Issue Requests
      const pendingRequests = await Issue.countDocuments({ status: 'requested' });

      // 7. Most Borrowed Books (Top 5 sorted by borrowCount DESC)
      const mostBorrowedBooks = await Book.find().sort({ borrowCount: -1 }).limit(5);

      // 8. Upcoming & Overdue Returns
      const activeIssues = await Issue.find({ status: 'issued' })
        .populate('book')
        .populate('member', 'name email phone')
        .sort({ dueDate: 1 })
        .limit(6);

      const enrichedActiveIssues = activeIssues.map((item) => {
        const overdueInfo = item.getOverdueInfo(FINE_PER_DAY);
        return {
          ...item.toObject(),
          isOverdue: overdueInfo.isOverdue,
          overdueDays: overdueInfo.days,
          estimatedFine: overdueInfo.fine,
        };
      });

      // 9. Recent Pending Requests
      const recentRequests = await Issue.find({ status: 'requested' })
        .populate('book')
        .populate('member', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);

      return res.render('dashboard/dashboard', {
        title: 'Librarian Dashboard - Library Management',
        path: '/dashboard',
        stats: {
          totalBooks,
          totalCopies,
          issuedBooks,
          availableCopies,
          overdueBooks,
          totalMembers,
          pendingRequests,
        },
        mostBorrowedBooks,
        upcomingReturns: enrichedActiveIssues,
        recentRequests,
      });
    } else {
      // Member Dashboard View
      const activeLoans = await Issue.find({
        member: userId,
        status: 'issued',
      }).populate('book');

      const pendingRequests = await Issue.find({
        member: userId,
        status: 'requested',
      }).populate('book');

      const returnedLoans = await Issue.find({
        member: userId,
        status: 'returned',
      }).populate('book');

      const enrichedActiveLoans = activeLoans.map((loan) => {
        const overdueInfo = loan.getOverdueInfo(FINE_PER_DAY);
        return {
          ...loan.toObject(),
          isOverdue: overdueInfo.isOverdue,
          overdueDays: overdueInfo.days,
          estimatedFine: overdueInfo.fine,
        };
      });

      const totalFinesPaidOrDue = returnedLoans.reduce((acc, curr) => acc + (curr.fine || 0), 0) +
        enrichedActiveLoans.reduce((acc, curr) => acc + (curr.estimatedFine || 0), 0);

      // Featured / popular books recommended for member
      const popularBooks = await Book.find({ availableCopies: { $gt: 0 } })
        .sort({ borrowCount: -1 })
        .limit(4);

      return res.render('dashboard/member-dashboard', {
        title: 'Member Dashboard - Library Management',
        path: '/dashboard',
        activeLoans: enrichedActiveLoans,
        pendingRequests,
        returnedCount: returnedLoans.length,
        totalFines: totalFinesPaidOrDue,
        maxBorrowLimit: MAX_BOOKS,
        popularBooks,
      });
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Unable to load dashboard information.');
    return res.render('dashboard/dashboard', {
      title: 'Dashboard',
      path: '/dashboard',
      stats: {
        totalBooks: 0,
        totalCopies: 0,
        issuedBooks: 0,
        availableCopies: 0,
        overdueBooks: 0,
        totalMembers: 0,
        pendingRequests: 0,
      },
      mostBorrowedBooks: [],
      upcomingReturns: [],
      recentRequests: [],
    });
  }
};
