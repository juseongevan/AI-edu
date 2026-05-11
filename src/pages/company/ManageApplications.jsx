import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { CheckCircle, XCircle, FileText, User, Mail, Clock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS = {
  pending:  { label: '검토 중',  color: 'var(--yellow)' },
  accepted: { label: '합격',    color: 'var(--green)'  },
  rejected: { label: '불합격',  color: 'var(--red)'    },
}

function fmtDate(ts) {
  if (!ts) return '-'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('ko-KR')
}

export default function ManageApplications() {
  const { jobId } = useParams()
  const [job,          setJob]          = useState(null)
  const [applications, setApplications] = useState([])

  useEffect(() => {
    getDoc(doc(db, 'jobs', jobId)).then(d => d.exists() && setJob({ id: d.id, ...d.data() }))
    const q = query(collection(db, 'applications'), where('jobId', '==', jobId))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => {
        const ta = a.appliedAt?.toDate?.() || 0
        const tb = b.appliedAt?.toDate?.() || 0
        return tb - ta
      })
      setApplications(list)
    })
  }, [jobId])

  const updateStatus = async (appId, status) => {
    await updateDoc(doc(db, 'applications', appId), { status, updatedAt: serverTimestamp() })
  }

  return (
    <div className="page-container">
      <Link to="/company" className="btn btn-ghost" style={{ marginBottom: 20, display: 'inline-flex' }}>
        <ArrowLeft size={14} />기업 포털로
      </Link>

      <div className="page-header">
        <div>
          <h1>지원자 관리</h1>
          {job && <p>{job.title}</p>}
        </div>

        <div className="stats-row" style={{ margin: 0 }}>
          <div className="stat-card glass" style={{ padding: '12px 20px', minWidth: 80 }}>
            <div className="stat-num" style={{ fontSize: 22 }}>{applications.length}</div>
            <div className="stat-label">전체</div>
          </div>
          <div className="stat-card glass" style={{ padding: '12px 20px', minWidth: 80 }}>
            <div className="stat-num" style={{ fontSize: 22, color: 'var(--green)' }}>
              {applications.filter(a => a.status === 'accepted').length}
            </div>
            <div className="stat-label">합격</div>
          </div>
          <div className="stat-card glass" style={{ padding: '12px 20px', minWidth: 80 }}>
            <div className="stat-num" style={{ fontSize: 22, color: 'var(--yellow)' }}>
              {applications.filter(a => a.status === 'pending').length}
            </div>
            <div className="stat-label">검토 중</div>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>아직 지원자가 없습니다</h3>
        </div>
      ) : (
        <div className="application-list">
          {applications.map(app => (
            <div key={app.id} className="application-item glass">
              <div className="app-info">
                <div className="app-name"><User size={14} />{app.seekerName || '이름 없음'}</div>
                <div className="app-email"><Mail size={12} />{app.seekerEmail}</div>
                <div className="app-date"><Clock size={11} />지원일: {fmtDate(app.appliedAt)}</div>
                {app.resumeUrl && (
                  <a href={app.resumeUrl} target="_blank" rel="noreferrer"
                    className="btn btn-ghost btn-sm" style={{ marginTop: 10, display: 'inline-flex' }}>
                    <FileText size={12} />이력서 보기
                  </a>
                )}
              </div>

              <div className="app-actions">
                <span className="status-badge" style={{ color: STATUS[app.status]?.color, borderColor: STATUS[app.status]?.color }}>
                  {STATUS[app.status]?.label}
                </span>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => updateStatus(app.id, 'accepted')}
                  disabled={app.status === 'accepted'}
                >
                  <CheckCircle size={13} />합격
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => updateStatus(app.id, 'rejected')}
                  disabled={app.status === 'rejected'}
                >
                  <XCircle size={13} />불합격
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
