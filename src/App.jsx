import { useEffect } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/workspace/HomePage';
import CoursesPage from './pages/workspace/CoursesPage';
import StudentsPage from './pages/workspace/StudentsPage';
import VenuesPage from './pages/workspace/VenuesPage';
import ExamsPage from './pages/workspace/ExamsPage';
import OperationsPage from './pages/workspace/OperationsPage';
import UsersPage from './pages/workspace/UsersPage';
import CasesPage from './pages/workspace/CasesPage';
import HearingsPage from './pages/workspace/HearingsPage';
import IntegrityPage from './pages/workspace/IntegrityPage';
import BookletsPage from './pages/workspace/BookletsPage';
import ApprovalsPage from './pages/workspace/ApprovalsPage';
import TenantsPage from './pages/workspace/TenantsPage';
import FinancialsPage from './pages/workspace/FinancialsPage';
import ReportsPage from './pages/workspace/ReportsPage';
import { canSwitchRole } from './lib/roles';

// Maps each role's top-level nav routes (see lib/domain.js roleNavigation) to a page component.
const ROLE_PAGES = {
  student: { '/home': HomePage, '/courses': CoursesPage, '/exams': ExamsPage, '/reports': ReportsPage },
  lecturer: { '/home': HomePage, '/operations': OperationsPage, '/courses': CoursesPage, '/exams': ExamsPage, '/reports': ReportsPage },
  invigilator: { '/home': HomePage, '/operations': OperationsPage, '/exams': ExamsPage, '/reports': ReportsPage },
  hod: { '/home': HomePage, '/courses': CoursesPage, '/students': StudentsPage, '/exams': ExamsPage, '/reports': ReportsPage },
  qa: { '/home': HomePage, '/live': VenuesPage, '/integrity': IntegrityPage, '/reports': ReportsPage },
  printer: { '/home': HomePage, '/production': BookletsPage, '/booklets': BookletsPage, '/reports': ReportsPage },
  central: { '/home': HomePage, '/exams': ExamsPage, '/courses': CoursesPage, '/approvals': ApprovalsPage, '/reports': ReportsPage },
  committee: { '/home': HomePage, '/cases': CasesPage, '/hearings': HearingsPage, '/reports': ReportsPage },
  institutional: { '/home': HomePage, '/users': UsersPage, '/roles': UsersPage, '/exams': ExamsPage, '/reports': ReportsPage },
  superadmin: { '/home': HomePage, '/tenants': TenantsPage, '/admins': UsersPage, '/financials': FinancialsPage, '/reports': ReportsPage }
};

function RoleWorkspace() {
  const { role, '*': rest } = useParams();
  const { claims, activeRole, setActiveRole } = useAuth();
  const allowed = canSwitchRole(claims, role);

  useEffect(() => { if (allowed && activeRole !== role) setActiveRole(role); }, [allowed, role, activeRole, setActiveRole]);

  if (!allowed) return <Navigate to={`/${claims.primaryRole}/home`} replace />;

  const pages = ROLE_PAGES[role] || {};
  const Page = pages[`/${rest}`] || pages['/home'];
  if (!Page) return <Navigate to={`/${role}/home`} replace />;

  return <AppShell><Page /></AppShell>;
}

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading">Loading ExamsLock…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RootRedirect() {
  const { claims, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading">Loading ExamsLock…</div>;
  return <Navigate to={isAuthenticated ? `/${claims.primaryRole}/home` : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/:role/*" element={<Protected><RoleWorkspace /></Protected>} />
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </AuthProvider>
  );
}
