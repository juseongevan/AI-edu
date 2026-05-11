import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, addDoc, collection, query, where, getDocs,
  serverTimestamp, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { MapPin, DollarSign, Clock, Briefcase, Bookmark, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function fmtDate(date) {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, userProfile, refreshProfile } = useAuth()

  const [job,            setJob]            = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [applying,       setApplying]       = useState(false)
  const [applied,        setApplied]        = useState(false)
  const [resumeFile,     setResumeFile]     = useState(null)
  const [uploading,      setUploading]      = useState(false)
  const [bookmarked,     setBookmarked]     = useState(false)
  const [err,            setErr]            = useState('')

  useEffect(() => {
    const fetchJob = async () => {
      const d = await getDoc(doc(db, 'jobs', id))
      if (d.exists()) setJob({ id: d.id, ...d.data() })
      setLoading(false)
    }
    fetchJob()
  }, [id])

  useEffect(() => {
    if (!user || !userProfile) return
    setBookmarked(userProfile.bookmarks?.includes(id) ?? false)
    const checkApplied = async () => {
      const q = query(
        collection(db, 'applications'),
        where('jobId', '==', id),
        where('seekerId', '==', user.uid)
      )
      const snap = await getDocs(q)
      setApplied(!snap.empty)
    }
    checkApplied()
  }, [id, user, userProfile])

  const toggleBookmark = async () => {
    if (!user) return navigate('/login')
    const userRef = doc(db, 'users', user.uid)
    if (bookmarked) {
      await updateDoc(userRef, { bookmarks: arrayRemove(id) })
    } else {
      await updateDoc(userRef, { bookmarks: arrayUnion(id) })
    }
    setBookmarked(!bookmarked)
    refreshProfile()
  }

  const apply = async () => {
    if (!user) return navigate('/login')
    if (userProfile?.role !== 'seeker') { setErr('구직자만 지원할 수 있습니다.'); return }
    if (applied) return

    setApplying(true)
    setErr('')
    try {
      let resumeUrl = ''
      if (resumeFile) {
        setUploading(true)
        const sRef = storageRef(storage, `resumes/${user.uid}/${Date.now()}-${resumeFile.name}`)
        await uploadBytes(sRef, resumeFile)
        resumeUrl = await getDownloadURL(sRef)
        setUploading(false)
      }

      await addDoc(collection(db, 'applications'), {
        jobId:       id,
        jobTitle:    job.title,
        companyName: job.companyName,
        seekerId:    user.uid,
        seekerName:  userProfile?.displayName || user.displayName || '',
        seekerEmail: user.email,
        resumeUrl,
        status:      'pending',
        appliedAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
      })
      setApplied(true)
    } catch (e) {
      setErr('지원 중 오류가 발생했습니다: ' + e.message)
    }
    setApplying(false)
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <span>공고를 불러오는 중...</span>
    </div>
  )

  if (!job) return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <h3>공고를 찾을 수 없습니다</h3>
        <Link to="/" className="btn btn-ghost">← 목록으로</Link>
      </div>
    </div>
  )

  const endDate  = job.endDate ? (job.endDate.toDate ? job.endDate.toDate() : new Date(job.endDate)) : null
  const isExpired = endDate && endDate < new Date()

  return (
    <div className="page-container">
      <Link to="/" className="btn btn-ghost" style={{ marginBottom: 20, display: 'inline-flex' }}>
        <ArrowLeft size={14} />목록으로
      </Link>

      <div className="detail-layout">
        {/* Main */}
        <div>
          <div className="job-detail-card glass">
            <div className="job-detail-header">
              <div style={{ flex: 1 }}>
                {job.isDirect && <span className="badge badge-direct" style={{ marginBottom: 10, display: 'inline-flex' }}>Direct</span>}
                <h1 className="job-detail-title">{job.title}</h1>
                <div className="job-company-name">{job.companyName}</div>
              </div>
              <button className={`btn-bookmark ${bookmarked ? 'active' : ''}`} onClick={toggleBookmark} title={bookmarked ? '북마크 해제' : '북마크'}>
                <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="job-info-grid">
              {job.location && <div className="job-info-item"><MapPin size={14} style={{ color: 'var(--primary)' }} />{job.location}</div>}
              {job.salary?.max > 0 && (
                <div className="job-info-item">
                  <DollarSign size={14} style={{ color: 'var(--green)' }} />
                  {job.salary.min > 0 ? `${job.salary.min.toLocaleString()}~` : ''}{job.salary.max.toLocaleString()}만원
                </div>
              )}
              {job.category && <div className="job-info-item"><Briefcase size={14} style={{ color: 'var(--cyan)' }} />{job.category}</div>}
              {job.experience && <div className="job-info-item" style={{ color: 'var(--text2)' }}>경력: {job.experience}</div>}
              {endDate && (
                <div className="job-info-item" style={{ color: isExpired ? 'var(--red)' : 'var(--text2)' }}>
                  <Clock size={14} />마감: {fmtDate(endDate)}{isExpired ? ' (마감)' : ''}
                </div>
              )}
            </div>

            <div className="job-description">
              <h3>모집 요강</h3>
              <div className="description-content">{job.description}</div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="apply-card glass">
            <h3>지원하기</h3>

            {isExpired ? (
              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: 'var(--red)', fontSize: 14, textAlign: 'center' }}>
                마감된 공고입니다
              </div>
            ) : applied ? (
              <div className="applied-msg"><CheckCircle size={16} />이미 지원한 공고입니다</div>
            ) : (
              <>
                {(userProfile?.role === 'seeker' || !user) && (
                  <div className="form-group">
                    <label style={{ fontSize: 13 }}><Upload size={13} />이력서 첨부 <span style={{ color: 'var(--text2)', fontWeight: 400 }}>(선택)</span></label>
                    <label className="btn btn-ghost" style={{ cursor: 'pointer', marginTop: 4 }}>
                      <Upload size={14} />
                      {resumeFile ? resumeFile.name : '파일 선택 (.pdf, .doc)'}
                      <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                        onChange={e => setResumeFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                )}

                {err && <div className="error-msg"><AlertCircle size={14} />{err}</div>}

                <button
                  className="btn btn-primary btn-full"
                  onClick={apply}
                  disabled={applying || uploading}
                  style={{ marginTop: 4 }}
                >
                  {uploading ? '업로드 중...' : applying ? '지원 중...' : !user ? '로그인 후 지원하기' : '지원하기'}
                </button>
              </>
            )}

            <div style={{ marginTop: 20, padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
                <div>📍 {job.location || '-'}</div>
                {job.salary?.max > 0 && <div>💰 {job.salary.min > 0 ? `${job.salary.min}~` : ''}{job.salary.max}만원</div>}
                <div>📂 {job.category || '-'}</div>
                {endDate && <div>⏰ {fmtDate(endDate)}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
