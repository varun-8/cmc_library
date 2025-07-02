import express from 'express';
import Book from '../models/Book.js';
import User from '../models/User.js';
import BorrowRecord from '../models/BorrowRecord.js';
import BorrowRequest from '../models/BorrowRequest.js';
import Category from '../models/Category.js';
import Author from '../models/Author.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalBooks,
      totalStudents,
      pendingApprovals,
      borrowedBooks,
      overdueBooksCount,
      totalCategories,
      totalAuthors,
      pendingRequests,
      recentBorrows,
      popularBooks
    ] = await Promise.all([
      Book.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student', isApproved: true }),
      User.countDocuments({ role: 'student', isApproved: false }),
      BorrowRecord.countDocuments({ status: { $in: ['borrowed', 'overdue'] } }),
      BorrowRecord.countDocuments({ status: 'overdue' }),
      Category.countDocuments({ isActive: true }),
      Author.countDocuments({ isActive: true }),
      BorrowRequest.countDocuments({ status: 'pending' }),
      BorrowRecord.find({ status: { $in: ['borrowed', 'overdue'] } })
        .populate('user', 'name studentId')
        .populate('book', 'title')
        .sort({ borrowDate: -1 })
        .limit(5),
      BorrowRecord.aggregate([
        { $match: { status: { $in: ['borrowed', 'returned', 'overdue'] } } },
        { $group: { _id: '$book', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
        { $unwind: '$book' },
        { $project: { title: '$book.title', count: 1 } }
      ])
    ]);

    const availableBooks = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$availableCopies' } } }
    ]);

    res.json({
      totalBooks,
      availableBooks: availableBooks[0]?.total || 0,
      totalStudents,
      pendingApprovals,
      borrowedBooks,
      overdueBooksCount,
      totalCategories,
      totalAuthors,
      pendingRequests,
      recentBorrows,
      popularBooks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student dashboard stats
router.get('/student-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [
      borrowedBooks,
      overdueBooks,
      pendingRequests,
      totalBorrowed
    ] = await Promise.all([
      BorrowRecord.countDocuments({ 
        user: req.user._id, 
        status: { $in: ['borrowed', 'overdue'] } 
      }),
      BorrowRecord.countDocuments({ 
        user: req.user._id, 
        status: 'overdue' 
      }),
      BorrowRequest.countDocuments({ 
        user: req.user._id, 
        status: 'pending' 
      }),
      BorrowRecord.countDocuments({ 
        user: req.user._id 
      })
    ]);

    res.json({
      borrowedBooks,
      overdueBooks,
      pendingRequests,
      totalBorrowed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;