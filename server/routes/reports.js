import express from 'express';
import Book from '../models/Book.js';
import User from '../models/User.js';
import BorrowRecord from '../models/BorrowRecord.js';
import BorrowRequest from '../models/BorrowRequest.js';
import Category from '../models/Category.js';
import Author from '../models/Author.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get comprehensive reports data
router.get('/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Basic statistics
    const [
      totalBooks,
      totalStudents,
      totalBorrows,
      totalReturns,
      totalOverdue,
      totalFines,
      avgBorrowDuration
    ] = await Promise.all([
      Book.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student', isApproved: true }),
      BorrowRecord.countDocuments({ 
        borrowDate: { $gte: startDate },
        status: { $in: ['borrowed', 'returned', 'overdue'] }
      }),
      BorrowRecord.countDocuments({ 
        returnDate: { $gte: startDate },
        status: 'returned'
      }),
      BorrowRecord.countDocuments({ status: 'overdue' }),
      BorrowRecord.aggregate([
        { $match: { fineAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$fineAmount' } } }
      ]),
      BorrowRecord.aggregate([
        { $match: { status: 'returned', returnDate: { $exists: true } } },
        { $addFields: { duration: { $subtract: ['$returnDate', '$borrowDate'] } } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ])
    ]);

    // Monthly trends
    const monthlyTrends = await BorrowRecord.aggregate([
      { $match: { borrowDate: { $gte: startDate } } },
      { $group: { 
        _id: { 
          year: { $year: '$borrowDate' }, 
          month: { $month: '$borrowDate' } 
        }, 
        borrows: { $sum: 1 } 
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Category-wise statistics
    const categoryStats = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$category', 
        totalBooks: { $sum: 1 },
        totalCopies: { $sum: '$totalCopies' },
        availableCopies: { $sum: '$availableCopies' }
      }},
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' }},
      { $unwind: '$category' },
      { $project: { 
        categoryName: '$category.name', 
        totalBooks: 1, 
        totalCopies: 1, 
        availableCopies: 1 
      }}
    ]);

    // Department-wise statistics
    const departmentStats = await User.aggregate([
      { $match: { role: 'student', isApproved: true } },
      { $group: { _id: '$department', count: { $sum: 1 } }},
      { $sort: { count: -1 } }
    ]);

    // Most active students
    const activeStudents = await BorrowRecord.aggregate([
      { $group: { _id: '$user', borrowCount: { $sum: 1 } }},
      { $sort: { borrowCount: -1 }},
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' }},
      { $unwind: '$user' },
      { $project: { 
        name: '$user.name', 
        studentId: '$user.studentId', 
        department: '$user.department',
        borrowCount: 1 
      }}
    ]);

    // Book popularity
    const popularBooks = await BorrowRecord.aggregate([
      { $group: { _id: '$book', borrowCount: { $sum: 1 } }},
      { $sort: { borrowCount: -1 }},
      { $limit: 10 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' }},
      { $unwind: '$book' },
      { $project: { 
        title: '$book.title', 
        author: '$book.author',
        borrowCount: 1 
      }},
      { $lookup: { from: 'authors', localField: 'author', foreignField: '_id', as: 'author' }},
      { $unwind: '$author' },
      { $project: { 
        title: 1, 
        authorName: '$author.name',
        borrowCount: 1 
      }}
    ]);

    // Overdue analysis
    const overdueAnalysis = await BorrowRecord.aggregate([
      { $match: { status: 'overdue' } },
      { $group: { 
        _id: '$user', 
        overdueCount: { $sum: 1 },
        totalFine: { $sum: '$fineAmount' }
      }},
      { $sort: { overdueCount: -1 }},
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' }},
      { $unwind: '$user' },
      { $project: { 
        name: '$user.name', 
        studentId: '$user.studentId', 
        department: '$user.department',
        overdueCount: 1,
        totalFine: 1
      }}
    ]);

    res.json({
      period,
      startDate,
      endDate: now,
      basicStats: {
        totalBooks,
        totalStudents,
        totalBorrows,
        totalReturns,
        totalOverdue,
        totalFines: totalFines[0]?.total || 0,
        avgBorrowDuration: avgBorrowDuration[0]?.avgDuration || 0
      },
      monthlyTrends,
      categoryStats,
      departmentStats,
      activeStudents,
      popularBooks,
      overdueAnalysis
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get detailed borrowing trends
router.get('/borrowing-trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await BorrowRecord.aggregate([
      { $match: { borrowDate: { $gte: startDate } } },
      { $group: { 
        _id: { 
          date: { $dateToString: { format: '%Y-%m-%d', date: '$borrowDate' } },
          status: '$status'
        }, 
        count: { $sum: 1 } 
      }},
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({ trends, period: `${days} days` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get fine collection report
router.get('/fines', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const fineStats = await BorrowRecord.aggregate([
      { $match: { 
        fineAmount: { $gt: 0 },
        returnDate: { $gte: startDate }
      }},
      { $group: { 
        _id: { 
          year: { $year: '$returnDate' }, 
          month: { $month: '$returnDate' } 
        }, 
        totalFines: { $sum: '$fineAmount' },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const totalFines = fineStats.reduce((sum, stat) => sum + stat.totalFines, 0);
    const totalFineRecords = fineStats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      period,
      totalFines,
      totalFineRecords,
      monthlyFines: fineStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get inventory report
router.get('/inventory', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const inventory = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$category', 
        totalBooks: { $sum: 1 },
        totalCopies: { $sum: '$totalCopies' },
        availableCopies: { $sum: '$availableCopies' },
        borrowedCopies: { $sum: { $subtract: ['$totalCopies', '$availableCopies'] } }
      }},
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' }},
      { $unwind: '$category' },
      { $project: { 
        categoryName: '$category.name', 
        totalBooks: 1, 
        totalCopies: 1, 
        availableCopies: 1,
        borrowedCopies: 1,
        utilizationRate: { 
          $multiply: [
            { $divide: [{ $subtract: ['$totalCopies', '$availableCopies'] }, '$totalCopies'] },
            100
          ]
        }
      }}
    ]);

    const lowStockBooks = await Book.find({
      isActive: true,
      availableCopies: { $lte: 2 }
    }).populate('category', 'name').populate('author', 'name').limit(20);

    res.json({
      inventory,
      lowStockBooks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 