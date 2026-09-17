import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';

// Layout & Core
import RootLayout from './layouts/RootLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';

// Eager load initial public landing
import LandingPage from './pages/LandingPage';

// Lazy load secondary & protected routes
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const WorkshopsPage = lazy(() => import('./pages/WorkshopsPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              {/* Main App Layout */}
              <Route path="/" element={<RootLayout />}>
                {/* Public Routes */}
                <Route index element={<LandingPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                <Route path="discover" element={<DiscoverPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="profile/:id" element={<ProfilePage />} />

                {/* Protected Routes */}
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile/edit"
                  element={
                    <ProtectedRoute>
                      <EditProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="matches"
                  element={
                    <ProtectedRoute>
                      <MatchesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="requests"
                  element={
                    <ProtectedRoute>
                      <RequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="messages"
                  element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="sessions"
                  element={
                    <ProtectedRoute>
                      <SessionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="learn"
                  element={
                    <ProtectedRoute>
                      <LearnPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="workshops"
                  element={
                    <ProtectedRoute>
                      <WorkshopsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="community"
                  element={
                    <ProtectedRoute>
                      <CommunityPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            </Suspense>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
