import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Upload, CheckCircle, XCircle, Gift, Clock, AlertCircle, FileText } from 'lucide-react'

const STATUS = {
  pending:  { label: '검토 중',   color: 'var(--yellow)' },
  approved: { label: '지급 완료', color: 'var(--green)'  },
  rejected: { label: '반려',      color: 'var(--red)'    },
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('ko-KR')
}

export default function BenefitsPage() {
  const { user, userProfile } = useAuth()

  const [benefits,      setBenefits]      = useState([])
  const [applications,  setApplications]  = useState([])
  const [selectedApp,   setSelectedApp]   = useState('')
  const [proofFile,     setProofFile]     = useState(null)
  const [submitting,    setSubmitting]    = useState(false)
  const [err,           setErr]           = useState('')
  const [successMsg,    setSuccessMsg]    = useState('')

  const isAdmin  = userProfile?.role === 'admin'
  const isSeeker = userProfile?.role === 'seeker'

  /* Benefits 구독 */
  useEffect(() => {
    if (!user) return
    const q = isAdmin
      ? query(collection(db, 'benefits'), orderBy('appliedAt', 'desc'))
      : query(collection(db, 'benefits'), where('seekerId', '==', user.uid))
    return onSnapshot(q, snap => setBenefits(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user, isAdmin])

  /* 합격된 지원 목록 (구직자용) */
  useEffect(() => {
    if (!isSeeker || !user) return
    const q = query(
      collection(db, 'applications'),
      where('seekerId', '==', user.uid),
      where('status', '==', 'accepted')
    )
    return onSnapshot(q, snap => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user, isSeeker])

  const submit = async () => {
    if (!selectedApp) return setErr('합격 공고를 선택해주세요.')
    if (!proofFile)   return setErr('채용 확정 증빙 서류를 첨부해주세요.')
    setErr('')
    setSubmitting(true)
    try {
      const sRef = storageRef(storage, `benefits/${user.uid}/${Date.now()}-${proofFile.name}`)
      await uploadBytes(sRef, proofFile)
      const proofUrl = await getDownloadURL(sRef)
      const app = applications.find(a => a.id === selectedApp)

      await addDoc(collection(db, 'benefits'), {
        applicationId: selectedApp,
        seekerId:      user.uid,
        seekerName:    userProfile?.displayName || user.displayName || '',
        seekerEmail:   user.email,
        jobTitle:      app?.jobTitle    || '',
        companyName:   app?.companyName || '',
        proofUrl,
        status:        'pending',
        rewardAmount:  100000,
        appliedAt:     serverTimestamp(),
      })
      setProofFile(null)
      setSelectedApp('')
      setSuccessMsg('베네핏 신청이 완료되었습니다. 관리자 검토 후 지급됩니다.')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (e) {
      setErr('제출 중 오류가 발생했습니다: ' + e.message)
    }
    setSubmitting(false)
  }

  const approve = id => updateDoc(doc(db, 'benefits', id), { status: 'approved', approvedAt: serverTimestamp() })
  const reject  = id => updateDoc(doc(db, 'benefits', id), { status: 'rejected', approvedAt: serverTimestamp() })

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><Gift size={22} />베네핏 관리</h1>
          <p>{isAdmin ? '채용 확정 신청을 검토하고 베네핏을 지급합니다' : '채용 확정 시 증빙 서류를 업로드하여 베네핏을 신청하세요'}</p>
        </div>
      </div>

      {/* 구직자: 신청 폼 */}
      {isSeeker && (
        <div className="form-card glass" style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 20 }}>채용 확정 신청</h3>

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: 'var(--green)', marginBottom: 16, fontSize: 14 }}>
              <CheckCircle size={16} />{successMsg}
            </div>
          )}

          <div className="form-group">
            <label>합격 공고 선택 <span className="required">*</span></label>
            <select className="form-input" value={selectedApp} onChange={e => setSelectedApp(e.target.value)}>
              <option value="">-- 합격한 공고를 선택하세요 --</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.companyName} — {app.jobTitle}</option>
              ))}
            </select>
            {applications.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, display: 'block' }}>
                합격 처리된 지원 내역이 없습니다.
              </span>
            )}
          </div>

          <div className="form-group">
            <label><Upload size={13} />채용 확정 증빙 서류 <span className="required">*</span></label>
            <label className="btn btn-ghost" style={{ cursor: 'pointer', marginTop: 4 }}>
              <Upload size={14} />
              {proofFile ? proofFile.name : '파일 선택 (합격통보서, 근로계약서 등)'}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" style={{ display: 'none' }}
                onChange={e => setProofFile(e.target.files?.[0] || null)} />
            </label>
            <span style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6, display: 'block' }}>
              지원 가능 형식: PDF, JPG, PNG, DOCX · 기본 보상금: 100,000원
            </span>
          </div>

          {err && <div className="error-msg"><AlertCircle size={14} />{err}</div>}

          <button className="btn btn-primary" onClick={submit} disabled={submitting}>
            <Gift size={15} />{submitting ? '제출 중...' : '베네핏 신청하기'}
          </button>
        </div>
      )}

      {/* 신청 내역 */}
      <h3 style={{ marginBottom: 14 }}>
        {isAdmin ? `전체 신청 현황 (${benefits.length})` : `내 베네핏 현황 (${benefits.length})`}
      </h3>

      {benefits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎁</div>
          <h3>신청 내역이 없습니다</h3>
          {isSeeker && <p>채용 확정 후 베네핏을 신청해보세요!</p>}
        </div>
      ) : (
        <div className="application-list">
          {benefits.map(b => (
            <div key={b.id} className="application-item glass">
              <div className="app-info">
                {isAdmin && (
                  <div className="app-name">{b.seekerName}
                    <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 400, marginLeft: 8 }}>{b.seekerEmail}</span>
                  </div>
                )}
                <div className="app-company">{b.companyName}</div>
                <div className="app-title">{b.jobTitle}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                    💰 {b.rewardAmount?.toLocaleString()}원
                  </span>
                  <span className="app-date"><Clock size={11} />{fmtDate(b.appliedAt)}</span>
                  {b.proofUrl && (
                    <a href={b.proofUrl} target="_blank" rel="noreferrer"
                      className="btn btn-ghost btn-sm">
                      <FileText size={12} />증빙 보기
                    </a>
                  )}
                </div>
              </div>

              <div className="app-actions">
                <span className="status-badge" style={{ color: STATUS[b.status]?.color, borderColor: STATUS[b.status]?.color }}>
                  {STATUS[b.status]?.label}
                </span>
                {isAdmin && b.status === 'pending' && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => approve(b.id)}>
                      <CheckCircle size={13} />승인
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => reject(b.id)}>
                      <XCircle size={13} />반려
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
