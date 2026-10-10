import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorList from './pages/DoctorList';
import DoctorProfile from './pages/DoctorProfile';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0f172a',
                color: '#fff',
                fontSize: '13px',
                borderRadius: '12px',
                padding: '12px 16px',
                fontWeight: '500',
              },
              success: { iconTheme: { primary: '#14b8a6', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
            }}
          />

          <Routes>

            <Route path="/" element={<Home />} />

            <Route
              path="/*"
              element={
                <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-[#070f1e] text-slate-100 selection:bg-sky-500 selection:text-white">
                  <Navbar />
                  <main className="flex-1 flex flex-col w-full overflow-x-hidden">
                    <Routes>
                      <Route path="/doctors" element={<DoctorList />} />
                      <Route path="/doctors/:id" element={<DoctorProfile />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      <Route
                        path="/patient"
                        element={
                          <ProtectedRoute allowedRoles={['patient', 'admin']}>
                            <PatientDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/doctor"
                        element={
                          <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                            <DoctorDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

