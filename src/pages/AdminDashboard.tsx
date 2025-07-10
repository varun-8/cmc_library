import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  Clock, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Check,
  X,
  Send,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Star,
  Filter,
  Download,
  Eye,
  MessageSquare,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  BookMarked,
  Library,
  GraduationCap,
  Clock3,
  TrendingDown,
  FileText,
  Printer
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { saveAs } from 'file-saver';

interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  totalStudents: number;
  pendingApprovals: number;
  borrowedBooks: number;
  overdueBooksCount: number;
  totalCategories: number;
  totalAuthors: number;
  pendingRequests: number;
  recentBorrows: any[];
  popularBooks: any[];
}

interface Book {
  _id: string;
  title: string;
  author: { _id: string; name: string };
  category: { _id: string; name: string };
  isbn: string;
  totalCopies: number;
  availableCopies: number;
  publisher: string;
  publishedYear: number;
  description: string;
  location: string;
  pages: number;
}

interface Author {
  _id: string;
  name: string;
  nationality: string;
  biography: string;
  specialization: string[];
}

interface Category {
  _id: string;
  name: string;
  code: string;
  description: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: number;
  phone: string;
}

interface BorrowRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    studentId: string;
    email: string;
    department: string;
    year: number;
  };
  book: {
    _id: string;
    title: string;
    author: { name: string };
    isbn: string;
  };
  requestType: 'borrow' | 'return';
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  notes?: string;
  borrowRecordId?: string;
}

interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  basicStats: {
    totalBooks: number;
    totalStudents: number;
    totalBorrows: number;
    totalReturns: number;
    totalOverdue: number;
    totalFines: number;
    avgBorrowDuration: number;
  };
  monthlyTrends: Array<{
    _id: { year: number; month: number };
    borrows: number;
  }>;
  categoryStats: Array<{
    categoryName: string;
    totalBooks: number;
    totalCopies: number;
    availableCopies: number;
  }>;
  departmentStats: Array<{
    _id: string;
    count: number;
  }>;
  activeStudents: Array<{
    name: string;
    studentId: string;
    department: string;
    borrowCount: number;
  }>;
  popularBooks: Array<{
    title: string;
    authorName: string;
    borrowCount: number;
  }>;
  overdueAnalysis: Array<{
    name: string;
    studentId: string;
    department: string;
    overdueCount: number;
    totalFine: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [approvedStudents, setApprovedStudents] = useState<Student[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Form states
  const [showBookForm, setShowBookForm] = useState(false);
  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '', author: '', category: '', isbn: '', description: '',
    publisher: '', publishedYear: '', totalCopies: '', location: '', pages: ''
  });
  const [authorForm, setAuthorForm] = useState({
    name: '', nationality: '', biography: '', specialization: ''
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '', code: '', description: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Reports state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports' && !reportData) {
      fetchReportsData(reportPeriod);
    }
  }, [activeTab, reportData, reportPeriod]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, booksRes, authorsRes, categoriesRes, pendingRes, approvedRes, requestsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats'),
        axios.get('http://localhost:5000/api/books'),
        axios.get('http://localhost:5000/api/authors'),
        axios.get('http://localhost:5000/api/categories'),
        axios.get('http://localhost:5000/api/users/pending'),
        axios.get('http://localhost:5000/api/users/approved'),
        axios.get('http://localhost:5000/api/requests/pending')
      ]);

      setStats(statsRes.data);
      setBooks(booksRes.data.books);
      setAuthors(authorsRes.data);
      setCategories(categoriesRes.data);
      setPendingStudents(pendingRes.data);
      setApprovedStudents(approvedRes.data);
      setPendingRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsData = async (period: string = 'month') => {
    setReportsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/reports/overview?period=${period}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    setReportPeriod(period);
    fetchReportsData(period);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/books/${editingId}`, {
          ...bookForm,
          publishedYear: parseInt(bookForm.publishedYear),
          totalCopies: parseInt(bookForm.totalCopies),
          pages: parseInt(bookForm.pages)
        });
      } else {
        await axios.post('http://localhost:5000/api/books', {
          ...bookForm,
          publishedYear: parseInt(bookForm.publishedYear),
          totalCopies: parseInt(bookForm.totalCopies),
          availableCopies: parseInt(bookForm.totalCopies),
          pages: parseInt(bookForm.pages)
        });
      }
      setShowBookForm(false);
      setBookForm({
        title: '', author: '', category: '', isbn: '', description: '',
        publisher: '', publishedYear: '', totalCopies: '', location: '', pages: ''
      });
      setEditingId(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding/updating book:', error);
    }
  };

  const handleAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/authors/${editingId}`, {
          ...authorForm,
          specialization: authorForm.specialization.split(',').map(s => s.trim())
        });
      } else {
        await axios.post('http://localhost:5000/api/authors', {
          ...authorForm,
          specialization: authorForm.specialization.split(',').map(s => s.trim())
        });
      }
      setShowAuthorForm(false);
      setAuthorForm({ name: '', nationality: '', biography: '', specialization: '' });
      setEditingId(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding/updating author:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/categories/${editingId}`, categoryForm);
      } else {
        await axios.post('http://localhost:5000/api/categories', categoryForm);
      }
      setShowCategoryForm(false);
      setCategoryForm({ name: '', code: '', description: '' });
      setEditingId(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding/updating category:', error);
    }
  };

  const handleApproveStudent = async (studentId: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/users/${studentId}/approve`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving student:', error);
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${studentId}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting student:', error);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingRequest(requestId);
    try {
      await axios.patch(`http://localhost:5000/api/requests/${requestId}/${action}`, {
        adminResponse
      });
      setShowRequestModal(false);
      setSelectedRequest(null);
      setAdminResponse('');
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.message || `Error ${action}ing request`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const openRequestModal = (request: BorrowRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleEditBook = (book: Book) => {
    setBookForm({
      title: book.title,
      author: book.author._id,
      category: book.category._id,
      isbn: book.isbn,
      description: book.description || '',
      publisher: book.publisher || '',
      publishedYear: book.publishedYear.toString(),
      totalCopies: book.totalCopies.toString(),
      location: book.location || '',
      pages: book.pages?.toString() || ''
    });
    setEditingId(book._id);
    setShowBookForm(true);
  };

  const handleEditAuthor = (author: Author) => {
    setAuthorForm({
      name: author.name,
      nationality: author.nationality,
      biography: author.biography,
      specialization: author.specialization?.join(', ') || ''
    });
    setEditingId(author._id);
    setShowAuthorForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      code: category.code,
      description: category.description
    });
    setEditingId(category._id);
    setShowCategoryForm(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    setProcessingAction(`delete-book-${bookId}`);
    try {
      await axios.delete(`http://localhost:5000/api/books/${bookId}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting book:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeleteAuthor = async (authorId: string) => {
    if (!window.confirm('Are you sure you want to delete this author?')) return;
    setProcessingAction(`delete-author-${authorId}`);
    try {
      await axios.delete(`http://localhost:5000/api/authors/${authorId}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting author:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setProcessingAction(`delete-category-${categoryId}`);
    try {
      await axios.delete(`http://localhost:5000/api/categories/${categoryId}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    setProcessingAction(`delete-student-${studentId}`);
    try {
      await axios.delete(`http://localhost:5000/api/users/${studentId}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting student:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? book.category?._id === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleExportBooks = () => {
    const headers = ['Title', 'Author', 'Category', 'Available Copies', 'Total Copies', 'ISBN', 'Publisher', 'Published Year'];
    const rows = filteredBooks.map(book => [
      book.title,
      book.author?.name,
      book.category?.name,
      book.availableCopies,
      book.totalCopies,
      book.isbn,
      book.publisher,
      book.publishedYear
    ]);
    let csvContent = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'books.csv');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage your library system with powerful tools</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BookOpen },
              { id: 'requests', name: 'Requests', icon: Send, badge: stats?.pendingRequests },
              { id: 'books', name: 'Books', icon: BookOpen },
              { id: 'authors', name: 'Authors', icon: Users },
              { id: 'categories', name: 'Categories', icon: BookOpen },
              { id: 'students', name: 'Students', icon: Users, badge: stats?.pendingApprovals },
              { id: 'reports', name: 'Reports', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Books</p>
                    <p className="text-3xl font-bold">{stats.totalBooks}</p>
                    <p className="text-blue-200 text-xs mt-1">In library collection</p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
                    <BookOpen className="h-8 w-8 text-blue-200" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Available Books</p>
                    <p className="text-3xl font-bold">{stats.availableBooks}</p>
                    <p className="text-green-200 text-xs mt-1">Ready for borrowing</p>
                  </div>
                  <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
                    <Check className="h-8 w-8 text-green-200" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold">{stats.totalStudents}</p>
                    <p className="text-purple-200 text-xs mt-1">Registered users</p>
                  </div>
                  <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
                    <Users className="h-8 w-8 text-purple-200" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Pending Requests</p>
                    <p className="text-3xl font-bold">{stats.pendingRequests}</p>
                    <p className="text-orange-200 text-xs mt-1">Awaiting approval</p>
                  </div>
                  <div className="bg-orange-400 bg-opacity-30 p-3 rounded-full">
                    <Clock className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div className="space-y-4">
                  {stats.recentBorrows.map((borrow, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{borrow.user?.name}</p>
                          <p className="text-sm text-gray-600">{borrow.book?.title}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {new Date(borrow.borrowDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Popular Books</h3>
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="space-y-4">
                  {stats.popularBooks.map((book, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <span className="text-yellow-600 font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{book.title}</p>
                          <p className="text-sm text-gray-600">{book.count} borrows</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Pending Requests</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{pendingRequests.length} pending requests</span>
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">All requests have been processed</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Book
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-2 rounded-full mr-3">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{request.user.name}</div>
                                <div className="text-sm text-gray-500">{request.user.studentId}</div>
                                <div className="text-xs text-gray-400">{request.user.department} - Year {request.user.year}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{request.book.title}</div>
                            <div className="text-sm text-gray-500">by {request.book.author.name}</div>
                            <div className="text-xs text-gray-400">ISBN: {request.book.isbn}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.requestType === 'borrow' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {request.requestType === 'borrow' ? 'Borrow' : 'Return'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(request.requestDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openRequestModal(request)}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors flex items-center space-x-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>Review</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Books Management</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setShowBookForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Book</span>
                </button>
                <button
                  onClick={handleExportBooks}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-green-700 transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0 mb-4">
              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64"
              />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Add/Edit Book Form */}
            {showBookForm && (
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-6 text-gray-900">
                  {editingId ? 'Edit Book' : 'Add New Book'}
                </h3>
                <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    placeholder="Book Title"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <select
                    value={bookForm.author}
                    onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Select Author</option>
                    {authors.map(author => (
                      <option key={author._id} value={author._id}>{author.name}</option>
                    ))}
                  </select>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({...bookForm, category: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="ISBN"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Publisher"
                    value={bookForm.publisher}
                    onChange={(e) => setBookForm({...bookForm, publisher: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Published Year"
                    value={bookForm.publishedYear}
                    onChange={(e) => setBookForm({...bookForm, publishedYear: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Total Copies"
                    value={bookForm.totalCopies}
                    onChange={(e) => setBookForm({...bookForm, totalCopies: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={bookForm.location}
                    onChange={(e) => setBookForm({...bookForm, location: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Pages"
                    value={bookForm.pages}
                    onChange={(e) => setBookForm({...bookForm, pages: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={bookForm.description}
                    onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                    className="border border-gray-300 rounded-lg px-4 py-3 md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                    required
                  />
                  <div className="md:col-span-2 flex space-x-3">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                    >
                      {editingId ? 'Update Book' : 'Add Book'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBookForm(false)}
                      className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Books List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available/Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ISBN
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBooks.map((book) => (
                      <tr key={book._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">{book.publisher}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {book.author?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {book.category?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              book.availableCopies > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {book.availableCopies}/{book.totalCopies}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {book.isbn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditBook(book)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md flex items-center space-x-1 hover:bg-blue-100 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book._id)}
                              disabled={processingAction === `delete-book-${book._id}`}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md flex items-center space-x-1 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>
                                {processingAction === `delete-book-${book._id}` ? 'Deleting...' : 'Delete'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Authors Tab */}
        {activeTab === 'authors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Authors Management</h2>
              <button
                onClick={() => {
                  setEditingId(null);
                  setShowAuthorForm(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Add Author</span>
              </button>
            </div>

            {/* Add/Edit Author Form */}
            {showAuthorForm && (
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-6 text-gray-900">
                  {editingId ? 'Edit Author' : 'Add New Author'}
                </h3>
                <form onSubmit={handleAddAuthor} className="space-y-6">
                  <input
                    type="text"
                    placeholder="Author Name"
                    value={authorForm.name}
                    onChange={(e) => setAuthorForm({...authorForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Nationality"
                    value={authorForm.nationality}
                    onChange={(e) => setAuthorForm({...authorForm, nationality: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Specialization (comma-separated)"
                    value={authorForm.specialization}
                    onChange={(e) => setAuthorForm({...authorForm, specialization: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <textarea
                    placeholder="Biography"
                    value={authorForm.biography}
                    onChange={(e) => setAuthorForm({...authorForm, biography: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={4}
                    required
                  />
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                    >
                      {editingId ? 'Update Author' : 'Add Author'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAuthorForm(false)}
                      className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Authors List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authors.map((author) => (
                <div key={author._id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{author.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAuthor(author)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAuthor(author._id)}
                        disabled={processingAction === `delete-author-${author._id}`}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Nationality: <span className="font-medium">{author.nationality}</span></p>
                  {author.specialization && author.specialization.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Specialization:</p>
                      <div className="flex flex-wrap gap-2">
                        {author.specialization.map((spec, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-3">{author.biography}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Categories Management</h2>
              <button
                onClick={() => {
                  setEditingId(null);
                  setShowCategoryForm(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Add Category</span>
              </button>
            </div>

            {/* Add/Edit Category Form */}
            {showCategoryForm && (
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-6 text-gray-900">
                  {editingId ? 'Edit Category' : 'Add New Category'}
                </h3>
                <form onSubmit={handleAddCategory} className="space-y-6">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category Code"
                    value={categoryForm.code}
                    onChange={(e) => setCategoryForm({...categoryForm, code: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                    required
                  />
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                    >
                      {editingId ? 'Update Category' : 'Add Category'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category._id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                        {category.code}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        disabled={processingAction === `delete-category-${category._id}`}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Student Management</h2>
            
            {/* Pending Approvals */}
            {pendingStudents.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <AlertTriangle className="h-6 w-6 text-orange-500 mr-2" />
                    Pending Approvals ({pendingStudents.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingStudents.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.studentId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Year {student.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleApproveStudent(student._id)}
                              className="text-green-600 hover:text-green-900 bg-green-50 px-4 py-2 rounded-lg flex items-center space-x-1 hover:bg-green-100 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectStudent(student._id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-4 py-2 rounded-lg flex items-center space-x-1 hover:bg-red-100 transition-colors"
                            >
                              <X className="h-4 w-4" />
                              <span>Reject</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Approved Students */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <UserCheck className="h-6 w-6 text-green-500 mr-2" />
                  Approved Students ({approvedStudents.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvedStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Year {student.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteStudent(student._id)}
                            disabled={processingAction === `delete-student-${student._id}`}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md flex items-center space-x-1 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>
                              {processingAction === `delete-student-${student._id}` ? 'Deleting...' : 'Delete'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Reports Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Analytics & Reports</h2>
                <p className="text-gray-600 mt-2">Comprehensive insights into library operations and performance</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={reportPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="week">Last Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <button
                  onClick={() => fetchReportsData(reportPeriod)}
                  disabled={reportsLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg disabled:opacity-50"
                >
                  <Activity className={`h-4 w-4 ${reportsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {reportsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading reports...</p>
                </div>
              </div>
            ) : reportData ? (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Borrows</p>
                        <p className="text-3xl font-bold">{reportData.basicStats.totalBorrows}</p>
                        <p className="text-blue-200 text-xs mt-1">This period</p>
                      </div>
                      <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
                        <BookOpen className="h-8 w-8 text-blue-200" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Total Returns</p>
                        <p className="text-3xl font-bold">{reportData.basicStats.totalReturns}</p>
                        <p className="text-green-200 text-xs mt-1">This period</p>
                      </div>
                      <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
                        <Check className="h-8 w-8 text-green-200" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm font-medium">Overdue Books</p>
                        <p className="text-3xl font-bold">{reportData.basicStats.totalOverdue}</p>
                        <p className="text-red-200 text-xs mt-1">Currently overdue</p>
                      </div>
                      <div className="bg-red-400 bg-opacity-30 p-3 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-red-200" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-medium">Total Fines</p>
                        <p className="text-3xl font-bold">₹{reportData.basicStats.totalFines}</p>
                        <p className="text-yellow-200 text-xs mt-1">Collected</p>
                      </div>
                      <div className="bg-yellow-400 bg-opacity-30 p-3 rounded-full">
                        <DollarSign className="h-8 w-8 text-yellow-200" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Monthly Trends Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Borrowing Trends</h3>
                      <TrendingUp className="h-6 w-6 text-blue-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={reportData.monthlyTrends.map(trend => ({
                        month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
                        borrows: trend.borrows
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="borrows" stroke="#3B82F6" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Distribution */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Category Distribution</h3>
                      <PieChart className="h-6 w-6 text-green-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={reportData.categoryStats}
                          dataKey="totalBooks"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ categoryName, totalBooks }) => `${categoryName}: ${totalBooks}`}
                        >
                          {reportData.categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Detailed Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Most Active Students */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Most Active Students</h3>
                      <GraduationCap className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="space-y-4">
                      {reportData.activeStudents.map((student, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 p-2 rounded-full">
                              <span className="text-purple-600 font-bold text-sm">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.studentId} • {student.department}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">{student.borrowCount}</p>
                            <p className="text-xs text-gray-500">borrows</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Books */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Popular Books</h3>
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="space-y-4">
                      {reportData.popularBooks.map((book, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-yellow-100 p-2 rounded-full">
                              <span className="text-yellow-600 font-bold text-sm">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{book.title}</p>
                              <p className="text-sm text-gray-600">by {book.authorName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-600">{book.borrowCount}</p>
                            <p className="text-xs text-gray-500">borrows</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Department Statistics */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Department Statistics</h3>
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.departmentStats.map(dept => ({
                      department: dept._id,
                      students: dept.count
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="students" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Overdue Analysis */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Overdue Analysis</h3>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Overdue Books
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Fine
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.overdueAnalysis.map((student, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.studentId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                {student.overdueCount} books
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              ₹{student.totalFine}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports available</h3>
                <p className="text-gray-600">Click refresh to load the latest reports</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Review Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Review Request</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Request Details */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Request Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Request Type</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedRequest.requestType === 'borrow' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedRequest.requestType === 'borrow' ? 'Borrow Request' : 'Return Request'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Request Date</p>
                    <p className="font-medium">{new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Student Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedRequest.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-medium">{selectedRequest.user.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedRequest.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department & Year</p>
                    <p className="font-medium">{selectedRequest.user.department} - Year {selectedRequest.user.year}</p>
                  </div>
                </div>
              </div>

              {/* Book Information */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Book Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-medium">{selectedRequest.book.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Author</p>
                    <p className="font-medium">{selectedRequest.book.author.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ISBN</p>
                    <p className="font-medium">{selectedRequest.book.isbn}</p>
                  </div>
                </div>
              </div>

              {/* Student Notes */}
              {selectedRequest.notes && (
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Student Notes</h4>
                  <p className="text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Admin Response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Response (Optional)
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                  placeholder="Add any comments or instructions for the student..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => handleRequestAction(selectedRequest._id, 'approve')}
                  disabled={processingRequest === selectedRequest._id}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Check className="h-5 w-5" />
                  <span>{processingRequest === selectedRequest._id ? 'Processing...' : 'Approve Request'}</span>
                </button>
                <button
                  onClick={() => handleRequestAction(selectedRequest._id, 'reject')}
                  disabled={processingRequest === selectedRequest._id}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                >
                  <X className="h-5 w-5" />
                  <span>{processingRequest === selectedRequest._id ? 'Processing...' : 'Reject Request'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;