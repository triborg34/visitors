import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Spinner } from './components/ui/Display';
import Login from './pages/Login';
import NewVisitor from './pages/NewVisitor';
import MyVisitors from './pages/MyVisitors';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AllVisitors from './pages/AllVisitors';
import VisitorDetails from './pages/VisitorDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import FollowUps from './pages/admin/FollowUps';
import Reports from './pages/admin/Reports';
import Exhibitions from './pages/admin/Exhibitions';
import Employees from './pages/admin/Employees';
import Templates from './pages/admin/Templates';
import SettingsPage from './pages/admin/Settings';
import Connections from './pages/admin/Connections';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="در حال بررسی نشست…" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/app/new" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/app" element={<EmployeeDashboard />} />
        <Route path="/app/new" element={<NewVisitor />} />
        <Route path="/app/visitors" element={<MyVisitors />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/visitors"
          element={
            <RequireAdmin>
              <AllVisitors />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/visitors/:id"
          element={
            <RequireAdmin>
              <VisitorDetails />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/followups"
          element={
            <RequireAdmin>
              <FollowUps />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAdmin>
              <Reports />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/exhibitions"
          element={
            <RequireAdmin>
              <Exhibitions />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <RequireAdmin>
              <Employees />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <RequireAdmin>
              <Templates />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAdmin>
              <SettingsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/connections"
          element={
            <RequireAdmin>
              <Connections />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/app/new" replace />} />
    </Routes>
  );
}