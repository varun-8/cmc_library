import express from 'express';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { sendWelcomeNotification } from '../utils/notificationService.js';

const router = express.Router();

// Get all pending students (admin only)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingStudents = await User.find({ 
      role: 'student', 
      isApproved: false 
    }).select('-password').sort({ createdAt: -1 });
    
    res.json(pendingStudents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all approved students (admin only)
router.get('/approved', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const approvedStudents = await User.find({ 
      role: 'student', 
      isApproved: true 
    }).select('-password').sort({ createdAt: -1 });
    
    res.json(approvedStudents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve student (admin only)
router.patch('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send welcome notification
    await sendWelcomeNotification(user._id);

    res.json({ message: 'Student approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject student (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Student rejected and removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, department, year } = req.body;
    const updateData = { name, phone };
    
    if (req.user.role === 'student') {
      updateData.department = department;
      updateData.year = year;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;