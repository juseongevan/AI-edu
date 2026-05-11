import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Briefcase, User, LogOut, Shield, Building2, Gift } from 'lucide-react'

export default function Navbar() {
  const { user, userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const role = userProfile?.role

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon">
          <Briefcase size={18} color="#fff" />
        </div>
        <span className="logo-text">채용플랫폼</span>
      </Link>

      <div className="navbar-actions">
        {!user ? (
          <>
            <Link to="/login" className="btn btn-ghost">로그인</Link>
            <Link to="/register" className="btn btn-primary">회원가입</Link>
          </>
        ) : (
          <>
            {role === 'seeker' && (
              <>
                <Link to="/seeker" className={`btn btn-ghost ${location.pathname.startsWith('/seeker') ? 'nav-active' : ''}`}>
                  <User size={14} />내 대시보드
                </Link>
                <Link to="/benefits" className={`btn btn-ghost ${location.pathname === '/benefits' ? 'nav-active' : ''}`}>
                  <Gift size={14} />베네핏
                </Link>
              </>
            )}
            {role === 'company' && (
              <Link to="/company" className={`btn btn-ghost ${location.pathname.startsWith('/company') ? 'nav-active' : ''}`}>
                <Building2 size={14} />기업 포털
              </Link>
            )}
            {role === 'admin' && (
              <>
                <Link to="/admin" className={`btn btn-ghost ${location.pathname === '/admin' ? 'nav-active' : ''}`}>
                  <Shield size={14} />관리자
                </Link>
                <Link to="/benefits" className={`btn btn-ghost ${location.pathname === '/benefits' ? 'nav-active' : ''}`}>
                  <Gift size={14} />베네핏 관리
                </Link>
              </>
            )}
            <div className="nav-user">
              <div className="nav-avatar">{(userProfile?.displayName || user.email || '?')[0].toUpperCase()}</div>
              <span className="nav-name">{userProfile?.displayName || user.email}</span>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout}>
              <LogOut size={14} />로그아웃
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
