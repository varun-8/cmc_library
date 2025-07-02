import Notification from '../models/Notification.js';
import BorrowRecord from '../models/BorrowRecord.js';
import User from '../models/User.js';

// Create due date reminder notifications
export const createDueDateReminders = async () => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Find books due in 3 days
    const booksDueIn3Days = await BorrowRecord.find({
      status: 'borrowed',
      dueDate: {
        $gte: new Date(threeDaysFromNow.setHours(0, 0, 0, 0)),
        $lt: new Date(threeDaysFromNow.setHours(23, 59, 59, 999))
      }
    }).populate('user book');

    // Find books due tomorrow
    const booksDueTomorrow = await BorrowRecord.find({
      status: 'borrowed',
      dueDate: {
        $gte: new Date(oneDayFromNow.setHours(0, 0, 0, 0)),
        $lt: new Date(oneDayFromNow.setHours(23, 59, 59, 999))
      }
    }).populate('user book');

    // Create notifications for books due in 3 days
    for (const record of booksDueIn3Days) {
      const existingNotification = await Notification.findOne({
        user: record.user._id,
        relatedBook: record.book._id,
        type: 'due_reminder',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      if (!existingNotification) {
        await new Notification({
          user: record.user._id,
          title: 'Book Due Soon',
          message: `"${record.book.title}" is due in 3 days (${record.dueDate.toLocaleDateString()}). Please plan to return it on time.`,
          type: 'due_reminder',
          relatedBook: record.book._id
        }).save();
      }
    }

    // Create notifications for books due tomorrow
    for (const record of booksDueTomorrow) {
      const existingNotification = await Notification.findOne({
        user: record.user._id,
        relatedBook: record.book._id,
        type: 'due_reminder',
        createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } // Last 12 hours
      });

      if (!existingNotification) {
        await new Notification({
          user: record.user._id,
          title: 'Book Due Tomorrow!',
          message: `"${record.book.title}" is due tomorrow (${record.dueDate.toLocaleDateString()}). Please return it to avoid late fees.`,
          type: 'warning',
          relatedBook: record.book._id
        }).save();
      }
    }

    console.log(`Created due date reminders: ${booksDueIn3Days.length + booksDueTomorrow.length} notifications`);
  } catch (error) {
    console.error('Error creating due date reminders:', error);
  }
};

// Create overdue notifications
export const createOverdueNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find overdue books
    const overdueBooks = await BorrowRecord.find({
      status: 'borrowed',
      dueDate: { $lt: today }
    }).populate('user book');

    for (const record of overdueBooks) {
      // Update status to overdue
      record.status = 'overdue';
      await record.save();

      // Check if overdue notification already sent today
      const existingNotification = await Notification.findOne({
        user: record.user._id,
        relatedBook: record.book._id,
        type: 'overdue',
        createdAt: { $gte: today }
      });

      if (!existingNotification) {
        const daysOverdue = Math.floor((today - record.dueDate) / (1000 * 60 * 60 * 24));
        
        await new Notification({
          user: record.user._id,
          title: 'Book Overdue!',
          message: `"${record.book.title}" is ${daysOverdue} day(s) overdue. Please return it immediately to avoid additional fees.`,
          type: 'overdue',
          relatedBook: record.book._id
        }).save();
      }
    }

    console.log(`Created overdue notifications: ${overdueBooks.length} books marked as overdue`);
  } catch (error) {
    console.error('Error creating overdue notifications:', error);
  }
};

// Send welcome notification to new approved students
export const sendWelcomeNotification = async (userId) => {
  try {
    await new Notification({
      user: userId,
      title: 'Welcome to the Library!',
      message: 'Your account has been approved. You can now browse and borrow books from our collection.',
      type: 'success'
    }).save();
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
};