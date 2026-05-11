import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, User, Building2, Search, AlertCircle } from 'lucide-react'

const ROLES = [
  { value: 'seeker',  label: '구직자',  desc: '채용 공고를 찾고 지원합니다',        icon: Search    },
  { value: 'company', label: '기업',    desc: '채용 공고를 등록하고 인재를 채용합니다', icon: Building2 },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '', displayName: '', role: 'seeker' })
  const [err, setErr]       = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return setErr('비밀번호는 6자 이상이어야 합니다.')
    if (!form.displayName.trim()) return setErr('이름을 입력해주세요.')
    setErr('')
    setLoading(true)
    try {
      await register(form.email, form.password, form.displayName.trim(), form.role)
      navigate(form.role === 'company' ? '/company' : '/')
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') setErr('이미 사용 중인 이메일입니다.')
      else if (e.code === 'auth/weak-password') setErr('비밀번호가 너무 약합니다.')
      else setErr('회원가입에 실패했습니다: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <h2>회원가입</h2>
        <p className="auth-subtitle">계정 유형을 선택해주세요</p>

        {/* Role Selector */}
        <div className="role-selector">
          {ROLES.map(r => (
            <button key={r.value} type="button"
              className={`role-btn ${form.role === r.value ? 'selected' : ''}`}
              onClick={() => setForm(f => ({ ...f, role: r.value }))}>
              <r.icon size={22} style={{ color: form.role === r.value ? 'var(--primary)' : 'var(--text2)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="role-label">{r.label}</div>
                <div className="role-desc">{r.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label><User size={13} />{form.role === 'company' ? '기업명' : '이름'}</label>
            <div className="input-wrap">
              <User size={15} />
              <input className="form-input"
                placeholder={form.role === 'company' ? '기업명 입력' : '이름 입력'}
                value={form.displayName} onChange={set('displayName')} required />
            </div>
          </div>

          <div className="form-group">
            <label><Mail size={13} />이메일</label>
            <div className="input-wrap">
              <Mail size={15} />
              <input type="email" className="form-input" placeholder="example@email.com"
                value={form.email} onChange={set('email')} required />
            </div>
          </div>

          <div className="form-group">
            <label><Lock size={13} />비밀번호</label>
            <div className="input-wrap">
              <Lock size={15} />
              <input type="password" className="form-input" placeholder="6자 이상"
                value={form.password} onChange={set('password')} required />
            </div>
          </div>

          {err && <div className="error-msg"><AlertCircle size={14} />{err}</div>}

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? '처리 중...' : '가입하기'}
          </button>
        </form>

        <p className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
