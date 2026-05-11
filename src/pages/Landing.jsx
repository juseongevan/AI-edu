import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Search, MapPin, Briefcase, Star, Zap } from 'lucide-react'
import JobCard from '../components/JobCard'

const CATEGORIES = ['전체', 'IT/개발', '마케팅', '영업', '디자인', '경영/기획', '인사/교육', '재무/회계', '기타']
const LOCATIONS  = ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '세종', '기타']
const EXPERIENCES = ['전체', '신입', '1-3년', '3-5년', '5년 이상', '경력 무관']

export default function Landing() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', category: '전체', location: '전체', experience: '전체' })

  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = jobs.filter(j => {
    const text = `${j.title} ${j.companyName} ${j.description}`.toLowerCase()
    if (filters.q && !text.includes(filters.q.toLowerCase())) return false
    if (filters.category !== '전체' && j.category !== filters.category) return false
    if (filters.location !== '전체' && j.location !== filters.location) return false
    if (filters.experience !== '전체' && j.experience !== filters.experience) return false
    return true
  })

  return (
    <div className="page-container">
      {/* Hero */}
      <section className="hero-sm">
        <div className="hero-badge"><Zap size={12} />스마트 채용 플랫폼</div>
        <h1>당신에게 맞는<br /><span className="grad-text">기회를 찾아드립니다</span></h1>
        <p>AI 기반 스마트 채용 매칭 플랫폼 — 구직자와 기업을 연결합니다</p>
      </section>

      {/* Search */}
      <div className="search-bar-main">
        <Search size={18} color="var(--text2)" />
        <input
          className="search-input-main"
          placeholder="직무, 회사명, 키워드로 검색..."
          value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
        />
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="filter-select-wrap">
          <Briefcase size={14} />
          <select className="filter-select" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-select-wrap">
          <MapPin size={14} />
          <select className="filter-select" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="filter-select-wrap">
          <Star size={14} />
          <select className="filter-select" value={filters.experience} onChange={e => setFilters(f => ({ ...f, experience: e.target.value }))}>
            {EXPERIENCES.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="results-header">
        <span className="results-count">채용공고 <strong>{filtered.length}</strong>건</span>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}>
          <div className="loading-spinner" />
          <span>공고를 불러오는 중...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <h3>{filters.q || filters.category !== '전체' || filters.location !== '전체' ? '조건에 맞는 공고가 없습니다' : '등록된 공고가 없습니다'}</h3>
          <p>다른 검색어나 필터를 사용해보세요.</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {filtered.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  )
}
