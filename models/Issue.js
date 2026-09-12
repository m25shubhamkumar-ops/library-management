const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID is required'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member ID is required'],
    },
    issueDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['requested', 'issued', 'returned', 'overdue', 'rejected'],
      default: 'requested',
    },
    fine: {
      type: Number,
      default: 0,
      min: 0,
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to compute dynamic overdue days and potential fine
issueSchema.methods.getOverdueInfo = function (finePerDay = 10) {
  const now = new Date();
  if (this.status === 'returned') {
    if (this.returnDate && this.dueDate && this.returnDate > this.dueDate) {
      const diffMs = this.returnDate.getTime() - this.dueDate.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { isOverdue: true, days, fine: days * finePerDay };
    }
    return { isOverdue: false, days: 0, fine: this.fine || 0 };
  }

  if (this.status === 'issued' && this.dueDate && now > this.dueDate) {
    const diffMs = now.getTime() - this.dueDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { isOverdue: true, days, fine: days * finePerDay };
  }

  return { isOverdue: false, days: 0, fine: 0 };
};

module.exports = mongoose.model('Issue', issueSchema);
