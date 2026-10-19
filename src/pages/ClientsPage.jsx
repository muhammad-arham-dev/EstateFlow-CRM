import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Edit3,
  Eye,
  Filter,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../features/auth/AuthContext'
import {
  clientService,
  CLIENT_AGENTS,
  CLIENT_PROPERTY_TYPES,
  CLIENT_TYPES,
} from '../features/clients/clientService'
import '../styles/clients.css'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  clientType: 'Buyer',
  budget: '',
  preferredLocation: '',
  propertyType: 'Single Family',
  bedrooms: '0',
  bathrooms: '0',
  notesText: '',
  assignedTo: CLIENT_AGENTS[0],
  source: 'Manual entry',
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function formatDate(value, withTime = false) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(
    'en-US',
    withTime
      ? {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }
      : {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
  ).format(date)
}

function formatBudget(value, type) {
  if (value === '' || value === null || value === undefined) {
    return 'Not specified'
  }

  const amount = Number(value)

  if (!Number.isFinite(amount)) return 'Not specified'

  return (
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount) + (type === 'Renter' ? ' / mo' : '')
  )
}

function statusClass(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function ClientFormModal({
  client,
  form,
  setForm,
  agents,
  saving,
  onClose,
  onSubmit,
}) {
  const editing = Boolean(client)

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div
      className="clients-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <section
        className="clients-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
      >
        <header className="clients-modal-header">
          <div>
            <span className="clients-eyebrow">CLIENT RECORD</span>
            <h2 id="client-modal-title">
              {editing ? 'Edit client' : 'Add a client'}
            </h2>
            <p>
              {editing
                ? 'Keep contact and property preferences up to date.'
                : 'Add a client to your relationship database.'}
            </p>
          </div>

          <button
            className="clients-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close form"
            disabled={saving}
          >
            <X size={19} />
          </button>
        </header>

        <form className="clients-form" onSubmit={onSubmit}>
          <div className="clients-form-grid">
            <label>
              Full name <span>*</span>
              <input
                autoFocus
                required
                maxLength={100}
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="e.g. Olivia Bennett"
              />
            </label>

            <label>
              Email address <span>*</span>
              <input
                type="email"
                required
                maxLength={254}
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="name@example.com"
              />
            </label>

            <label>
              Phone number <span>*</span>
              <input
                type="tel"
                required
                maxLength={30}
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </label>

            <label>
              Client type <span>*</span>
              <select
                required
                value={form.clientType}
                onChange={(event) => update('clientType', event.target.value)}
              >
                {CLIENT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="clients-form-full">
              Address
              <input
                maxLength={180}
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
                placeholder="Street, city, state, ZIP"
              />
            </label>

            <label>
              Budget {form.clientType === 'Renter' ? '(monthly)' : ''}
              <input
                type="number"
                min="0"
                step="100"
                value={form.budget}
                onChange={(event) => update('budget', event.target.value)}
                placeholder={
                  form.clientType === 'Renter' ? 'e.g. 3000' : 'e.g. 650000'
                }
              />
            </label>

            <label>
              Preferred location
              <input
                maxLength={120}
                value={form.preferredLocation}
                onChange={(event) =>
                  update('preferredLocation', event.target.value)
                }
                placeholder="e.g. Austin, TX"
              />
            </label>

            <label>
              Property type
              <select
                value={form.propertyType}
                onChange={(event) => update('propertyType', event.target.value)}
              >
                {CLIENT_PROPERTY_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Assigned agent
              <select
                value={form.assignedTo}
                onChange={(event) => update('assignedTo', event.target.value)}
              >
                {agents.map((agent) => (
                  <option key={agent}>{agent}</option>
                ))}
              </select>
            </label>

            <label>
              Bedrooms
              <input
                type="number"
                min="0"
                max="100"
                value={form.bedrooms}
                onChange={(event) => update('bedrooms', event.target.value)}
              />
            </label>

            <label>
              Bathrooms
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.bathrooms}
                onChange={(event) => update('bathrooms', event.target.value)}
              />
            </label>

            {!editing && (
              <label className="clients-form-full">
                Initial note
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.notesText}
                  onChange={(event) => update('notesText', event.target.value)}
                  placeholder="Add preferences, context, or next steps (optional)."
                />
              </label>
            )}
          </div>

          <footer className="clients-form-actions">
            <button
              className="clients-secondary-button"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="clients-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                'Saving…'
              ) : (
                <>
                  {editing ? <Check size={16} /> : <Plus size={16} />}
                  {editing ? 'Save changes' : 'Create client'}
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ClientDetail({
  client,
  onBack,
  onEdit,
  onDelete,
  onAddNote,
  isAgent,
}) {
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const timeline = useMemo(
    () =>
      [
        ...(client.activities || []).map((activity) => ({
          ...activity,
          kind: 'activity',
        })),
        ...(client.notes || [])
          .filter(
            (note) =>
              !(client.activities || []).some(
                (activity) =>
                  activity.type === 'note' &&
                  activity.text?.includes(note.text),
              ),
          )
          .map((note) => ({
            id: note.id,
            type: 'note',
            text: `Note added: ${note.text}`,
            createdAt: note.createdAt,
            author: note.author,
            kind: 'note',
          })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      ),
    [client.activities, client.notes],
  )

  async function submitNote(event) {
    event.preventDefault()

    if (!noteText.trim()) return

    setSavingNote(true)

    try {
      await onAddNote(client.id, noteText.trim())
      setNoteText('')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <section className="clients-page clients-detail-page">
      <button
        className="clients-back-link"
        type="button"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Back to clients
      </button>

      <header className="clients-detail-hero">
        <div className="clients-detail-identity">
          <div className="clients-avatar clients-avatar-large">
            {initials(client.name)}
          </div>

          <div className="clients-detail-title">
            <span className="clients-eyebrow">CLIENT PROFILE</span>
            <h1>{client.name}</h1>

            <div className="clients-detail-meta">
              <span
                className={`clients-type-pill type-${statusClass(client.clientType)}`}
              >
                {client.clientType}
              </span>
              <span>Client since {formatDate(client.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="clients-detail-actions">
          <button
            className="clients-secondary-button"
            type="button"
            onClick={() => onEdit(client)}
          >
            <Edit3 size={15} />
            Edit profile
          </button>

          {!isAgent && (
            <button
              className="clients-danger-button"
              type="button"
              onClick={() => onDelete(client)}
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}
        </div>
      </header>

      <div className="clients-detail-grid">
        <div className="clients-detail-main">
          <section className="clients-panel">
            <div className="clients-panel-heading">
              <div>
                <h2>Contact information</h2>
                <p>Core details for this client relationship.</p>
              </div>
              <UserRound size={19} />
            </div>

            <div className="clients-contact-grid">
              <div className="clients-contact-item">
                <Mail size={17} />
                <div>
                  <span>Email address</span>
                  <a href={`mailto:${client.email}`}>{client.email}</a>
                </div>
              </div>

              <div className="clients-contact-item">
                <Phone size={17} />
                <div>
                  <span>Phone number</span>
                  <a href={`tel:${client.phone}`}>{client.phone}</a>
                </div>
              </div>

              <div className="clients-contact-item">
                <MapPin size={17} />
                <div>
                  <span>Address</span>
                  <strong>{client.address || 'Not provided'}</strong>
                </div>
              </div>

              <div className="clients-contact-item">
                <UserRound size={17} />
                <div>
                  <span>Assigned agent</span>
                  <strong>{client.assignedTo || 'Unassigned'}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="clients-panel">
            <div className="clients-panel-heading">
              <div>
                <h2>Property preferences</h2>
                <p>What this client is looking for.</p>
              </div>
              <Building2 size={19} />
            </div>

            <div className="clients-preference-grid">
              <div>
                <span>
                  Budget {client.clientType === 'Renter' ? '(monthly)' : ''}
                </span>
                <strong>{formatBudget(client.budget, client.clientType)}</strong>
              </div>

              <div>
                <span>Property type</span>
                <strong>{client.propertyType || 'Not specified'}</strong>
              </div>

              <div>
                <span>Preferred location</span>
                <strong>{client.preferredLocation || 'Not specified'}</strong>
              </div>

              <div>
                <span>Bedrooms</span>
                <strong>{client.bedrooms ?? 0}</strong>
              </div>

              <div>
                <span>Bathrooms</span>
                <strong>{client.bathrooms ?? 0}</strong>
              </div>

              <div>
                <span>Lead source</span>
                <strong>{client.source || 'Manual entry'}</strong>
              </div>
            </div>
          </section>

          <section className="clients-panel">
            <div className="clients-panel-heading">
              <div>
                <h2>Activity timeline</h2>
                <p>Client updates and relationship history.</p>
              </div>
              <Clock3 size={19} />
            </div>

            {timeline.length === 0 ? (
              <div className="clients-empty-inline">
                <CalendarDays size={22} />
                <p>No activity recorded yet.</p>
                <span>Notes and updates will appear here.</span>
              </div>
            ) : (
              <div className="clients-timeline">
                {timeline.map((activity) => (
                  <article
                    className="clients-timeline-item"
                    key={activity.id}
                  >
                    <span
                      className={`clients-timeline-dot dot-${statusClass(activity.type)}`}
                    />

                    <div className="clients-timeline-copy">
                      <div className="clients-timeline-top">
                        <strong>{activity.text}</strong>
                        <time>{formatDate(activity.createdAt, true)}</time>
                      </div>
                      {activity.author && <small>By {activity.author}</small>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="clients-detail-side">
          <section className="clients-panel clients-note-panel">
            <div className="clients-panel-heading">
              <div>
                <h2>Add a note</h2>
                <p>Record a conversation or next step.</p>
              </div>
              <MessageSquare size={19} />
            </div>

            <form className="clients-note-form" onSubmit={submitNote}>
              <textarea
                rows={4}
                maxLength={2000}
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Write a note about this client…"
                aria-label="Client note"
              />

              <button
                className="clients-primary-button"
                type="submit"
                disabled={!noteText.trim() || savingNote}
              >
                {savingNote ? (
                  'Saving…'
                ) : (
                  <>
                    <Plus size={15} />
                    Add note
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="clients-panel clients-summary-panel">
            <h2>Record summary</h2>

            <div>
              <span>Client ID</span>
              <strong>{client.id}</strong>
            </div>

            <div>
              <span>Created</span>
              <strong>{formatDate(client.createdAt)}</strong>
            </div>

            <div>
              <span>Last updated</span>
              <strong>
                {formatDate(client.updatedAt || client.createdAt)}
              </strong>
            </div>

            {client.sourceLeadId && (
              <div>
                <span>Converted from</span>
                <Link to="/leads">
                  Lead record <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}

export default function ClientsPage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAgent = user?.role === 'Agent'

  const agents =
    user?.name && !CLIENT_AGENTS.includes(user.name)
      ? [...CLIENT_AGENTS, user.name]
      : CLIENT_AGENTS

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [agentFilter, setAgentFilter] = useState('All agents')
  const [sortOrder, setSortOrder] = useState('newest')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadClients = useCallback(async () => {
    setLoadError('')
    const data = await clientService.getAll()
    setClients(data)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchClients() {
      try {
        const data = await clientService.getAll()

        if (!cancelled) setClients(data)
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || 'Unable to load clients.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchClients()

    return () => {
      cancelled = true
    }
  }, [])

  const visibleClients = useMemo(() => {
    const query = search.trim().toLowerCase()

    return clients
      .filter((client) => {
        if (isAgent && client.assignedTo !== user?.name) return false

        const matchesSearch =
          !query ||
          [
            client.name,
            client.email,
            client.phone,
            client.address,
            client.preferredLocation,
            client.assignedTo,
          ].some((value) =>
            String(value || '').toLowerCase().includes(query),
          )

        const matchesType =
          typeFilter === 'All types' || client.clientType === typeFilter

        const matchesAgent =
          agentFilter === 'All agents' || client.assignedTo === agentFilter

        return matchesSearch && matchesType && matchesAgent
      })
      .sort((a, b) =>
        sortOrder === 'oldest'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : sortOrder === 'name'
            ? a.name.localeCompare(b.name)
            : new Date(b.createdAt) - new Date(a.createdAt),
      )
  }, [
    clients,
    search,
    typeFilter,
    agentFilter,
    sortOrder,
    isAgent,
    user?.name,
  ])

  const pageCount = Math.max(
    1,
    Math.ceil(visibleClients.length / pageSize),
  )
  const safePage = Math.min(page, pageCount)

  const paginatedClients = visibleClients.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )

  const selectedClient =
    clients.find((client) => client.id === clientId) || null

  const stats = useMemo(() => {
    const scoped = clients.filter(
      (client) => !isAgent || client.assignedTo === user?.name,
    )

    return [
      {
        label: 'Total clients',
        value: scoped.length,
        detail: 'Client records',
        icon: Users,
        tone: 'blue',
      },
      {
        label: 'Buyers',
        value: scoped.filter((client) => client.clientType === 'Buyer').length,
        detail: 'Purchase prospects',
        icon: Building2,
        tone: 'purple',
      },
      {
        label: 'Sellers',
        value: scoped.filter((client) => client.clientType === 'Seller').length,
        detail: 'Property owners',
        icon: UserRound,
        tone: 'green',
      },
      {
        label: 'Investors',
        value: scoped.filter((client) => client.clientType === 'Investor')
          .length,
        detail: 'Investment clients',
        icon: CircleDollarSign,
        tone: 'orange',
      },
    ]
  }, [clients, isAgent, user?.name])

  function openCreate() {
    setEditingClient(null)
    setForm({
      ...emptyForm,
      assignedTo: isAgent
        ? user?.name || CLIENT_AGENTS[0]
        : agents[0] || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(client) {
    setEditingClient(client)

    setForm({
      ...emptyForm,
      ...client,
      budget:
        client.budget === null || client.budget === undefined
          ? ''
          : String(client.budget),
      bedrooms: String(client.bedrooms ?? 0),
      bathrooms: String(client.bathrooms ?? 0),
      notesText: '',
    })

    setFormError('')
    setModalOpen(true)
  }

  async function submitClient(event) {
    event.preventDefault()
    setFormError('')

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Name, email, and phone number are required.')
      return
    }

    if (
      form.budget !== '' &&
      (!Number.isFinite(Number(form.budget)) || Number(form.budget) < 0)
    ) {
      setFormError('Budget must be a valid non-negative number.')
      return
    }

    setSaving(true)

    const values = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      clientType: form.clientType,
      budget: form.budget === '' ? '' : Number(form.budget),
      preferredLocation: form.preferredLocation.trim(),
      propertyType: form.propertyType,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      assignedTo: isAgent ? user?.name : form.assignedTo,
      source: editingClient?.source || 'Manual entry',
    }

    try {
      let saved

      if (editingClient) {
        saved = await clientService.update(
          editingClient.id,
          values,
          user?.name || 'EstateFlow user',
        )
        toast.success('Client updated successfully.')
      } else {
        saved = await clientService.create(
          values,
          user?.name || 'EstateFlow user',
        )

        if (form.notesText.trim()) {
          await clientService.addNote(
            saved.id,
            form.notesText.trim(),
            user?.name || 'EstateFlow user',
          )
        }

        toast.success('Client created successfully.')
      }

      await loadClients()
      setModalOpen(false)
      setEditingClient(null)

      if (clientId) navigate(`/clients/${saved.id}`)
    } catch (error) {
      setFormError(error.message || 'Unable to save this client.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteClient(client) {
    if (
      !window.confirm(
        `Delete ${client.name}'s client record? This action cannot be undone.`,
      )
    ) {
      return
    }

    try {
      await clientService.remove(client.id)
      await loadClients()
      toast.success('Client deleted.')

      if (clientId === client.id) navigate('/clients')
    } catch (error) {
      toast.error(error.message || 'Unable to delete this client.')
    }
  }

  async function addNote(id, text) {
    try {
      await clientService.addNote(
        id,
        text,
        user?.name || 'EstateFlow user',
      )
      await loadClients()
      toast.success('Note added to client timeline.')
    } catch (error) {
      toast.error(error.message || 'Unable to add note.')
      throw error
    }
  }

  function resetFilters() {
    setSearch('')
    setTypeFilter('All types')
    setAgentFilter('All agents')
    setSortOrder('newest')
    setPage(1)
  }

  if (clientId) {
    if (loading) {
      return (
        <section className="clients-page">
          <div className="clients-state-card" role="status">
            Loading client profile…
          </div>
        </section>
      )
    }

    if (loadError) {
      return (
        <section className="clients-page">
          <div className="clients-state-card">
            <h2>Unable to load client</h2>
            <p>{loadError}</p>
            <button
              className="clients-primary-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </section>
      )
    }

    if (
      !selectedClient ||
      (isAgent && selectedClient.assignedTo !== user?.name)
    ) {
      return (
        <section className="clients-page">
          <div className="clients-state-card">
            <h2>Client not found</h2>
            <p>
              This client may have been removed or you may not have access to it.
            </p>
            <button
              className="clients-primary-button"
              onClick={() => navigate('/clients')}
            >
              Back to clients
            </button>
          </div>
        </section>
      )
    }

    return (
      <>
        <ClientDetail
          client={selectedClient}
          onBack={() => navigate('/clients')}
          onEdit={openEdit}
          onDelete={deleteClient}
          onAddNote={addNote}
          isAgent={isAgent}
        />

        {modalOpen && (
          <ClientFormModal
            client={editingClient}
            form={form}
            setForm={setForm}
            agents={isAgent ? [user?.name].filter(Boolean) : agents}
            saving={saving}
            onClose={() => setModalOpen(false)}
            onSubmit={submitClient}
          />
        )}

        {formError && modalOpen && (
          <div className="clients-form-error-global" role="alert">
            {formError}
          </div>
        )}
      </>
    )
  }

  return (
    <section className="clients-page">
      <header className="clients-page-header">
        <div>
          <span className="clients-eyebrow">CRM WORKSPACE</span>
          <b><h1>Clients</h1></b>
          <p>
            Build stronger relationships and keep every client detail in one
            place.
          </p>
        </div>

        <button
          className="clients-primary-button"
          type="button"
          onClick={openCreate}
        >
          <Plus size={17} />
          Add client
        </button>
      </header>

      <div className="clients-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <article className="clients-stat-card" key={stat.label}>
              <div className={`clients-stat-icon tone-${stat.tone}`}>
                <Icon size={19} />
              </div>
              <div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </div>
            </article>
          )
        })}
      </div>

      <section className="clients-list-card">
        <div className="clients-list-heading">
          <div>
            <h2>All clients</h2>
            <p>Browse and manage your client relationships.</p>
          </div>
          <span className="clients-result-count">
            {visibleClients.length}{' '}
            {visibleClients.length === 1 ? 'client' : 'clients'}
          </span>
        </div>

        <div className="clients-toolbar">
          <label className="clients-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search name, email, phone…"
              aria-label="Search clients"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>

          <label className="clients-filter">
            <Filter size={15} />
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by client type"
            >
              <option>All types</option>
              {CLIENT_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>

          {!isAgent && (
            <label className="clients-filter">
              <UserRound size={15} />
              <select
                value={agentFilter}
                onChange={(event) => {
                  setAgentFilter(event.target.value)
                  setPage(1)
                }}
                aria-label="Filter by assigned agent"
              >
                <option>All agents</option>
                {agents.map((agent) => (
                  <option key={agent}>{agent}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
          )}

          <label className="clients-filter clients-sort">
            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value)
                setPage(1)
              }}
              aria-label="Sort clients"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>
            <ChevronDown size={14} />
          </label>

          {(search ||
            typeFilter !== 'All types' ||
            agentFilter !== 'All agents' ||
            sortOrder !== 'newest') && (
            <button
              className="clients-reset-button"
              type="button"
              onClick={resetFilters}
            >
              Reset
            </button>
          )}
        </div>

        {loading ? (
          <div className="clients-state-card" role="status">
            <span className="clients-spinner" />
            Loading clients…
          </div>
        ) : loadError ? (
          <div className="clients-state-card">
            <h2>Couldn’t load clients</h2>
            <p>{loadError}</p>
            <button
              className="clients-primary-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : paginatedClients.length === 0 ? (
          <div className="clients-empty-state">
            <div className="clients-empty-icon">
              <Users size={24} />
            </div>
            <h3>
              {clients.length === 0 ? 'No clients yet' : 'No matching clients'}
            </h3>
            <p>
              {clients.length === 0
                ? 'Create a client record or convert a qualified lead to get started.'
                : 'Try a different search or clear your filters.'}
            </p>
            {clients.length === 0 ? (
              <button
                className="clients-primary-button"
                onClick={openCreate}
              >
                <Plus size={16} />
                Add your first client
              </button>
            ) : (
              <button
                className="clients-secondary-button"
                onClick={resetFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="clients-table-wrap">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th>Budget</th>
                    <th>Assigned agent</th>
                    <th>Added</th>
                      <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {paginatedClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <button
                          className="clients-name-cell"
                          type="button"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <span className="clients-avatar">
                            {initials(client.name)}
                          </span>
                          <span>
                            <strong>{client.name}</strong>
                            <small>
                              {client.preferredLocation ||
                                client.address ||
                                'Location not specified'}
                            </small>
                          </span>
                        </button>
                      </td>

                      <td>
                        <span
                          className={`clients-type-pill type-${statusClass(client.clientType)}`}
                        >
                          {client.clientType || 'Buyer'}
                        </span>
                      </td>

                      <td>
                        <div className="clients-contact-cell">
                          <span>{client.email}</span>
                          <small>{client.phone}</small>
                        </div>
                      </td>

                      <td>
                        <strong className="clients-budget">
                          {formatBudget(client.budget, client.clientType)}
                        </strong>
                      </td>

                      <td>
                        <span className="clients-agent-cell">
                          <span className="clients-agent-avatar">
                            {initials(client.assignedTo || '?')}
                          </span>
                          {client.assignedTo || 'Unassigned'}
                        </span>
                      </td>

                      <td>
                        <span className="clients-date-cell">
                          {formatDate(client.createdAt)}
                        </span>
                      </td>

                      <td>
                        <div className="clients-row-actions">
                          <button
                            type="button"
                            className="clients-row-action"
                            aria-label={`View ${client.name}`}
                            title="View profile"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="clients-row-action"
                            aria-label={`Edit ${client.name}`}
                            title="Edit client"
                            onClick={() => openEdit(client)}
                          >
                            <Edit3 size={15} />
                          </button>

                          {!isAgent && (
                            <button
                              type="button"
                              className="clients-row-action clients-row-delete"
                              aria-label={`Delete ${client.name}`}
                              title="Delete client"
                              onClick={() => deleteClient(client)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="clients-pagination">
              <span>
                Showing{' '}
                <strong>
                  {(safePage - 1) * pageSize + 1}–
                  {Math.min(safePage * pageSize, visibleClients.length)}
                </strong>{' '}
                of <strong>{visibleClients.length}</strong> clients
              </span>

              <div className="clients-pagination-controls">
                <label>
                  Rows{' '}
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    aria-label="Rows per page"
                  >
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={20}>20</option>
                  </select>
                </label>

                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage <= 1}
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                >
                  <ArrowLeft size={15} />
                </button>

                <span>
                  Page {safePage} of {pageCount}
                </span>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={safePage >= pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {modalOpen && (
        <ClientFormModal
          client={editingClient}
          form={form}
          setForm={setForm}
          agents={isAgent ? [user?.name].filter(Boolean) : agents}
          saving={saving}
          onClose={() => {
            setModalOpen(false)
            setFormError('')
          }}
          onSubmit={submitClient}
        />
      )}

      {modalOpen && formError && (
        <div className="clients-form-error-global" role="alert">
          {formError}
        </div>
      )}
    </section>
  )
}
