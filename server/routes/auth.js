import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for hardcoded admin credentials
    if (email === 'varunsiva88@gmail.com' && password === 'rockstar') {
      // Check if admin user exists, if not create one
      let admin = await User.findOne({ email });
      if (!admin) {
        admin = new User({
          name: 'Admin',
          email,
          password,
          phone: '9999999999',
          role: 'admin',
          isApproved: true
        });
        await admin.save();
      }

      const token = jwt.sign(
        { userId: admin._id, role: admin.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, studentId, department, year, phone } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { studentId }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or student ID already exists' 
      });
    }

    const user = new User({
      name,
      email,
      password,
      studentId,
      department,
      year,
      phone,
      role: 'student'
    });

    await user.save();

    res.status(201).json({ 
      message: 'Registration successful. Please wait for admin approval.' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role === 'student' && !user.isApproved) {
      return res.status(403).json({ 
        message: 'Your account is pending approval. Please contact the administrator.' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        year: user.year,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;