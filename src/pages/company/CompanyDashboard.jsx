import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Plus, Edit3, Trash2, Users, CheckCircle, Clock, XCircle } from 'lucide-react'

const JOB_STATUS = {
  pending:  { label: '승인 대기', color: 'var(--yellow)'  },
  approved: { label: '게시 중',   color: 'var(--green)'   },
  rejected: { label: '반려됨',    color: 'var(--red)'     },
}

function fmtDate(date) {
  if (!date) return '-'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('ko-KR')
}

export default function CompanyDashboard() {
  const { user, userProfile } = useAuth()
  const [jobs, setJobs]               = useState([])
  const [confirmDelete, setConfirm]   = useState(null)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'jobs'), where('companyId', '==', user.uid))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || 0
        const tb = b.createdAt?.toDate?.() || 0
        return tb - ta
      })
      setJobs(list)
    })
  }, [user])

  const deleteJob = async (id) => {
    await deleteDoc(doc(db, 'jobs', id))
    setConfirm(null)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>기업 포털</h1>
          <p>{userProfile?.displayName}님의 채용 관리 페이지</p>
        </div>
        <Link to="/company/post" className="btn btn-primary">
          <Plus size={15} />공고 등록
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card glass">
          <div className="stat-num">{jobs.length}</div>
          <div className="stat-label">전체 공고</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-num" style={{ color: 'var(--green)' }}>
            {jobs.filter(j => j.status === 'approved').length}
          </div>
          <div className="stat-label">게시 중</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-num" style={{ color: 'var(--yellow)' }}>
            {jobs.filter(j => j.status === 'pending').length}
          </div>
          <div className="stat-label">승인 대기</div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <h3>등록된 공고가 없습니다</h3>
          <p>첫 채용 공고를 등록해보세요!</p>
          <Link to="/company/post" className="btn btn-primary">공고 등록하기</Link>
        </div>
      ) : (
        <div className="job-manage-list">
          {jobs.map(job => (
            <div key={job.id} className="job-manage-item glass">
              <div className="job-manage-info">
                <div className="job-manage-title">
                  {job.title}
                  {job.isDirect && <span className="badge badge-direct" style={{ marginLeft: 8 }}>Direct</span>}
                </div>
                <div className="job-manage-meta">
                  <span>{job.category}</span>
                  <span>{job.location}</span>
                  <span>마감: {fmtDate(job.endDate)}</span>
                </div>
              </div>

              <div className="job-manage-actions">
                <span className="status-badge" style={{ color: JOB_STATUS[job.status]?.color, borderColor: JOB_STATUS[job.status]?.color }}>
                  {JOB_STATUS[job.status]?.label}
                </span>
                <Link to={`/company/applications/${job.id}`} className="btn btn-ghost btn-sm">
                  <Users size={13} />지원자
                </Link>
                <Link to={`/company/post/${job.id}`} className="btn btn-ghost btn-sm">
                  <Edit3 size={13} />수정
                </Link>
                {confirmDelete === job.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--red)' }}>삭제할까요?</span>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteJob(job.id)}>확인</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>취소</button>
                  </div>
                ) : (
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirm(job.id)}>
                    <Trash2 size={13} />삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
