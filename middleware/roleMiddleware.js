// Middleware to authorize Librarian only
const isLibrarian = (req, res, next) => {
  if (req.session && req.session.role === 'librarian') {
    return next();
  }
  req.flash('error', 'Access denied. Only Librarians can perform this operation.');
  return res.status(403).render('error', {
    title: '403 - Access Denied',
    statusCode: 403,
    message: 'Access denied: You do not have permission to access librarian resources.',
    currentUser: req.session ? { id: req.session.userId, name: req.session.name, role: req.session.role } : null,
  });
};

// Middleware to authorize Member only
const isMember = (req, res, next) => {
  if (req.session && req.session.role === 'member') {
    return next();
  }
  req.flash('error', 'This feature is reserved for library members.');
  return res.redirect('/dashboard');
};

module.exports = {
  isLibrarian,
  isMember,
};
