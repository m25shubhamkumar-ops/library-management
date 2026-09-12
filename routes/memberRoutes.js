const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const { isLibrarian } = require('../middleware/roleMiddleware');

// Librarian only: View all members
router.get('/', isLoggedIn, isLibrarian, memberController.getAllMembers);

module.exports = router;
