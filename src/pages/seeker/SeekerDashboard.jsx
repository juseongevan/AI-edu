import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Briefcase, Bookmark, Clock, CheckCircle, XCircle } from 'lucide-react'
import JobCard from '../../components/JobCard'

const STATUS = {
  pending:  { label: '검토 중',  color: 'var(--yellow)' },
  accepted: { label: '합격',    color: 'var(--green)'  },
  rejected: { label: '불합격',  color: 'var(--red)'    },
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('ko-KR')
}

export default function SeekerDashboard() {
  const { user, userProfile } = useAuth()
  const [applications,   setApplications]   = useState([])
  const [bookmarkedJobs, setBookmarkedJobs] = useState([])
  const [tab, setTab] = useState('applications')

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'applications'), where('seekerId', '==', user.uid))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => {
        const ta = a.appliedAt?.toDate?.() || 0
        const tb = b.appliedAt?.toDate?.() || 0
        return tb - ta
      })
      setApplications(list)
    })
  }, [user])

  useEffect(() => {
    if (!userProfile?.bookmarks?.length) { setBookmarkedJobs([]); return }
    const fetchBookmarks = async () => {
      const jobs = await Promise.all(
        userProfile.bookmarks.map(async id => {
          const d = await getDoc(doc(db, 'jobs', id))
          return d.exists() ? { id: d.id, ...d.data() } : null
        })
      )
      setBookmarkedJobs(jobs.filter(Boolean))
    }
    fetchBookmarks()
  }, [userProfile?.bookmarks])

  const name = userProfile?.displayName || user?.email || ''

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>내 대시보드</h1>
          <p>안녕하세요, {name}님!</p>
        </div>
        <Link to="/" className="btn btn-primary">공고 보러 가기</Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card glass">
          <div className="stat-num">{applications.length}</div>
          <div className="stat-label">총 지원</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-num" style={{ color: 'var(--green)' }}>
            {applications.filter(a => a.status === 'accepted').length}
          </div>
          <div className="stat-label">합격</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-num" style={{ color: 'var(--yellow)' }}>
            {applications.filter(a => a.status === 'pending').length}
          </div>
          <div className="stat-label">검토 중</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-num" style={{ color: 'var(--primary)' }}>
            {userProfile?.bookmarks?.length || 0}
          </div>
          <div className="stat-label">관심 공고</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'applications' ? 'active' : ''}`} onClick={() => setTab('applications')}>
          <Briefcase size={14} />지원 현황
        </button>
        <button className={`tab ${tab === 'bookmarks' ? 'active' : ''}`} onClick={() => setTab('bookmarks')}>
          <Bookmark size={14} />관심 공고
        </button>
      </div>

      {/* Applications Tab */}
      {tab === 'applications' && (
        <>
          {applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>지원 내역이 없습니다</h3>
              <p>공고를 찾아 지원해보세요!</p>
              <Link to="/" className="btn btn-primary">공고 보러 가기</Link>
            </div>
          ) : (
            <div className="application-list">
              {applications.map(app => (
                <div key={app.id} className="application-item glass">
                  <div>
                    <div className="app-company">{app.companyName}</div>
                    <div className="app-title">{app.jobTitle}</div>
                    <div className="app-date"><Clock size={11} />{fmtDate(app.appliedAt)}</div>
                  </div>
                  <span className="status-badge" style={{ color: STATUS[app.status]?.color, borderColor: STATUS[app.status]?.color }}>
                    {STATUS[app.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Bookmarks Tab */}
      {tab === 'bookmarks' && (
        <>
          {bookmarkedJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔖</div>
              <h3>관심 공고가 없습니다</h3>
              <p>마음에 드는 공고를 북마크해보세요!</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {bookmarkedJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
