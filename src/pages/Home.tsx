import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, Clock, Search, Bookmark } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div className="relative bg-gradient-to-r from-blue-800/90 to-teal-800/90 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1476&q=80')] bg-cover bg-center opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Welcome to Coimbatore Medical College Library
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Your gateway to medical knowledge and academic excellence. Access thousands of medical texts, research papers, and educational resources.
            </p>
            <div className="space-x-4">
              <Link
                to="/books"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Books
              </Link>
              <Link
                to="/student/register"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
              >
                <Bookmark className="mr-2 h-5 w-5" />
                Register as Student
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Library Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Our digital library system provides comprehensive tools for students and administrators to manage medical literature efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <BookOpen className="h-8 w-8 text-blue-600" />,
                bg: "bg-blue-100",
                title: "Extensive Collection",
                desc: "Access thousands of medical books, journals, and research papers from renowned publishers.",
                img: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1453&q=80"
              },
              {
                icon: <Users className="h-8 w-8 text-teal-600" />,
                bg: "bg-teal-100",
                title: "Student Management",
                desc: "Streamlined registration process with admin approval and comprehensive student profiles.",
                img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
              },
              {
                icon: <Award className="h-8 w-8 text-orange-600" />,
                bg: "bg-orange-100",
                title: "Easy Borrowing",
                desc: "Simple book borrowing system with automated due date tracking and return reminders.",
                img: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1476&q=80"
              },
              {
                icon: <Clock className="h-8 w-8 text-green-600" />,
                bg: "bg-green-100",
                title: "24/7 Access",
                desc: "Access your digital library account anytime, anywhere with our responsive web platform.",
                img: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
              }
            ].map((feature, index) => (
              <div key={index} className="group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={feature.img} 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <div className={`${feature.bg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-center">{feature.title}</h3>
                  <p className="text-gray-600 text-center">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl font-bold mb-2">10,000+</div>
              <div className="text-xl">Medical Books</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold mb-2">5,000+</div>
              <div className="text-xl">Research Papers</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold mb-2">2,500+</div>
              <div className="text-xl">Active Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
    
      

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-blue-800 to-teal-800 text-white py-24">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Academic Journey?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of medical students who rely on our library system for their academic success.
          </p>
          <Link
            to="/student/register"
            className="bg-white text-blue-600 px-10 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center text-lg"
          >
            <Bookmark className="mr-2 h-6 w-6" />
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;