import mongoose from 'mongoose';

const borrowRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  requestType: {
    type: String,
    enum: ['borrow', 'return'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  adminResponse: {
    type: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  borrowRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BorrowRecord'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('BorrowRequest', borrowRequestSchema);