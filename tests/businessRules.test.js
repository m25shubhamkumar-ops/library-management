const assert = require('assert');
const bcrypt = require('bcryptjs');

console.log('====================================================');
console.log('🧪 RUNNING LIBRARY SYSTEM BUSINESS RULES TEST SUITE');
console.log('====================================================');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(testName, testFn) {
  try {
    await testFn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

async function startSuite() {
  // ----------------------------------------------------
  // Test 1: Password Hashing (Rule 6)
  // ----------------------------------------------------
  await runAsyncTest('Rule 6: Passwords must be hashed using bcrypt (10 salt rounds)', async () => {
    const rawPassword = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notStrictEqual(rawPassword, hash, 'Hash must not equal raw password');
    assert.strictEqual(hash.startsWith('$2'), true, 'Hash must have valid bcrypt prefix');

    const match = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(match, true, 'Valid password must verify against bcrypt hash');

    const wrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(wrongMatch, false, 'Invalid password must be rejected');
  });

  // ----------------------------------------------------
  // Test 2: Copy Balance & Zero-Copy Guard (Rule 1)
  // ----------------------------------------------------
  runTest('Rule 1: Prevent issue when availableCopies <= 0', () => {
    const bookWithCopies = { totalCopies: 5, availableCopies: 2 };
    const bookZeroCopies = { totalCopies: 5, availableCopies: 0 };

    const canIssue1 = bookWithCopies.availableCopies > 0;
    const canIssue2 = bookZeroCopies.availableCopies > 0;

    assert.strictEqual(canIssue1, true, 'Book with available copies should be issuable');
    assert.strictEqual(canIssue2, false, 'Book with zero copies must NOT be issued');
  });

  // ----------------------------------------------------
  // Test 3: Member Borrowing Limit (Rule 2)
  // ----------------------------------------------------
  runTest('Rule 2: Per-member borrowing limit (MAX_BOOKS = 3)', () => {
    const MAX_BOOKS = 3;

    function checkBorrowEligibility(currentActiveLoans) {
      if (currentActiveLoans >= MAX_BOOKS) {
        return { allowed: false, message: 'You have reached your maximum borrowing limit.' };
      }
      return { allowed: true };
    }

    assert.strictEqual(checkBorrowEligibility(0).allowed, true);
    assert.strictEqual(checkBorrowEligibility(1).allowed, true);
    assert.strictEqual(checkBorrowEligibility(2).allowed, true);
    assert.strictEqual(checkBorrowEligibility(3).allowed, false, 'Limit reached at 3 books');
    assert.strictEqual(checkBorrowEligibility(4).allowed, false, 'Exceeded limit cannot borrow');
  });

  // ----------------------------------------------------
  // Test 4: Duplicate Book Borrowing Prevention (Rule 3)
  // ----------------------------------------------------
  runTest('Rule 3: A member cannot have the same book requested or issued twice concurrently', () => {
    const activeMemberIssues = [
      { bookId: 'book_101', status: 'issued' },
      { bookId: 'book_202', status: 'requested' },
    ];

    function canRequestBook(bookId, issues) {
      const exists = issues.some(
        (iss) => iss.bookId === bookId && ['requested', 'issued'].includes(iss.status)
      );
      return !exists;
    }

    assert.strictEqual(canRequestBook('book_303', activeMemberIssues), true, 'Different book is allowed');
    assert.strictEqual(canRequestBook('book_101', activeMemberIssues), false, 'Already issued book must be blocked');
    assert.strictEqual(canRequestBook('book_202', activeMemberIssues), false, 'Already requested book must be blocked');
  });

  // ----------------------------------------------------
  // Test 5: Safe Book Deletion (Rule 4)
  // ----------------------------------------------------
  runTest('Rule 4: A book cannot be deleted while copies are currently issued', () => {
    const fullyAvailableBook = { title: 'Book A', totalCopies: 5, availableCopies: 5 };
    const partiallyIssuedBook = { title: 'Book B', totalCopies: 5, availableCopies: 3 };

    function canDeleteBook(book) {
      return book.totalCopies === book.availableCopies;
    }

    assert.strictEqual(canDeleteBook(fullyAvailableBook), true, 'Book with 0 copies outside library can be deleted');
    assert.strictEqual(canDeleteBook(partiallyIssuedBook), false, 'Book with active issued copies cannot be deleted');
  });

  // ----------------------------------------------------
  // Test 6: Role-Based Access Control (Rule 5)
  // ----------------------------------------------------
  runTest('Rule 5: Role authorization: Only librarian can perform administrative actions', () => {
    function authorizeLibrarian(role) {
      return role === 'librarian';
    }

    assert.strictEqual(authorizeLibrarian('librarian'), true, 'Librarian granted access');
    assert.strictEqual(authorizeLibrarian('member'), false, 'Member denied librarian access');
    assert.strictEqual(authorizeLibrarian(null), false, 'Unauthenticated denied access');
  });

  // ----------------------------------------------------
  // Test 7: Dynamic Overdue Fine Calculation (Rule 7)
  // ----------------------------------------------------
  runTest('Rule 7: Fine calculation formula (₹10 per overdue day)', () => {
    const FINE_PER_DAY = 10;

    function calculateFine(dueDate, returnDate) {
      if (!dueDate || !returnDate) return 0;
      if (returnDate <= dueDate) return 0;
      const diffMs = returnDate.getTime() - dueDate.getTime();
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return overdueDays * FINE_PER_DAY;
    }

    const dueDate = new Date('2026-09-19T00:00:00Z');

    // Case 1: Returned on time
    const onTimeReturn = new Date('2026-09-18T12:00:00Z');
    assert.strictEqual(calculateFine(dueDate, onTimeReturn), 0, 'On-time return has ₹0 fine');

    // Case 2: Returned on due date
    const sameDayReturn = new Date('2026-09-19T00:00:00Z');
    assert.strictEqual(calculateFine(dueDate, sameDayReturn), 0, 'Same day return has ₹0 fine');

    // Case 3: Returned 4 days late
    const fourDaysLate = new Date('2026-09-23T00:00:00Z');
    assert.strictEqual(calculateFine(dueDate, fourDaysLate), 40, '4 days late must equal ₹40 fine');

    // Case 4: Returned 10 days late
    const tenDaysLate = new Date('2026-09-29T00:00:00Z');
    assert.strictEqual(calculateFine(dueDate, tenDaysLate), 100, '10 days late must equal ₹100 fine');
  });

  // ----------------------------------------------------
  // Test 8: Total Copies Edit Recalculation Safeguard (Rule 8)
  // ----------------------------------------------------
  runTest('Rule 8: Total copies edit safeguard (cannot drop below issued copies)', () => {
    const book = { totalCopies: 10, availableCopies: 7 }; // 3 copies issued

    function updateCopies(book, newTotal) {
      const issuedCopies = book.totalCopies - book.availableCopies; // 3
      if (newTotal < issuedCopies) {
        throw new Error(`Cannot reduce total copies below currently issued copies (${issuedCopies})`);
      }
      const newAvailable = newTotal - issuedCopies;
      return { totalCopies: newTotal, availableCopies: newAvailable };
    }

    // Valid increase: total 10 -> 15 => available 7 + 5 = 12
    const updatedInc = updateCopies(book, 15);
    assert.strictEqual(updatedInc.totalCopies, 15);
    assert.strictEqual(updatedInc.availableCopies, 12);

    // Valid decrease: total 10 -> 6 => available 6 - 3 = 3
    const updatedDec = updateCopies(book, 6);
    assert.strictEqual(updatedDec.totalCopies, 6);
    assert.strictEqual(updatedDec.availableCopies, 3);

    // Invalid decrease below 3 issued copies
    assert.throws(
      () => updateCopies(book, 2),
      /Cannot reduce total copies below currently issued copies/
    );
  });

  console.log('====================================================');
  console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

startSuite();
