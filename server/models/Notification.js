import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'due_reminder', 'overdue', 'request_update'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BorrowRequest'
  },
  actionUrl: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', notificationSchema);