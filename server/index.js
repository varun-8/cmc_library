import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import categoryRoutes from './routes/categories.js';
import authorRoutes from './routes/authors.js';
import userRoutes from './routes/users.js';
import borrowRoutes from './routes/borrows.js';
import dashboardRoutes from './routes/dashboard.js';
import requestRoutes from './routes/requests.js';
import notificationRoutes from './routes/notifications.js';
import { createDueDateReminders, createOverdueNotifications } from './utils/notificationService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://varun:root@library.lrkhwty.mongodb.net/coimbatore_medical_library';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Schedule notification tasks
setInterval(() => {
  createDueDateReminders();
  createOverdueNotifications();
}, 60 * 60 * 1000); // Run every hour

// Run notification tasks on startup
setTimeout(() => {
  createDueDateReminders();
  createOverdueNotifications();
}, 5000); // Run 5 seconds after startup

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});