import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, CheckCircle, AlertTriangle, Send, ArrowLeft, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface BorrowedBook {
  _id: string;
  book: {
    _id: string;
    title: string;
    author: { name: string; nationality: string };
    category: { name: string; code: string };
    isbn: string;
    publisher: string;
    location: string;
  };
  borrowDate: string;
  dueDate: string;
  status: string;
}

interface BorrowRequest {
  _id: string;
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
  adminResponse?: string;
  borrowRecordId?: string;
}

const MyBooks: React.FC = () => {
  const { user } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('borrowed');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BorrowedBook | null>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (user?.role === 'student' && user?.isApproved) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [borrowedRes, requestsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/borrows/my-books'),
        axios.get('http://localhost:5000/api/requests/my-requests')
      ]);
      setBorrowedBooks(borrowedRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnRequest = async () => {
    if (!selectedBook) return;

    setSubmittingReturn(true);
    try {
      await axios.post('http://localhost:5000/api/requests/return', {
        borrowRecordId: selectedBook._id,
        notes: returnNotes
      });
      alert('Return request submitted successfully! Please wait for admin approval.');
      setShowReturnModal(false);
      setReturnNotes('');
      setSelectedBook(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error submitting return request');
    } finally {
      setSubmittingReturn(false);
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

  const getStatusColor = (dueDate: string) => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    const overdue = isOverdue(dueDate);
    
    if (overdue) return 'text-red-600 bg-red-50 border-red-200';
    if (daysUntilDue <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = (dueDate: string) => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    const overdue = isOverdue(dueDate);
    
    if (overdue) return `Overdue (${Math.abs(daysUntilDue)} days)`;
    if (daysUntilDue <= 3) return `Due soon (${daysUntilDue} days)`;
    return `${daysUntilDue} days left`;
  };

  const getStatusIcon = (dueDate: string) => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    const overdue = isOverdue(dueDate);
    
    if (overdue) return <AlertTriangle className="h-4 w-4" />;
    if (daysUntilDue <= 3) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user || user.role !== 'student' || !user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Please login as an approved student to view your borrowed books.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Library
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your borrowed books and track your requests
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'borrowed', name: 'Borrowed Books', count: borrowedBooks.length },
              { id: 'requests', name: 'My Requests', count: requests.length }
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
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Borrowed Books Tab */}
        {activeTab === 'borrowed' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Borrowed</p>
                    <p className="text-3xl font-bold">{borrowedBooks.length}</p>
                  </div>
                  <BookOpen className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Due Soon</p>
                    <p className="text-3xl font-bold">
                      {borrowedBooks.filter(book => {
                        const days = getDaysUntilDue(book.dueDate);
                        return days <= 3 && days > 0;
                      }).length}
                    </p>
                  </div>
                  <Clock className="h-12 w-12 text-orange-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100">Overdue</p>
                    <p className="text-3xl font-bold">
                      {borrowedBooks.filter(book => isOverdue(book.dueDate)).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-12 w-12 text-red-200" />
                </div>
              </div>
            </div>

            {/* Books List */}
            {borrowedBooks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No books borrowed</h3>
                <p className="text-gray-600 mb-6">
                  You haven't borrowed any books yet. Browse our catalog to find books to request.
                </p>
                <a
                  href="/books"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Browse Books</span>
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {borrowedBooks.map((borrowRecord) => (
                  <div key={borrowRecord._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {borrowRecord.book.title}
                              </h3>
                              <p className="text-gray-600 mb-1">
                                by {borrowRecord.book.author.name} ({borrowRecord.book.author.nationality})
                              </p>
                              <p className="text-sm text-gray-500">
                                {borrowRecord.book.category.name} • {borrowRecord.book.publisher}
                              </p>
                            </div>
                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(borrowRecord.dueDate)}`}>
                              {getStatusIcon(borrowRecord.dueDate)}
                              <span>{getStatusText(borrowRecord.dueDate)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <div>
                                <span className="font-medium">Borrowed:</span>
                                <br />
                                {new Date(borrowRecord.borrowDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <div>
                                <span className="font-medium">Due:</span>
                                <br />
                                {new Date(borrowRecord.dueDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4" />
                              <div>
                                <span className="font-medium">Location:</span>
                                <br />
                                {borrowRecord.book.location}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 lg:mt-0 lg:ml-6">
                          <button
                            onClick={() => {
                              setSelectedBook(borrowRecord);
                              setShowReturnModal(true);
                            }}
                            className="w-full lg:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                          >
                            <Send className="h-5 w-5" />
                            <span>Request Return</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">ISBN:</span> {borrowRecord.book.isbn}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Requests</h2>
              <div className="text-sm text-gray-600">
                {requests.length} total requests
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-600">
                  You haven't made any borrow or return requests yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.book.title}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRequestStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">by {request.book.author.name}</p>
                        <p className="text-sm text-gray-500">ISBN: {request.book.isbn}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          request.requestType === 'borrow' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {request.requestType === 'borrow' ? 'Borrow Request' : 'Return Request'}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Your Notes:</p>
                        <p className="text-sm text-gray-600">{request.notes}</p>
                      </div>
                    )}

                    {request.adminResponse && (
                      <div className={`p-4 rounded-lg ${
                        request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Admin Response:
                        </p>
                        <p className="text-sm text-gray-600">{request.adminResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Return Request Modal */}
        {showReturnModal && selectedBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Request Return</h3>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">Book:</p>
                  <p className="font-medium text-gray-900">{selectedBook.book.title}</p>
                  <p className="text-sm text-gray-600">by {selectedBook.book.author.name}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Notes (Optional)
                  </label>
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                    placeholder="Any comments about the book condition or return reason..."
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleReturnRequest}
                  disabled={submittingReturn}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Send className="h-4 w-4" />
                  <span>{submittingReturn ? 'Submitting...' : 'Submit Request'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnNotes('');
                    setSelectedBook(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Library Guidelines */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Star className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900">Library Guidelines</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <ul className="space-y-2">
              <li>• Books are due 14 days from the borrow date</li>
              <li>• Submit return requests before the due date</li>
              <li>• Maximum of 3 books can be borrowed at once</li>
            </ul>
            <ul className="space-y-2">
              <li>• Report damaged or lost books immediately</li>
              <li>• Late returns may incur fines</li>
              <li>• Keep your contact information updated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBooks;