import { lazy, Suspense } from 'react';
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { TeamLayout } from './layouts/TeamLayout';
import { Home } from './pages/public/Home';
import { Matches } from './pages/public/Matches';
import { Standings } from './pages/public/Standings';
import { Teams as PublicTeams } from './pages/public/Teams';
import { TeamProfile } from './pages/public/TeamProfile';
import { PlayerProfile } from './pages/public/PlayerProfile';
import { Announcements } from './pages/public/Announcements';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/ui/Feedback';

/* Heavy panels are code-split so the public site loads fast. */
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminTeams = lazy(() => import('./pages/admin/AdminTeams').then((m) => ({ default: m.AdminTeams })));
const AdminPlayers = lazy(() => import('./pages/admin/AdminPlayers').then((m) => ({ default: m.AdminPlayers })));
const AdminMatches = lazy(() => import('./pages/admin/AdminMatches').then((m) => ({ default: m.AdminMatches })));
const AdminStandings = lazy(() => import('./pages/admin/AdminStandings').then((m) => ({ default: m.AdminStandings })));
const AdminReferees = lazy(() => import('./pages/admin/AdminReferees').then((m) => ({ default: m.AdminReferees })));
const AdminDisciplinary = lazy(() => import('./pages/admin/AdminDisciplinary').then((m) => ({ default: m.AdminDisciplinary })));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements').then((m) => ({ default: m.AdminAnnouncements })));
const AdminFinances = lazy(() => import('./pages/admin/AdminFinances').then((m) => ({ default: m.AdminFinances })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const TeamDashboard = lazy(() => import('./pages/team/TeamDashboard').then((m) => ({ default: m.TeamDashboard })));
const TeamSquad = lazy(() => import('./pages/team/TeamSquad').then((m) => ({ default: m.TeamSquad })));
const TeamInfo = lazy(() => import('./pages/team/TeamInfo').then((m) => ({ default: m.TeamInfo })));
const TeamMatches = lazy(() => import('./pages/team/TeamMatches').then((m) => ({ default: m.TeamMatches })));
const TeamDisciplinary = lazy(() => import('./pages/team/TeamDisciplinary').then((m) => ({ default: m.TeamDisciplinary })));
const TeamObjections = lazy(() => import('./pages/team/TeamObjections').then((m) => ({ default: m.TeamObjections })));

const PanelFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <span className="flex items-center gap-3 text-sm text-ink-300">
      <Spinner />
      جاري تحميل اللوحة...
    </span>
  </div>
);

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PanelFallback />}>
          <Routes>
            {/* Public site */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="matches" element={<Matches />} />
              <Route path="standings" element={<Standings />} />
              <Route path="teams" element={<PublicTeams />} />
              <Route path="teams/:teamId" element={<TeamProfile />} />
              <Route path="players/:playerId" element={<PlayerProfile />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Control panel — fully separated shell */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'super_admin',
                    'tournament_manager',
                    'disciplinary_committee',
                    'media_manager',
                    'stats_manager',
                  ]}
                >
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="players" element={<AdminPlayers />} />
              <Route path="matches" element={<AdminMatches />} />
              <Route path="standings" element={<AdminStandings />} />
              <Route path="referees" element={<AdminReferees />} />
              <Route path="disciplinary" element={<AdminDisciplinary />} />
              <Route path="finances" element={<AdminFinances />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            {/* Team panel — own shell */}
            <Route
              path="/team-dashboard"
              element={
                <ProtectedRoute allowedRoles={['team', 'super_admin', 'tournament_manager']}>
                  <TeamLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeamDashboard />} />
              <Route path="squad" element={<TeamSquad />} />
              <Route path="profile" element={<TeamInfo />} />
              <Route path="matches" element={<TeamMatches />} />
              <Route path="disciplinary" element={<TeamDisciplinary />} />
              <Route path="objections" element={<TeamObjections />} />
              <Route path="*" element={<Navigate to="/team-dashboard" replace />} />
            </Route>
          </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
