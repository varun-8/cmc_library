import express from 'express';
import BorrowRequest from '../models/BorrowRequest.js';
import BorrowRecord from '../models/BorrowRecord.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';
import { authenticateToken, requireAdmin, requireApproved } from '../middleware/auth.js';

const router = express.Router();

// Create borrow request
router.post('/borrow', authenticateToken, requireApproved, async (req, res) => {
  try {
    const { bookId, notes } = req.body;
    const userId = req.user._id;

    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book || book.availableCopies === 0) {
      return res.status(400).json({ message: 'Book not available' });
    }

    // Check if user already has a pending request for this book
    const existingRequest = await BorrowRequest.findOne({
      user: userId,
      book: bookId,
      requestType: 'borrow',
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending borrow request for this book' });
    }

    // Check if user already has this book borrowed
    const existingBorrow = await BorrowRecord.findOne({
      user: userId,
      book: bookId,
      status: 'borrowed'
    });

    if (existingBorrow) {
      return res.status(400).json({ message: 'You already have this book borrowed' });
    }

    // Create borrow request
    const borrowRequest = new BorrowRequest({
      user: userId,
      book: bookId,
      requestType: 'borrow',
      notes
    });

    await borrowRequest.save();

    const populatedRequest = await BorrowRequest.findById(borrowRequest._id)
      .populate('user', 'name studentId email')
      .populate('book', 'title author')
      .populate({
        path: 'book',
        populate: {
          path: 'author',
          select: 'name'
        }
      });

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create return request
router.post('/return', authenticateToken, requireApproved, async (req, res) => {
  try {
    const { borrowRecordId, notes } = req.body;
    const userId = req.user._id;

    // Check if borrow record exists and belongs to user
    const borrowRecord = await BorrowRecord.findOne({
      _id: borrowRecordId,
      user: userId,
      status: { $in: ['borrowed', 'overdue'] }
    });

    if (!borrowRecord) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    // Check if there's already a pending return request
    const existingRequest = await BorrowRequest.findOne({
      user: userId,
      book: borrowRecord.book,
      requestType: 'return',
      status: 'pending',
      borrowRecordId
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending return request for this book' });
    }

    // Create return request
    const returnRequest = new BorrowRequest({
      user: userId,
      book: borrowRecord.book,
      requestType: 'return',
      borrowRecordId,
      notes
    });

    await returnRequest.save();

    const populatedRequest = await BorrowRequest.findById(returnRequest._id)
      .populate('user', 'name studentId email')
      .populate('book', 'title author')
      .populate({
        path: 'book',
        populate: {
          path: 'author',
          select: 'name'
        }
      });

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending requests (admin only)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requests = await BorrowRequest.find({ status: 'pending' })
      .populate('user', 'name studentId email department year')
      .populate('book', 'title author isbn')
      .populate({
        path: 'book',
        populate: {
          path: 'author',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's requests
router.get('/my-requests', authenticateToken, requireApproved, async (req, res) => {
  try {
    const requests = await BorrowRequest.find({ user: req.user._id })
      .populate('book', 'title author isbn')
      .populate({
        path: 'book',
        populate: {
          path: 'author',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject request (admin only)
router.patch('/:id/:action', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, action } = req.params;
    const { adminResponse } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await BorrowRequest.findById(id)
      .populate('user', 'name studentId email')
      .populate('book', 'title author');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.adminResponse = adminResponse;
    request.processedBy = req.user._id;
    request.processedAt = new Date();

    if (action === 'approve') {
      if (request.requestType === 'borrow') {
        // Create borrow record
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 2 weeks

        const borrowRecord = new BorrowRecord({
          user: request.user._id,
          book: request.book._id,
          dueDate
        });

        await borrowRecord.save();

        // Update book availability
        const book = await Book.findById(request.book._id);
        book.availableCopies -= 1;
        await book.save();

        request.borrowRecordId = borrowRecord._id;

        // Create notification for user
        await new Notification({
          user: request.user._id,
          title: 'Borrow Request Approved',
          message: `Your request to borrow "${request.book.title}" has been approved. Due date: ${dueDate.toLocaleDateString()}`,
          type: 'success',
          relatedBook: request.book._id,
          relatedRequest: request._id
        }).save();

      } else if (request.requestType === 'return') {
        // Update borrow record
        const borrowRecord = await BorrowRecord.findById(request.borrowRecordId);
        if (borrowRecord) {
          borrowRecord.status = 'returned';
          borrowRecord.returnDate = new Date();
          await borrowRecord.save();

          // Update book availability
          const book = await Book.findById(request.book._id);
          book.availableCopies += 1;
          await book.save();
        }

        // Create notification for user
        await new Notification({
          user: request.user._id,
          title: 'Return Request Approved',
          message: `Your return of "${request.book.title}" has been processed successfully.`,
          type: 'success',
          relatedBook: request.book._id,
          relatedRequest: request._id
        }).save();
      }
    } else {
      // Create notification for rejection
      await new Notification({
        user: request.user._id,
        title: `${request.requestType === 'borrow' ? 'Borrow' : 'Return'} Request Rejected`,
        message: `Your ${request.requestType} request for "${request.book.title}" has been rejected. ${adminResponse || ''}`,
        type: 'error',
        relatedBook: request.book._id,
        relatedRequest: request._id
      }).save();
    }

    await request.save();

    res.json({ message: `Request ${action}d successfully`, request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;