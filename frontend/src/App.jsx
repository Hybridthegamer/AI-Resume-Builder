import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import ResumeDetailPage from './pages/ResumeDetailPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume/new"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <ResumeBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume/:id/edit"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <ResumeBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume/:id"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <ResumeDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
