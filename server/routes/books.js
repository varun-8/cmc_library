import express from 'express';
import Book from '../models/Book.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all books (public)
router.get('/', async (req, res) => {
  try {
    const { category, author, search, page = 1, limit = 10 } = req.query;
    
    let query = { isActive: true };
    
    if (category) query.category = category;
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query)
      .populate('author', 'name nationality')
      .populate('category', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('author', 'name nationality biography')
      .populate('category', 'name description');
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new book (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    
    const populatedBook = await Book.findById(book._id)
      .populate('author', 'name')
      .populate('category', 'name');
    
    res.status(201).json(populatedBook);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update book (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name').populate('category', 'name');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete book (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;