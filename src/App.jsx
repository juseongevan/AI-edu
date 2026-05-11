import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import SeekerDashboard from './pages/seeker/SeekerDashboard'
import JobDetail from './pages/seeker/JobDetail'
import CompanyDashboard from './pages/company/CompanyDashboard'
import PostJob from './pages/company/PostJob'
import ManageApplications from './pages/company/ManageApplications'
import AdminDashboard from './pages/admin/AdminDashboard'
import BenefitsPage from './pages/benefits/BenefitsPage'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, userProfile, loading } = useAuth()

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <span>로딩 중...</span>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs/:id" element={<JobDetail />} />

          <Route path="/seeker" element={
            <ProtectedRoute allowedRoles={['seeker']}>
              <SeekerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/company" element={
            <ProtectedRoute allowedRoles={['company']}>
              <CompanyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/company/post" element={
            <ProtectedRoute allowedRoles={['company']}>
              <PostJob />
            </ProtectedRoute>
          } />
          <Route path="/company/post/:id" element={
            <ProtectedRoute allowedRoles={['company']}>
              <PostJob />
            </ProtectedRoute>
          } />
          <Route path="/company/applications/:jobId" element={
            <ProtectedRoute allowedRoles={['company']}>
              <ManageApplications />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/benefits" element={
            <ProtectedRoute allowedRoles={['seeker', 'admin']}>
              <BenefitsPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
