import express from 'express';
import BorrowRecord from '../models/BorrowRecord.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { authenticateToken, requireApproved } from '../middleware/auth.js';

const router = express.Router();

// Borrow a book
router.post('/', authenticateToken, requireApproved, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user._id;

    const book = await Book.findById(bookId);
    if (!book || book.availableCopies === 0) {
      return res.status(400).json({ message: 'Book not available' });
    }

    // Check if user already has this book
    const existingBorrow = await BorrowRecord.findOne({
      user: userId,
      book: bookId,
      status: 'borrowed'
    });

    if (existingBorrow) {
      return res.status(400).json({ message: 'You already have this book borrowed' });
    }

    // Create borrow record
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 2 weeks

    const borrowRecord = new BorrowRecord({
      user: userId,
      book: bookId,
      dueDate
    });

    await borrowRecord.save();

    // Update book availability
    book.availableCopies -= 1;
    await book.save();

    const populatedRecord = await BorrowRecord.findById(borrowRecord._id)
      .populate('book', 'title author')
      .populate({
        path: 'book',
        populate: {
          path: 'author',
          select: 'name'
        }
      });

    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's borrowed books
router.get('/my-books', authenticateToken, requireApproved, async (req, res) => {
  try {
    const borrowedBooks = await BorrowRecord.find({
      user: req.user._id,
      status: { $in: ['borrowed', 'overdue'] }
    }).populate({
      path: 'book',
      populate: {
        path: 'author category',
        select: 'name'
      }
    }).sort({ borrowDate: -1 });

    res.json(borrowedBooks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Return a book
router.patch('/:id/return', authenticateToken, requireApproved, async (req, res) => {
  try {
    const borrowRecord = await BorrowRecord.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: { $in: ['borrowed', 'overdue'] }
    });

    if (!borrowRecord) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    borrowRecord.status = 'returned';
    borrowRecord.returnDate = new Date();
    await borrowRecord.save();

    // Update book availability
    const book = await Book.findById(borrowRecord.book);
    book.availableCopies += 1;
    await book.save();

    res.json({ message: 'Book returned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;