import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer
} from 'recharts'
import { Users, Briefcase, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

const CHART_TOOLTIP = {
  contentStyle: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0ff', fontSize: 12 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

export default function AdminDashboard() {
  const [users,        setUsers]        = useState([])
  const [jobs,         setJobs]         = useState([])
  const [applications, setApplications] = useState([])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'users'), snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')), snap => setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, 'applications'), snap => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2(); u3() }
  }, [])

  const approveJob = id => updateDoc(doc(db, 'jobs', id), { status: 'approved' })
  const rejectJob  = id => updateDoc(doc(db, 'jobs', id), { status: 'rejected' })

  // Derived stats
  const seekers      = users.filter(u => u.role === 'seeker').length
  const companies    = users.filter(u => u.role === 'company').length
  const pendingJobs  = jobs.filter(j => j.status === 'pending')
  const approvedJobs = jobs.filter(j => j.status === 'approved')

  // Chart: category breakdown
  const categoryData = Object.entries(
    jobs.reduce((acc, j) => { acc[j.category || '기타'] = (acc[j.category || '기타'] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Chart: location breakdown
  const locationData = Object.entries(
    jobs.reduce((acc, j) => { acc[j.location || '기타'] = (acc[j.location || '기타'] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7)

  // Chart: application status
  const appStatusData = [
    { name: '검토 중', value: applications.filter(a => a.status === 'pending').length,  fill: '#f59e0b' },
    { name: '합격',   value: applications.filter(a => a.status === 'accepted').length, fill: '#22c55e' },
    { name: '불합격', value: applications.filter(a => a.status === 'rejected').length, fill: '#ef4444' },
  ]

  // Chart: monthly user registration (last 6 months)
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const from = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const to   = new Date(from.getFullYear(), from.getMonth() + 1, 1)
    return {
      name: `${from.getMonth() + 1}월`,
      가입자: users.filter(u => {
        const d = u.createdAt?.toDate?.()
        return d && d >= from && d < to
      }).length,
    }
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>관리자 대시보드</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          <TrendingUp size={14} />개요
        </button>
        <button className={`tab ${tab === 'jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>
          <Briefcase size={14} />공고 관리
        </button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <Users size={14} />회원 관리
        </button>
      </div>

      {/* ─── Overview ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          <div className="stats-row">
            {[
              { num: users.length,         label: '전체 회원',   color: undefined         },
              { num: seekers,              label: '구직자',      color: '#a5b4fc'         },
              { num: companies,            label: '기업',        color: '#67e8f9'         },
              { num: approvedJobs.length,  label: '게시 공고',   color: '#4ade80'         },
              { num: applications.length,  label: '전체 지원',   color: undefined         },
              { num: pendingJobs.length,   label: '승인 대기',   color: '#fcd34d'         },
            ].map(({ num, label, color }) => (
              <div key={label} className="stat-card glass">
                <div className="stat-num" style={color ? { color } : undefined}>{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="charts-grid">
            {/* Monthly users */}
            <div className="chart-card glass">
              <h3>월별 가입자 추이</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <XAxis dataKey="name" stroke="#9494b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9494b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Line type="monotone" dataKey="가입자" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Application status */}
            <div className="chart-card glass">
              <h3>지원 현황</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={appStatusData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={70} innerRadius={35}
                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}>
                    {appStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category */}
            <div className="chart-card glass">
              <h3>카테고리별 공고 수</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} margin={{ left: -20 }}>
                  <XAxis dataKey="name" stroke="#9494b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9494b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Location */}
            <div className="chart-card glass">
              <h3>지역별 공고 수</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={locationData} margin={{ left: -20 }}>
                  <XAxis dataKey="name" stroke="#9494b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9494b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ─── Job Management ────────────────────────────────────── */}
      {tab === 'jobs' && (
        <div>
          {/* Pending approval */}
          {pendingJobs.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ marginBottom: 14, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 8 }}>
                승인 대기 공고 ({pendingJobs.length})
              </h3>
              <div className="job-manage-list">
                {pendingJobs.map(job => (
                  <div key={job.id} className="job-manage-item glass" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                    <div className="job-manage-info">
                      <div className="job-manage-title">
                        {job.title}
                        {job.isDirect && <span className="badge badge-direct" style={{ marginLeft: 8 }}>Direct</span>}
                      </div>
                      <div className="job-manage-meta">
                        <span>{job.companyName}</span>
                        <span>{job.category}</span>
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <div className="job-manage-actions">
                      <button className="btn btn-success btn-sm" onClick={() => approveJob(job.id)}>
                        <CheckCircle size={13} />승인
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => rejectJob(job.id)}>
                        <XCircle size={13} />반려
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All jobs */}
          <h3 style={{ marginBottom: 14 }}>전체 공고 ({jobs.length})</h3>
          <div className="job-manage-list">
            {jobs.filter(j => j.status !== 'pending').map(job => (
              <div key={job.id} className="job-manage-item glass">
                <div className="job-manage-info">
                  <div className="job-manage-title">{job.title}</div>
                  <div className="job-manage-meta">
                    <span>{job.companyName}</span>
                    <span>{job.category}</span>
                  </div>
                </div>
                <span className="status-badge" style={{
                  color: job.status === 'approved' ? 'var(--green)' : 'var(--red)',
                  borderColor: job.status === 'approved' ? 'var(--green)' : 'var(--red)',
                }}>
                  {job.status === 'approved' ? '게시 중' : '반려됨'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── User Management ───────────────────────────────────── */}
      {tab === 'users' && (
        <div className="table-wrap glass">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>이름</th>
                <th>이메일</th>
                <th>역할</th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text2)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{u.displayName || '-'}</td>
                  <td style={{ color: 'var(--text2)' }}>{u.email}</td>
                  <td>
                    <span className="role-badge" data-role={u.role}>
                      {u.role === 'seeker' ? '구직자' : u.role === 'company' ? '기업' : '관리자'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>
                    {u.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
