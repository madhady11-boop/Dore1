import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTeams } from './pages/admin/AdminTeams';
import { AdminPlayers } from './pages/admin/AdminPlayers';
import { AdminDisciplinary } from './pages/admin/AdminDisciplinary';
import { AdminMatches } from './pages/admin/AdminMatches';
import { AdminStandings } from './pages/admin/AdminStandings';
import { AdminReferees } from './pages/admin/AdminReferees';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { TeamDashboard } from './pages/team/TeamDashboard';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="matches" element={<Matches />} />
            <Route path="standings" element={<Standings />} />
            <Route path="teams" element={<PublicTeams />} />
            <Route path="teams/:teamId" element={<TeamProfile />} />
            <Route path="players/:playerId" element={<PlayerProfile />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="login" element={<Login />} />
          </Route>

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'tournament_manager', 'disciplinary_committee', 'media_manager', 'stats_manager']}>
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
            <Route path="announcements" element={<AdminAnnouncements />} />
          </Route>

          {/* Team Routes */}
          <Route 
            path="/team-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['team']}>
                <TeamLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeamDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
