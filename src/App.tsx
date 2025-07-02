import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import BookCatalog from './pages/BookCatalog';
import MyBooks from './pages/MyBooks';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={!user ? <AdminLogin /> : <Navigate to="/admin/dashboard" />} />
        <Route path="/student/login" element={!user ? <StudentLogin /> : <Navigate to="/student/dashboard" />} />
        <Route path="/student/register" element={!user ? <StudentRegister /> : <Navigate to="/student/dashboard" />} />
        <Route path="/books" element={<BookCatalog />} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
        />
        
        {/* Protected Student Routes */}
        <Route 
          path="/student/dashboard" 
          element={user?.role === 'student' && user?.isApproved ? <StudentDashboard /> : <Navigate to="/student/login" />} 
        />
        <Route 
          path="/my-books" 
          element={user?.role === 'student' && user?.isApproved ? <MyBooks /> : <Navigate to="/student/login" />} 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;