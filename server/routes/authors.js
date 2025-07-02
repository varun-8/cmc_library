import express from 'express';
import Author from '../models/Author.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all authors
router.get('/', async (req, res) => {
  try {
    const authors = await Author.find({ isActive: true }).sort({ name: 1 });
    res.json(authors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new author (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const author = new Author(req.body);
    await author.save();
    res.status(201).json(author);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update author (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    res.json(author);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete author (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    res.json({ message: 'Author deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;