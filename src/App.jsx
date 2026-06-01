import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import Home from '@/pages/Home';
import CreateAnnouncement from '@/pages/CreateAnnouncement';
import MyAnnouncements from '@/pages/MyAnnouncements';
import Settings from '@/pages/Settings';
import Uploads from '@/pages/Uploads';
import AdminManage from '@/pages/AdminManage';
import Templates from '@/pages/Templates';
import Backgrounds from '@/pages/Backgrounds';
import Community from '@/pages/Community';
import AdminCategories from '@/pages/AdminCategories';
import AdminUsers from '@/pages/AdminUsers';
import Login from '@/pages/Login';

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Always allow the login page to render without auth check
  if (isLoginPage) {
    return <Login />;
  }

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-muted border-t-secondary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (authError?.type === 'auth_required') {
    navigateToLogin();
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<AppLayout />}>
        <Route path="/my-announcements" element={<MyAnnouncements />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/uploads" element={<Uploads />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/backgrounds" element={<Backgrounds />} />
        <Route path="/community" element={<Community />} />
        <Route path="/admin-categories" element={<AdminCategories />} />
      </Route>
      <Route path="/admin-manage" element={<AdminManage />} />
      <Route path="/admin-users" element={<AdminUsers />} />
      <Route path="/create" element={<CreateAnnouncement />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
