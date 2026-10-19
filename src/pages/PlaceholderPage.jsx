import { ArrowRight, Construction } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function PlaceholderPage({ title, description }) {
  const navigate = useNavigate()

  return (
    <section className="placeholder-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ESTATEFLOW WORKSPACE</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
      </div>

      <div className="placeholder-card panel">
        <div className="placeholder-icon">
          <Construction size={25} />
        </div>
        <h2>This module is planned for an upcoming sprint</h2>
        <p>
          The route and navigation are ready. We’ll implement the real forms,
          data tables, filters, detail pages, and working actions in the
          relevant sprint.
        </p>
        <div className="placeholder-actions">
          <button className="button button-primary" onClick={() => navigate('/dashboard')}>
            Back to dashboard <ArrowRight size={16} />
          </button>
          <button
            className="button button-secondary"
            onClick={() => toast.info('We will implement this module according to the sprint roadmap.')}
          >
            View implementation status
          </button>
        </div>
      </div>
    </section>
  )
}
