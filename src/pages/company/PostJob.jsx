import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { Briefcase, MapPin, DollarSign, Calendar, FileText, Tag, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const CATEGORIES  = ['IT/개발', '마케팅', '영업', '디자인', '경영/기획', '인사/교육', '재무/회계', '기타']
const LOCATIONS   = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '세종', '기타']
const EXPERIENCES = ['신입', '1-3년', '3-5년', '5년 이상', '경력 무관']

const EMPTY = {
  title: '', description: '', category: CATEGORIES[0], location: LOCATIONS[0],
  experience: EXPERIENCES[0], salaryMin: '', salaryMax: '', endDate: '', isDirect: false,
}

export default function PostJob() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { user, userProfile } = useAuth()
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')
  const isEdit = !!id

  useEffect(() => {
    if (!isEdit) return
    const fetchJob = async () => {
      const d = await getDoc(doc(db, 'jobs', id))
      if (!d.exists()) return
      const data = d.data()
      setForm({
        title:       data.title       || '',
        description: data.description || '',
        category:    data.category    || CATEGORIES[0],
        location:    data.location    || LOCATIONS[0],
        experience:  data.experience  || EXPERIENCES[0],
        salaryMin:   data.salary?.min || '',
        salaryMax:   data.salary?.max || '',
        endDate:     data.endDate
          ? (data.endDate.toDate ? data.endDate.toDate() : new Date(data.endDate)).toISOString().slice(0, 10)
          : '',
        isDirect: data.isDirect || false,
      })
    }
    fetchJob()
  }, [id])

  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim())       return setErr('공고 제목을 입력해주세요.')
    if (!form.description.trim()) return setErr('모집 요강을 입력해주세요.')
    if (!form.endDate)            return setErr('마감일을 입력해주세요.')
    setErr('')
    setSaving(true)

    try {
      const jobData = {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        location:    form.location,
        experience:  form.experience,
        salary:      { min: Number(form.salaryMin) || 0, max: Number(form.salaryMax) || 0 },
        endDate:     new Date(form.endDate),
        isDirect:    form.isDirect,
        companyId:   user.uid,
        companyName: userProfile?.displayName || '',
        updatedAt:   serverTimestamp(),
      }

      if (isEdit) {
        await updateDoc(doc(db, 'jobs', id), jobData)
      } else {
        await addDoc(collection(db, 'jobs'), {
          ...jobData,
          status:    'pending',
          createdAt: serverTimestamp(),
        })
      }
      navigate('/company')
    } catch (e) {
      setErr('저장 중 오류가 발생했습니다: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{isEdit ? '공고 수정' : '공고 등록'}</h1>
          <p>{isEdit ? '공고 내용을 수정합니다' : '새 채용 공고를 등록합니다 (관리자 승인 후 게시)'}</p>
        </div>
        <Link to="/company" className="btn btn-ghost"><ArrowLeft size={14} />돌아가기</Link>
      </div>

      <div className="form-card glass">
        <form onSubmit={submit}>
          <div className="form-group">
            <label><Briefcase size={13} />공고 제목 <span className="required">*</span></label>
            <input className="form-input" placeholder="예: 프론트엔드 개발자 모집"
              value={form.title} onChange={set('title')} />
          </div>

          <div className="form-2col">
            <div className="form-group">
              <label><Tag size={13} />직무 카테고리</label>
              <select className="form-input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label><MapPin size={13} />근무 지역</label>
              <select className="form-input" value={form.location} onChange={set('location')}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="form-2col">
            <div className="form-group">
              <label>경력 조건</label>
              <select className="form-input" value={form.experience} onChange={set('experience')}>
                {EXPERIENCES.map(ex => <option key={ex}>{ex}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label><Calendar size={13} />마감일 <span className="required">*</span></label>
              <input type="date" className="form-input" value={form.endDate} onChange={set('endDate')} />
            </div>
          </div>

          <div className="form-2col">
            <div className="form-group">
              <label><DollarSign size={13} />급여 최소 (만원)</label>
              <input type="number" className="form-input" placeholder="예: 300 (0이면 미기재)"
                value={form.salaryMin} onChange={set('salaryMin')} min={0} />
            </div>
            <div className="form-group">
              <label>급여 최대 (만원)</label>
              <input type="number" className="form-input" placeholder="예: 500"
                value={form.salaryMax} onChange={set('salaryMax')} min={0} />
            </div>
          </div>

          <div className="form-group">
            <label><FileText size={13} />모집 요강 <span className="required">*</span></label>
            <textarea className="form-input form-textarea" rows={10}
              placeholder="직무 내용, 지원 자격, 우대 사항, 근무 조건 등을 상세히 입력하세요..."
              value={form.description} onChange={set('description')} />
          </div>

          <div className="form-group form-checkbox">
            <label>
              <input type="checkbox" checked={form.isDirect} onChange={set('isDirect')} />
              <span>자사 직접 채용 (공고에 <strong>Direct</strong> 라벨이 표시됩니다)</span>
            </label>
          </div>

          {err && <div className="error-msg"><AlertCircle size={14} />{err}</div>}

          <div className="form-actions">
            <Link to="/company" className="btn btn-ghost">취소</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={15} />{saving ? '저장 중...' : isEdit ? '수정 완료' : '등록 요청'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
