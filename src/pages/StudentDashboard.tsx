import React, { useState, useEffect } from 'react';
import { BookOpen, User, Clock, CheckCircle, Send, TrendingUp, Calendar, Star, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface BorrowedBook {
  _id: string;
  book: {
    _id: string;
    title: string;
    author: { name: string };
    category: { name: string };
  };
  borrowDate: string;
  dueDate: string;
  status: string;
}

interface StudentStats {
  borrowedBooks: number;
  overdueBooks: number;
  pendingRequests: number;
  totalBorrowed: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student' && user?.isApproved) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [borrowedRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/borrows/my-books'),
        axios.get('http://localhost:5000/api/dashboard/student-stats')
      ]);
      setBorrowedBooks(borrowedRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!user?.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg border border-gray-200">
          <Clock className="h-20 w-20 text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
          <p className="text-gray-600 text-lg">
            Your account is currently pending admin approval. Please check back later or contact the library administrator.
          </p>
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>What's next?</strong> An administrator will review your registration and approve your account soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Welcome back, {user?.name}!</h1>
              <p className="text-blue-100 mt-2 text-lg">
                Student ID: {user?.studentId} | {user?.department} - Year {user?.year}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                Ready to explore our digital library? Let's get started!
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Currently Borrowed</p>
                <p className="text-3xl font-bold">{stats?.borrowedBooks || 0}</p>
                <p className="text-blue-200 text-sm">Active loans</p>
              </div>
              <BookOpen className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Overdue Books</p>
                <p className="text-3xl font-bold">{stats?.overdueBooks || 0}</p>
                <p className="text-orange-200 text-sm">Need attention</p>
              </div>
              <Clock className="h-12 w-12 text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Pending Requests</p>
                <p className="text-3xl font-bold">{stats?.pendingRequests || 0}</p>
                <p className="text-purple-200 text-sm">Awaiting approval</p>
              </div>
              <Send className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Borrowed</p>
                <p className="text-3xl font-bold">{stats?.totalBorrowed || 0}</p>
                <p className="text-green-200 text-sm">All time</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-200" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Currently Borrowed Books */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
                    Currently Borrowed Books
                  </h2>
                  {borrowedBooks.length > 0 && (
                    <a
                      href="/my-books"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All →
                    </a>
                  )}
                </div>
              </div>

              {borrowedBooks.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No books borrowed</h3>
                  <p className="text-gray-600 mb-6">You haven't borrowed any books yet.</p>
                  <a
                    href="/books"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Browse Books</span>
                  </a>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {borrowedBooks.slice(0, 5).map((borrowRecord) => {
                    const daysUntilDue = getDaysUntilDue(borrowRecord.dueDate);
                    const overdue = isOverdue(borrowRecord.dueDate);
                    
                    return (
                      <div key={borrowRecord._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {borrowRecord.book.title}
                            </h3>
                            <p className="text-gray-600 mb-2">by {borrowRecord.book.author.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Borrowed: {new Date(borrowRecord.borrowDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Due: {new Date(borrowRecord.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {overdue ? (
                              <span className="px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full border border-red-200">
                                Overdue ({Math.abs(daysUntilDue)} days)
                              </span>
                            ) : daysUntilDue <= 3 ? (
                              <span className="px-3 py-1 text-sm font-semibold text-orange-800 bg-orange-100 rounded-full border border-orange-200">
                                Due soon ({daysUntilDue} days)
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full border border-green-200">
                                Active ({daysUntilDue} days left)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {borrowedBooks.length > 5 && (
                    <div className="p-4 text-center bg-gray-50">
                      <a
                        href="/my-books"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View {borrowedBooks.length - 5} more books →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <a
                  href="/books"
                  className="block w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200"
                >
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">Browse Library Catalog</p>
                      <p className="text-sm text-blue-600">Discover new books</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/my-books"
                  className="block w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200"
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">My Books & Requests</p>
                      <p className="text-sm text-green-600">Manage your library</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Library Guidelines */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 text-purple-600 mr-2" />
                Library Guidelines
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Books can be borrowed for 14 days</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Submit return requests before due date</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Maximum 3 books can be borrowed at once</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Report damaged books immediately</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Keep contact information updated</span>
                </li>
              </ul>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                    Approved
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Books Limit</span>
                  <span className="text-gray-900 font-medium">3 books</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;