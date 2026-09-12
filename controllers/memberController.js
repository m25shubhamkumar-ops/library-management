const User = require('../models/User');
const Issue = require('../models/Issue');

// GET /members - Librarian views all library members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await User.find({ role: 'member' }).sort({ createdAt: -1 });

    // Fetch active loans count for each member
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        const activeCount = await Issue.countDocuments({
          member: member._id,
          status: 'issued',
        });
        const totalLoansCount = await Issue.countDocuments({
          member: member._id,
          status: { $in: ['issued', 'returned'] },
        });
        const pendingCount = await Issue.countDocuments({
          member: member._id,
          status: 'requested',
        });
        return {
          ...member.toObject(),
          activeCount,
          totalLoansCount,
          pendingCount,
        };
      })
    );

    res.render('members/allmembers', {
      title: 'Registered Members - Library Management',
      path: '/members',
      members: enrichedMembers,
    });
  } catch (err) {
    console.error('Error fetching members:', err);
    req.flash('error', 'Unable to retrieve members roster.');
    res.redirect('/dashboard');
  }
};
