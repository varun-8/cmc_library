import React, { useState, useEffect } from 'react';
import { Search, Book, User, Tag, Calendar, MapPin, FileText, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Book {
  _id: string;
  title: string;
  author: { _id: string; name: string; nationality: string };
  category: { _id: string; name: string; code: string };
  isbn: string;
  description: string;
  publisher: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  location: string;
  pages: number;
}

interface Author {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
  code: string;
}

const BookCatalog: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [requestNotes, setRequestNotes] = useState('');

  useEffect(() => {
    fetchBooks();
    fetchAuthors();
    fetchCategories();
  }, [searchTerm, selectedAuthor, selectedCategory, currentPage]);

  const fetchBooks = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedAuthor) params.append('author', selectedAuthor);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('page', currentPage.toString());
      params.append('limit', '12');

      const response = await axios.get(`http://localhost:5000/api/books?${params}`);
      setBooks(response.data.books);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/authors');
      setAuthors(response.data);
    } catch (error) {
      console.error('Error fetching authors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleBorrowRequest = async (book: Book) => {
    if (!user || user.role !== 'student' || !user.isApproved) {
      alert('Please login as an approved student to request books');
      return;
    }

    setSelectedBook(book);
    setShowRequestModal(true);
  };

  const submitBorrowRequest = async () => {
    if (!selectedBook) return;

    setRequesting(selectedBook._id);
    try {
      await axios.post('http://localhost:5000/api/requests/borrow', {
        bookId: selectedBook._id,
        notes: requestNotes
      });
      alert('Borrow request submitted successfully! Please wait for admin approval.');
      setShowRequestModal(false);
      setRequestNotes('');
      setSelectedBook(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error submitting request');
    } finally {
      setRequesting(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedAuthor('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Library Catalog</h1>
          <p className="text-gray-600">Discover and request books from our extensive medical collection</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Author Filter */}
            <select
              value={selectedAuthor}
              onChange={(e) => {
                setSelectedAuthor(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Authors</option>
              {authors.map((author) => (
                <option key={author._id} value={author._id}>
                  {author.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name} ({category.code})
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-12">
            <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {books.map((book) => (
              <div key={book._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      book.availableCopies > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.availableCopies > 0 ? 'Available' : 'Not Available'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {book.category.code}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {book.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{book.author.name}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{book.category.name}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{book.publishedYear}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{book.location}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{book.pages} pages</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {book.description}
                  </p>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                      {book.availableCopies}/{book.totalCopies} available
                    </span>
                    <span className="text-sm text-gray-600">
                      ISBN: {book.isbn}
                    </span>
                  </div>

                  {user?.role === 'student' && user?.isApproved && (
                    <button
                      onClick={() => handleBorrowRequest(book)}
                      disabled={book.availableCopies === 0}
                      className={`w-full py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
                        book.availableCopies > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Send className="h-4 w-4" />
                      <span>Request Book</span>
                    </button>
                  )}

                  {(!user || user.role !== 'student' || !user.isApproved) && (
                    <div className="text-center text-sm text-gray-500">
                      Login as approved student to request books
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Request Book</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Book: <span className="font-medium">{selectedBook.title}</span></p>
              <p className="text-sm text-gray-600">Author: <span className="font-medium">{selectedBook.author.name}</span></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any special requests or notes..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={submitBorrowRequest}
                disabled={requesting === selectedBook._id}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{requesting === selectedBook._id ? 'Submitting...' : 'Submit Request'}</span>
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestNotes('');
                  setSelectedBook(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCatalog;