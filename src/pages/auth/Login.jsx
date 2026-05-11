import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { User, Lock, LogIn, Chrome, AlertCircle } from 'lucide-react'

const DEMO_ACCOUNTS = {
  admin: { email: 'admin@demo.com', pw: 'demo-admin-1234', role: 'company', displayName: '이랜드 채용팀' },
  eland: { email: 'eland@demo.com', pw: 'demo-eland-1234', role: 'seeker',  displayName: '이랜드 구직자' },
}

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [err, setErr]       = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const id = form.email.trim().toLowerCase()
      const demo = DEMO_ACCOUNTS[id]
      if (demo && form.password === '1234') {
        try {
          await login(demo.email, demo.pw)
        } catch {
          await register(demo.email, demo.pw, demo.displayName, demo.role)
        }
      } else {
        await login(form.email, form.password)
      }
      navigate('/')
    } catch {
      setErr('아이디 또는 비밀번호가 올바르지 않습니다.')
    }
    setLoading(false)
  }

  const googleLogin = async () => {
    setErr('')
    try {
      await loginWithGoogle()
      navigate('/')
    } catch {
      setErr('Google 로그인에 실패했습니다. 팝업이 차단되었을 수 있습니다.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <h2>로그인</h2>
        <p className="auth-subtitle">계정에 로그인하여 시작하세요</p>

        {/* MVP 데모 계정 안내 */}
        <div style={{
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12,
          color: 'var(--text2)', lineHeight: 1.8,
        }}>
          <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 4 }}>MVP 데모 계정</strong>
          🏢 기업 담당자: ID <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>admin</code> / PW <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>1234</code><br />
          👤 구직자: ID <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>eland</code> / PW <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>1234</code>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label><User size={13} />아이디 / 이메일</label>
            <div className="input-wrap">
              <User size={15} />
              <input type="text" className="form-input" placeholder="아이디 또는 이메일"
                value={form.email} onChange={set('email')} required autoComplete="username" />
            </div>
          </div>
          <div className="form-group">
            <label><Lock size={13} />비밀번호</label>
            <div className="input-wrap">
              <Lock size={15} />
              <input type="password" className="form-input" placeholder="비밀번호 입력"
                value={form.password} onChange={set('password')} required />
            </div>
          </div>

          {err && (
            <div className="error-msg"><AlertCircle size={14} />{err}</div>
          )}

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
            <LogIn size={15} />{loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="divider-text">또는</div>

        <button className="btn btn-google btn-full" onClick={googleLogin}>
          <Chrome size={15} />Google로 로그인
        </button>

        <p className="auth-link">
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
