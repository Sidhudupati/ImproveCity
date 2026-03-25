import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './providers/AuthProvider';
import { Navigation } from './components/Navigation';
import { Chatbot } from './components/Chatbot';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { MyIssuesPage } from './pages/MyIssuesPage';
import { ResolvedIssuesPage } from './pages/ResolvedIssuesPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import type { ReactNode } from 'react';
import { useAuthStore } from './stores/authStore';
import { Toaster } from 'react-hot-toast';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {user && <Navigation />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />

        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportIssuePage /></ProtectedRoute>} />
        <Route path="/my-issues" element={<ProtectedRoute><MyIssuesPage /></ProtectedRoute>} />
        <Route path="/resolved" element={<ProtectedRoute><ResolvedIssuesPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <Chatbot />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
