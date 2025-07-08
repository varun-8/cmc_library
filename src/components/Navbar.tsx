import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, LogOut, Home, Library } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="img\colored-logo.png"
              alt="Coimbatore Medical College Logo"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Coimbatore Medical College
              </h1>
              <p className="text-sm text-gray-600">Library Management System</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/books"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Library className="h-4 w-4" />
              <span>Books</span>
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'student' && user.isApproved && (
                  <Link
                    to="/my-books"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>My Books</span>
                  </Link>
                )}

                <NotificationBell />

                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/student/login"
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Student Login
                </Link>
                <Link
                  to="/admin/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Admin Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;