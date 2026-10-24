import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Building2, CalendarDays, ClipboardCheck, Handshake, House, Search, Users } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { clientService } from '../features/clients/clientService'
import { leadService } from '../features/leads/leadService'
import { propertyService } from '../features/properties/propertyService'
import { appointmentService, dealService, taskService } from '../features/workflow/workflowService'
import '../styles/team-tools.css'

const searchableCollections = [
  { key: 'leads', label: 'Lead', path: '/leads', icon: Users, searchField: 'name' },
  { key: 'clients', label: 'Client', path: '/clients', icon: Users, searchField: 'name' },
  { key: 'properties', label: 'Property', path: '/properties', icon: House, searchField: 'title' },
  { key: 'deals', label: 'Deal', path: '/deals', icon: Handshake, searchField: 'title' },
  { key: 'tasks', label: 'Task', path: '/tasks', icon: ClipboardCheck, searchField: 'title' },
  { key: 'appointments', label: 'Appointment', path: '/appointments', icon: CalendarDays, searchField: 'title' },
]

function recordSubtitle(record, type) {
  if (type === 'leads' || type === 'clients') {
    return [record.email, record.phone, record.status || record.clientType].filter(Boolean).join(' · ')
  }
  if (type === 'properties') {
    return [record.address, record.city, record.state, record.status].filter(Boolean).join(' · ')
  }
  return [record.contactName, record.stage || record.status, record.assignedTo].filter(Boolean).join(' · ')
}

function highlightMatches(text, query) {
  const value = String(text || '')
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return value

  const fragments = []
  const normalizedValue = value.toLocaleLowerCase()
  const normalizedNeedle = normalizedQuery.toLocaleLowerCase()
  let cursor = 0
  let matchIndex = normalizedValue.indexOf(normalizedNeedle, cursor)

  while (matchIndex !== -1) {
    if (matchIndex > cursor) fragments.push(value.slice(cursor, matchIndex))
    fragments.push(
      <mark key={`${matchIndex}-${fragments.length}`}>
        {value.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </mark>,
    )
    cursor = matchIndex + normalizedQuery.length
    matchIndex = normalizedValue.indexOf(normalizedNeedle, cursor)
  }

  if (!fragments.length) return value
  if (cursor < value.length) fragments.push(value.slice(cursor))
  return fragments
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const query = searchParams.get('q') || ''
  const [records, setRecords] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    let requestId = 0

    const loadRecords = () => {
      const currentRequestId = ++requestId
      Promise.all([
        leadService.getAll(),
        clientService.getAll(),
        propertyService.getAll(),
        dealService.getAll(),
        taskService.getAll(),
        appointmentService.getAll(),
      ])
        .then((values) => {
          if (cancelled || currentRequestId !== requestId) return
          setRecords(Object.fromEntries(searchableCollections.map((collection, index) => [collection.key, values[index]])))
          setLoadError('')
        })
        .catch((error) => {
          if (!cancelled && currentRequestId === requestId) {
            setLoadError(error.message || 'Unable to search CRM records.')
          }
        })
    }

    loadRecords()
    window.addEventListener('estateflow:data-changed', loadRecords)
    return () => {
      cancelled = true
      window.removeEventListener('estateflow:data-changed', loadRecords)
    }
  }, [])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const results = !records || !normalizedQuery
    ? []
    : searchableCollections.flatMap((collection) =>
      (records[collection.key] || [])
        .filter((record) => user?.role !== 'Agent' || record.assignedTo === user.name)
        .filter((record) =>
          String(record[collection.searchField] || '').toLocaleLowerCase().includes(normalizedQuery),
        )
        .map((record) => ({ ...record, collection })),
    )

  function openRecord(result) {
    if (result.collection.key === 'clients' || result.collection.key === 'properties') {
      navigate(`${result.collection.path}/${encodeURIComponent(result.id)}`)
      return
    }
    navigate(result.collection.path, { state: { recordId: result.id } })
  }

  return (
    <section className="search-page">
      <header className="search-page-header">
        <div>
          <span className="search-eyebrow">WORKSPACE SEARCH</span>
          <b><h1>Search</h1></b>
          <p>Find leads, clients, properties, deals, tasks, and appointments.</p>
        </div>
      </header>

      <form
        className="search-page-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          const value = new FormData(event.currentTarget).get('query')?.toString().trim() || ''
          setSearchParams(value ? { q: value } : {})
        }}
      >
        <Search size={18} aria-hidden="true" />
        <input
          key={query}
          name="query"
          type="search"
          defaultValue={query}
          placeholder="Search lead, client, or record names…"
          aria-label="Search all CRM records"
        />
        <button type="submit">Search</button>
      </form>

      {loadError && <p className="search-state search-error" role="alert">{loadError}</p>}
      {!records && !loadError && <p className="search-state" role="status">Loading CRM records…</p>}
      {records && !query.trim() && <p className="search-state">Enter a search term to find matching CRM records.</p>}
      {records && query.trim() && (
        <>
          <div className="search-results-heading">
            <h2>Results</h2>
            <span>{results.length} {results.length === 1 ? 'record' : 'records'}</span>
          </div>
          <div className="search-results">
            {results.map((result) => {
              const Icon = result.collection.icon || Building2
              return (
                <button
                  className="search-result"
                  type="button"
                  key={`${result.collection.key}-${result.id}`}
                  onClick={() => openRecord(result)}
                >
                  <span className="search-result-icon"><Icon size={17} /></span>
                  <span className="search-result-copy">
                    <small>{result.collection.label}</small>
                    <strong>{highlightMatches(result.name || result.title || 'Untitled record', query)}</strong>
                    <span>{recordSubtitle(result, result.collection.key) || 'No additional details'}</span>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              )
            })}
            {!results.length && <p className="search-state">No records matched “{query.trim()}”.</p>}
          </div>
        </>
      )}
    </section>
  )
}
