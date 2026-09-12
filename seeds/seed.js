require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Book = require('../models/Book');
const Issue = require('../models/Issue');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_db';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      Issue.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Admin@123', salt);
    const memberHash = await bcrypt.hash('Member@123', salt);

    const [librarian, memberJohn, memberEmma, memberDavid] = await User.create([
      {
        name: 'Chief Librarian Sarah',
        email: 'librarian@library.com',
        password: adminHash,
        role: 'librarian',
        phone: '+91 9876543200',
      },
      {
        name: 'John Doe',
        email: 'john@member.com',
        password: memberHash,
        role: 'member',
        phone: '+91 9876543210',
      },
      {
        name: 'Emma Watson',
        email: 'emma@member.com',
        password: memberHash,
        role: 'member',
        phone: '+91 9876543211',
      },
      {
        name: 'David Miller',
        email: 'david@member.com',
        password: memberHash,
        role: 'member',
        phone: '+91 9876543212',
      },
    ]);

    console.log('[Seed] Creating catalog books...');
    const books = await Book.create([
      {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        ISBN: '9780061122415',
        category: 'Fiction',
        totalCopies: 5,
        availableCopies: 4, // 1 copy issued
        borrowCount: 50,
        publishedYear: 1988,
        description:
          'A magical story about Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure as extravagant as any ever found.',
      },
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        ISBN: '9780735211292',
        category: 'Self-Help',
        totalCopies: 6,
        availableCopies: 5, // 1 copy issued (overdue demo)
        borrowCount: 42,
        publishedYear: 2018,
        description:
          'An easy and proven framework for improving every day, focusing on tiny changes that lead to remarkable results.',
      },
      {
        title: "Harry Potter and the Sorcerer's Stone",
        author: 'J.K. Rowling',
        ISBN: '9780590353427',
        category: 'Fiction',
        totalCopies: 8,
        availableCopies: 8,
        borrowCount: 38,
        publishedYear: 1997,
        description:
          'The story of Harry Potter, an orphaned boy who discovers on his eleventh birthday that he is a wizard and attends Hogwarts School.',
      },
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        ISBN: '9780132350884',
        category: 'Science & Tech',
        totalCopies: 4,
        availableCopies: 4,
        borrowCount: 31,
        publishedYear: 2008,
        description:
          'A code craftsman explains best practices for writing clean, readable, and maintainable software with real-world refactoring examples.',
      },
      {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        ISBN: '9780062316097',
        category: 'History',
        totalCopies: 5,
        availableCopies: 5,
        borrowCount: 29,
        publishedYear: 2014,
        description:
          'Dr. Harari surveys human history from the Stone Age up to the twenty-first century, exploring biology, culture, and capitalism.',
      },
      {
        title: 'Meditations',
        author: 'Marcus Aurelius',
        ISBN: '9780140449334',
        category: 'Philosophy',
        totalCopies: 3,
        availableCopies: 3,
        borrowCount: 22,
        publishedYear: 180,
        description:
          'A series of personal writings by Roman Emperor Marcus Aurelius recording private notes to himself and Stoic philosophy.',
      },
      {
        title: 'Steve Jobs',
        author: 'Walter Isaacson',
        ISBN: '9781451648539',
        category: 'Biography',
        totalCopies: 4,
        availableCopies: 4,
        borrowCount: 18,
        publishedYear: 2011,
        description:
          'The definitive biography of Apple co-founder Steve Jobs, based on more than forty interviews with Jobs conducted over two years.',
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        ISBN: '9780060935467',
        category: 'Literature',
        totalCopies: 5,
        availableCopies: 5,
        borrowCount: 25,
        publishedYear: 1960,
        description:
          'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
      },
      {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        ISBN: '9780553380163',
        category: 'Science & Tech',
        totalCopies: 4,
        availableCopies: 4,
        borrowCount: 15,
        publishedYear: 1988,
        description:
          'A landmark volume in science writing by one of the great minds of our time, exploring black holes, space, and time.',
      },
      {
        title: '1984',
        author: 'George Orwell',
        ISBN: '9780451524935',
        category: 'Fiction',
        totalCopies: 5,
        availableCopies: 5,
        borrowCount: 34,
        publishedYear: 1949,
        description:
          'A chilling prophecy about the future and totalitarian surveillance featuring Big Brother and the Ministry of Truth.',
      },
    ]);

    console.log('[Seed] Creating demo lending records and requests...');
    const now = new Date();

    // 1. On-time active issue (John Doe - The Alchemist)
    const issueDate1 = new Date(now);
    issueDate1.setDate(issueDate1.getDate() - 2);
    const dueDate1 = new Date(issueDate1);
    dueDate1.setDate(dueDate1.getDate() + 7);

    // 2. Overdue active issue (Emma Watson - Atomic Habits, overdue by 4 days)
    const issueDate2 = new Date(now);
    issueDate2.setDate(issueDate2.getDate() - 11);
    const dueDate2 = new Date(issueDate2);
    dueDate2.setDate(dueDate2.getDate() + 7); // was due 4 days ago!

    // 3. Returned issue with settled fine (David Miller - Clean Code)
    const issueDate3 = new Date(now);
    issueDate3.setDate(issueDate3.getDate() - 20);
    const dueDate3 = new Date(issueDate3);
    dueDate3.setDate(dueDate3.getDate() + 7);
    const returnDate3 = new Date(dueDate3);
    returnDate3.setDate(returnDate3.getDate() + 2); // returned 2 days late = ₹20 fine

    await Issue.create([
      {
        book: books[0]._id, // The Alchemist
        member: memberJohn._id,
        issueDate: issueDate1,
        dueDate: dueDate1,
        returnDate: null,
        status: 'issued',
        fine: 0,
      },
      {
        book: books[1]._id, // Atomic Habits
        member: memberEmma._id,
        issueDate: issueDate2,
        dueDate: dueDate2,
        returnDate: null,
        status: 'issued',
        fine: 0, // dynamic overdue calculated on dashboard / return
      },
      {
        book: books[3]._id, // Clean Code
        member: memberDavid._id,
        issueDate: issueDate3,
        dueDate: dueDate3,
        returnDate: returnDate3,
        status: 'returned',
        fine: 20,
      },
      {
        book: books[2]._id, // Harry Potter
        member: memberJohn._id,
        status: 'requested',
      },
    ]);

    console.log('--------------------------------------------------');
    console.log('✅ Database seeded successfully with demo data!');
    console.log('--------------------------------------------------');
    console.log('Librarian Login:');
    console.log('  Email:    librarian@library.com');
    console.log('  Password: Admin@123');
    console.log('Member Login:');
    console.log('  Email:    john@member.com');
    console.log('  Password: Member@123');
    console.log('--------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
