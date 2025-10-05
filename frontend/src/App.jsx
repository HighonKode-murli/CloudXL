import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import Teams from './pages/Teams'
import JoinTeam from './pages/JoinTeam'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
        />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="files" element={<Files />} />
          <Route path="teams" element={<Teams />} />
        </Route>

        {/* Team join routes (protected but outside layout) */}
        <Route path="/teams/join/:token" element={<ProtectedRoute><JoinTeam /></ProtectedRoute>} />
        <Route path="/teams/join" element={<ProtectedRoute><JoinTeam /></ProtectedRoute>} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  )
}

export default App
