import { Link } from 'react-router-dom'
import { MapPin, DollarSign, Clock, Briefcase } from 'lucide-react'

function fmtDate(date) {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function JobCard({ job }) {
  const endDate = job.endDate ? (job.endDate.toDate ? job.endDate.toDate() : new Date(job.endDate)) : null
  const isExpired = endDate && endDate < new Date()

  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div className="job-card-header">
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div className="job-company">{job.companyName}</div>
          <div className="job-title">{job.title}</div>
        </div>
        {job.isDirect && <span className="badge badge-direct">Direct</span>}
      </div>

      <div className="job-meta">
        {job.location && (
          <div className="job-meta-item"><MapPin size={12} />{job.location}</div>
        )}
        {job.salary?.max > 0 && (
          <div className="job-meta-item">
            <DollarSign size={12} />
            {job.salary.min > 0 ? `${job.salary.min.toLocaleString()}~` : ''}{job.salary.max.toLocaleString()}만원
          </div>
        )}
        {endDate && (
          <div className="job-meta-item"><Clock size={12} />마감 {fmtDate(endDate)}</div>
        )}
      </div>

      <div className="job-tags">
        {job.category && <span className="tag">{job.category}</span>}
        {job.experience && <span className="tag">{job.experience}</span>}
        {isExpired && <span className="tag tag-expired">마감</span>}
      </div>
    </Link>
  )
}
