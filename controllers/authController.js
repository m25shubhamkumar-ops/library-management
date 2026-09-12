const User = require('../models/User');

// GET /login
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login - Library Management System',
    path: '/login',
    email: '',
  });
};

// POST /login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Please enter both email and password.');
    return res.render('auth/login', {
      title: 'Login - Library Management System',
      path: '/login',
      email,
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.render('auth/login', {
        title: 'Login - Library Management System',
        path: '/login',
        email,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.render('auth/login', {
        title: 'Login - Library Management System',
        path: '/login',
        email,
      });
    }

    // Set session details
    req.session.userId = user._id;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.role = user.role;

    req.flash('success', `Welcome back, ${user.name}!`);
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'An error occurred during login. Please try again.');
    return res.redirect('/login');
  }
};

// GET /register
exports.getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Register - Library Management System',
    path: '/register',
    formData: {},
  });
};

// POST /register
exports.postRegister = async (req, res) => {
  const { name, email, password, confirmPassword, role, phone } = req.body;
  const formData = { name, email, role, phone };

  if (!name || !email || !password || !confirmPassword) {
    req.flash('error', 'Please fill in all required fields.');
    return res.render('auth/register', {
      title: 'Register - Library Management System',
      path: '/register',
      formData,
    });
  }

  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters.');
    return res.render('auth/register', {
      title: 'Register - Library Management System',
      path: '/register',
      formData,
    });
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.render('auth/register', {
      title: 'Register - Library Management System',
      path: '/register',
      formData,
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists.');
      return res.render('auth/register', {
        title: 'Register - Library Management System',
        path: '/register',
        formData,
      });
    }

    // Allow choosing role ('member' or 'librarian') for easy project demo/evaluation
    const userRole = role === 'librarian' ? 'librarian' : 'member';

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
      phone: phone ? phone.trim() : '',
    });

    await newUser.save();

    req.flash('success', 'Registration successful! You can now log in.');
    return res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'Server error during registration. Please try again.');
    return res.render('auth/register', {
      title: 'Register - Library Management System',
      path: '/register',
      formData,
    });
  }
};

// GET /logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};
