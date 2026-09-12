const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const { isLibrarian, isMember } = require('../middleware/roleMiddleware');

// Member: Request book issue
router.post('/request/:bookId', isLoggedIn, isMember, issueController.postRequestBook);

// Member: View my books
router.get('/my-books', isLoggedIn, issueController.getMyBooks);

// Librarian: View issue requests
router.get('/requests', isLoggedIn, isLibrarian, issueController.getIssueRequests);

// Librarian: Approve request
router.post('/approve/:issueId', isLoggedIn, isLibrarian, issueController.postApproveRequest);

// Librarian: Reject request
router.post('/reject/:issueId', isLoggedIn, isLibrarian, issueController.postRejectRequest);

// Librarian: View all issued books
router.get('/issued', isLoggedIn, isLibrarian, issueController.getAllIssuedBooks);

// Member or Librarian: Return a book
router.post('/return/:issueId', isLoggedIn, issueController.postReturnBook);

module.exports = router;
