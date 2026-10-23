import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  GitBranch,
  Handshake,
  ListTodo,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../features/auth/AuthContext'
import { clientService } from '../features/clients/clientService'
import { AGENTS, LEAD_STATUSES, leadService } from '../features/leads/leadService'
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  DEAL_STAGES,
  PIPELINE_STAGES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  appointmentService,
  dealService,
  taskService,
} from '../features/workflow/workflowService'
import '../styles/workflow.css'

const views = {
  '/pipeline': {
    key: 'pipeline',
    title: 'Sales Pipeline',
    description: 'Move leads forward through each stage of your sales workflow.',
  },
  '/deals': {
    key: 'deals',
    title: 'Deals',
    description: 'Track active opportunities, expected value, and closing dates.',
  },
  '/tasks': {
    key: 'tasks',
    title: 'Tasks & Follow-ups',
    description: 'Plan calls, emails, and follow-ups so every opportunity keeps moving.',
  },
  '/appointments': {
    key: 'appointments',
    title: 'Appointments',
    description: 'Schedule and manage client meetings, consultations, and property viewings.',
  },
}

const emptyForms = {
  deals: {
    title: '',
    contactName: '',
    leadId: '',
    propertyName: '',
    amount: '',
    stage: DEAL_STAGES[0],
    closeDate: '',
    assignedTo: AGENTS[0],
  },
  tasks: {
    title: '',
    contactName: '',
    leadId: '',
    type: TASK_TYPES[0],
    priority: 'Medium',
    status: 'Open',
    dueDate: '',
    assignedTo: AGENTS[0],
    description: '',
  },
  appointments: {
    title: '',
    contactName: '',
    leadId: '',
    type: APPOINTMENT_TYPES[0],
    startsAt: '',
    location: '',
    status: 'Scheduled',
    assignedTo: AGENTS[0],
    reminder: '1 day before',
  },
}

function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function dateInputValue(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function statusClass(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function stateTone(value = '') {
  const state = value.toLowerCase()
  if (['qualified', 'converted', 'closed won', 'completed'].includes(state)) return 'green'
  if (['lost', 'unqualified', 'closed lost', 'cancelled', 'overdue'].includes(state)) return 'red'
  if (['in progress', 'offer', 'under contract', 'negotiation', 'property viewing'].includes(state)) return 'purple'
  if (['due today', 'follow-ups due', 'appointment scheduled'].includes(state)) return 'amber'
  return 'blue'
}

function contactOptions(leads, clients) {
  return [
    ...leads.map((lead) => ({
      id: `lead:${lead.id}`,
      label: `${lead.name} · Lead`,
      name: lead.name,
      leadId: lead.id,
    })),
    ...clients.map((client) => ({
      id: `client:${client.id}`,
      label: `${client.name} · Client`,
      name: client.name,
      leadId: client.sourceLeadId || '',
    })),
  ]
}

function fetchWorkflowRecords() {
  return Promise.all([
    leadService.getAll(),
    clientService.getAll(),
    dealService.getAll(),
    taskService.getAll(),
    appointmentService.getAll(),
  ])
}

function ActivityList({ activities }) {
  if (!activities?.length) {
    return <p className="workflow-empty-inline">No activity has been recorded yet.</p>
  }

  return (
    <ol className="workflow-timeline">
      {[...activities]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((activity) => (
          <li key={activity.id}>
            <span className="workflow-timeline-dot" />
            <div>
              <strong>{activity.text}</strong>
              <small>{activity.author ? `${activity.author} · ` : ''}{formatDateTime(activity.createdAt)}</small>
            </div>
          </li>
        ))}
    </ol>
  )
}

function WorkflowForm({ type, form, setForm, contacts, agents, onClose, onSubmit, saving, error }) {
  const contactValue = form.leadId
    ? contacts.find((contact) => contact.leadId === form.leadId && contact.name === form.contactName)?.id || ''
    : contacts.find((contact) => contact.name === form.contactName)?.id || ''

  function field(name, label, options) {
    const value = form[name] ?? ''
    return (
      <label key={name} className={options?.full ? 'workflow-field-full' : ''}>
        <span className="workflow-field-label">
          {label}{options?.required && <span className="workflow-required-marker"> *</span>}
        </span>
        {options?.choices ? (
          <select
            required={options.required}
            value={value}
            onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
          >
            {options.choices.map((choice) => <option key={choice}>{choice}</option>)}
          </select>
        ) : options?.contact ? (
          <select
            value={contactValue}
            onChange={(event) => {
              const contact = contacts.find((item) => item.id === event.target.value)
              setForm((current) => ({
                ...current,
                contactName: contact?.name || '',
                leadId: contact?.leadId || '',
              }))
            }}
          >
            <option value="">Select a lead or client</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.label}</option>)}
          </select>
        ) : options?.textarea ? (
          <textarea
            rows={3}
            maxLength={1000}
            value={value}
            onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
            placeholder={options.placeholder}
          />
        ) : (
          <input
            required={options?.required}
            type={options?.inputType || 'text'}
            min={options?.min}
            step={options?.step}
            value={value}
            onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
            placeholder={options?.placeholder}
          />
        )}
      </label>
    )
  }

  const fields = type === 'deals'
    ? [
        field('title', 'Deal name', { required: true }),
        field('contactName', 'Related contact', { contact: true }),
        field('propertyName', 'Property / opportunity'),
        field('amount', 'Expected value', { inputType: 'number', min: 0, step: 1000, required: true }),
        field('stage', 'Deal stage', { choices: DEAL_STAGES }),
        field('closeDate', 'Expected close date', { inputType: 'date' }),
        field('assignedTo', 'Assigned agent', { choices: agents }),
      ]
    : type === 'tasks'
      ? [
          field('title', 'Task', { required: true }),
          field('contactName', 'Related contact', { contact: true }),
          field('type', 'Task type', { choices: TASK_TYPES }),
          field('priority', 'Priority', { choices: TASK_PRIORITIES }),
          field('status', 'Status', { choices: TASK_STATUSES }),
          field('dueDate', 'Due date', { inputType: 'date' }),
          field('assignedTo', 'Assigned agent', { choices: agents }),
          field('description', 'Description', { textarea: true, full: true, placeholder: 'Add context or next steps.' }),
        ]
      : [
          field('title', 'Appointment', { required: true }),
          field('contactName', 'Related contact', { contact: true }),
          field('type', 'Appointment type', { choices: APPOINTMENT_TYPES }),
          field('startsAt', 'Date and time', { inputType: 'datetime-local', required: true }),
          field('location', 'Location'),
          field('status', 'Status', { choices: APPOINTMENT_STATUSES }),
          field('reminder', 'Reminder', { choices: ['None', 'At appointment time', '15 minutes before', '1 hour before', '1 day before'] }),
          field('assignedTo', 'Assigned agent', { choices: agents }),
        ]

  return (
    <div className="workflow-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby="workflow-form-title">
        <header className="workflow-modal-header">
          <div>
            <span className="workflow-eyebrow">{type === 'deals' ? 'SALES OPPORTUNITY' : type === 'tasks' ? 'WORK ITEM' : 'CALENDAR EVENT'}</span>
            <h2 id="workflow-form-title">{form.id ? 'Edit' : 'Create'} {type === 'deals' ? 'deal' : type === 'tasks' ? 'task or follow-up' : 'appointment'}</h2>
            <p>Changes are saved in this browser workspace.</p>
          </div>
          <button className="workflow-icon-button" type="button" onClick={onClose} aria-label="Close form" disabled={saving}><X size={18} /></button>
        </header>
        <form className="workflow-form" onSubmit={onSubmit}>
          <div className="workflow-form-grid">{fields}</div>
          {error && <p className="workflow-form-error" role="alert">{error}</p>}
          <footer className="workflow-form-actions">
            <button className="workflow-secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="workflow-primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save changes' : 'Create'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function RecordDetails({ type, record, onClose, onEdit, onDelete, onAddNote, note, setNote, savingNote }) {
  const title = type === 'deals' ? record.title : type === 'tasks' ? record.title : record.title
  const details = type === 'deals'
    ? [['Contact', record.contactName || 'Not linked'], ['Property', record.propertyName || 'Not specified'], ['Value', formatCurrency(record.amount)], ['Stage', record.stage], ['Expected close', formatDate(record.closeDate)], ['Assigned to', record.assignedTo]]
    : type === 'tasks'
      ? [['Contact', record.contactName || 'Not linked'], ['Type', record.type], ['Priority', record.priority], ['Status', record.status], ['Due date', formatDate(record.dueDate)], ['Assigned to', record.assignedTo]]
      : [['Contact', record.contactName || 'Not linked'], ['Type', record.type], ['Date', formatDateTime(record.startsAt)], ['Location', record.location || 'Not specified'], ['Reminder', record.reminder || '1 day before'], ['Status', record.status], ['Assigned to', record.assignedTo]]

  return (
    <div className="workflow-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="workflow-modal workflow-detail-modal" role="dialog" aria-modal="true" aria-labelledby="workflow-detail-title">
        <header className="workflow-modal-header">
          <div>
            <span className="workflow-eyebrow">{type === 'deals' ? 'DEAL DETAILS' : type === 'tasks' ? 'TASK DETAILS' : 'APPOINTMENT DETAILS'}</span>
            <h2 id="workflow-detail-title">{title}</h2>
          </div>
          <button className="workflow-icon-button" type="button" onClick={onClose} aria-label="Close details"><X size={18} /></button>
        </header>
        <div className="workflow-detail-content">
          <div className="workflow-detail-actions">
            <button className="workflow-secondary-button" type="button" onClick={onEdit}><Edit3 size={15} /> Edit</button>
            <button className="workflow-danger-button" type="button" onClick={onDelete}><Trash2 size={15} /> Delete</button>
          </div>
          <div className="workflow-detail-grid">
            {details.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || 'Not assigned'}</strong></div>)}
          </div>
          {type === 'tasks' && record.description && <p className="workflow-detail-description">{record.description}</p>}
          <section className="workflow-detail-section">
            <div className="workflow-section-heading"><div><h3>Notes</h3><p>Keep context and next steps with this record.</p></div><MessageSquare size={17} /></div>
            <form className="workflow-note-form" onSubmit={onAddNote}>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={2} placeholder="Write a note…" aria-label="New note" />
              <button className="workflow-primary-button" type="submit" disabled={savingNote || !note.trim()}>{savingNote ? 'Adding…' : 'Add note'}</button>
            </form>
            {record.notes?.length ? (
              <ul className="workflow-notes-list">
                {record.notes.map((item) => <li key={item.id}><p>{item.text}</p><small>{item.author ? `${item.author} · ` : ''}{formatDateTime(item.createdAt)}</small></li>)}
              </ul>
            ) : <p className="workflow-empty-inline">No notes yet.</p>}
          </section>
          <section className="workflow-detail-section">
            <div className="workflow-section-heading"><div><h3>Activity timeline</h3><p>Recent changes and updates.</p></div><Clock3 size={17} /></div>
            <ActivityList activities={record.activities} />
          </section>
        </div>
      </section>
    </div>
  )
}

function PipelineBoard({ leads, onMove, onOpenLead }) {
  const [draggedId, setDraggedId] = useState('')

  return (
    <div className="workflow-kanban-viewport" aria-label="Lead sales pipeline">
      <div className="workflow-kanban">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((lead) => (lead.status || 'New') === stage)
          return (
            <section
              className="workflow-kanban-column"
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const id = event.dataTransfer.getData('text/plain') || draggedId
                if (id) onMove(id, stage)
                setDraggedId('')
              }}
            >
              <header><h2>{stage}</h2><span>{stageLeads.length}</span></header>
              <div className="workflow-kanban-cards">
                {stageLeads.map((lead) => (
                  <article className="workflow-lead-card" key={lead.id} draggable onDragStart={(event) => {
                    setDraggedId(lead.id)
                    event.dataTransfer.setData('text/plain', lead.id)
                  }} onDragEnd={() => setDraggedId('')}>
                    <button className="workflow-card-title" type="button" onClick={() => onOpenLead(lead)}>{lead.name}</button>
                    <p>{lead.leadType || 'Lead'} · {lead.location || lead.propertyType || 'Location not set'}</p>
                    <div className="workflow-card-meta">
                      <span className={`workflow-priority priority-${statusClass(lead.priority || 'medium')}`}>{lead.priority || 'Medium'} priority</span>
                      <strong>{formatCurrency(lead.budget)}</strong>
                    </div>
                    <div className="workflow-card-footer"><small>{lead.assignedTo || 'Unassigned'}</small></div>
                    <label className="workflow-stage-select"><span className="sr-only">Move {lead.name} to stage</span><select value={lead.status || 'New'} onChange={(event) => onMove(lead.id, event.target.value)}>{LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
                  </article>
                ))}
                {!stageLeads.length && <p className="workflow-column-empty">Drop a lead here</p>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function AppointmentCalendar({ appointments, onOpenAppointment }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const firstDay = startOfWeek(startOfMonth(month))
  const days = Array.from({ length: 42 }, (_, index) => addDays(firstDay, index))
  const selectedAppointments = appointments
    .filter((appointment) => appointment.startsAt?.slice(0, 10) === selectedDate)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  function changeMonth(amount) {
    const nextMonth = addMonths(month, amount)
    setMonth(nextMonth)
    setSelectedDate(format(startOfMonth(nextMonth), 'yyyy-MM-dd'))
  }

  return (
    <section className="workflow-calendar">
      <header className="workflow-calendar-header">
        <div><h2>Appointment calendar</h2><p>Choose a day to review scheduled appointments.</p></div>
        <div className="workflow-calendar-controls">
          <button type="button" className="workflow-icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <strong>{format(month, 'MMMM yyyy')}</strong>
          <button type="button" className="workflow-icon-button" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </header>

      <div className="workflow-calendar-grid" role="grid" aria-label={format(month, 'MMMM yyyy')}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span className="workflow-calendar-weekday" key={day}>{day}</span>)}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const count = appointments.filter((appointment) => appointment.startsAt?.slice(0, 10) === dateKey).length
          return (
            <button
              className={`workflow-calendar-day ${isSameMonth(day, month) ? '' : 'is-outside-month'} ${count ? 'has-appointments' : ''} ${dateKey === selectedDate ? 'is-selected' : ''}`}
              type="button"
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              aria-pressed={dateKey === selectedDate}
              aria-label={`${format(day, 'MMMM d, yyyy')}${count ? `, ${count} appointments` : ''}`}
            >
              <span className="workflow-calendar-date">{format(day, 'd')}</span>
              {count > 0 && <strong>{count} {count === 1 ? 'Appointment' : 'Appointments'}</strong>}
            </button>
          )
        })}
      </div>

      <div className="workflow-calendar-agenda">
        <h3>{format(new Date(`${selectedDate}T12:00:00`), 'EEEE, MMMM d')}</h3>
        {selectedAppointments.length ? selectedAppointments.map((appointment) => (
          <button className="workflow-calendar-event" key={appointment.id} type="button" onClick={() => onOpenAppointment(appointment)}>
            <span>{format(new Date(appointment.startsAt), 'h:mm a')}</span>
            <strong>{appointment.title}</strong>
            <small>{appointment.contactName || appointment.type}</small>
          </button>
        )) : <p>No appointments scheduled for this day.</p>}
      </div>
    </section>
  )
}

export default function SalesWorkflowPage() {
  const location = useLocation()
  const { user } = useAuth()
  const view = views[location.pathname] || views['/pipeline']
  const isAgent = user?.role === 'Agent'
  const agentOptions = user?.name && !AGENTS.includes(user.name) ? [...AGENTS, user.name] : AGENTS
  const [leads, setLeads] = useState([])
  const [clients, setClients] = useState([])
  const [deals, setDeals] = useState([])
  const [tasks, setTasks] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [filter, setFilter] = useState('All statuses')

  async function loadData() {
    setLoadError('')
    try {
      const [nextLeads, nextClients, nextDeals, nextTasks, nextAppointments] = await Promise.all([
        leadService.getAll(),
        clientService.getAll(),
        dealService.getAll(),
        taskService.getAll(),
        appointmentService.getAll(),
      ])
      setLeads(nextLeads)
      setClients(nextClients)
      setDeals(nextDeals)
      setTasks(nextTasks)
      setAppointments(nextAppointments)
    } catch (error) {
      setLoadError(error.message || 'Unable to load sales workflow records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchWorkflowRecords()
      .then(([nextLeads, nextClients, nextDeals, nextTasks, nextAppointments]) => {
        if (cancelled) return
        setLeads(nextLeads)
        setClients(nextClients)
        setDeals(nextDeals)
        setTasks(nextTasks)
        setAppointments(nextAppointments)
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message || 'Unable to load sales workflow records.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const contacts = useMemo(() => contactOptions(leads, clients), [leads, clients])
  const sourceRecords = view.key === 'deals' ? deals : view.key === 'tasks' ? tasks : appointments
  const visibleRecords = useMemo(() => sourceRecords.filter((record) => {
    if (isAgent && record.assignedTo !== user?.name) return false
    if (filter !== 'All statuses' && (record.stage || record.status) !== filter) return false
    const query = search.trim().toLowerCase()
    return !query || [record.title, record.contactName, record.propertyName, record.assignedTo, record.type].some((value) => String(value || '').toLowerCase().includes(query))
  }), [sourceRecords, isAgent, user?.name, filter, search])
  const visibleLeads = useMemo(() => leads.filter((lead) => !isAgent || lead.assignedTo === user?.name), [leads, isAgent, user?.name])
  const visibleAppointments = useMemo(
    () => appointments.filter((appointment) => !isAgent || appointment.assignedTo === user?.name),
    [appointments, isAgent, user?.name],
  )
  const leadFollowUps = useMemo(() => visibleLeads.filter((lead) => lead.followUpDate).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)), [visibleLeads])

  const stats = view.key === 'pipeline'
    ? [
        { label: 'Active leads', value: visibleLeads.filter((lead) => !['Converted', 'Lost', 'Unqualified'].includes(lead.status)).length, icon: GitBranch, tone: 'blue' },
        { label: 'Qualified', value: visibleLeads.filter((lead) => lead.status === 'Qualified').length, icon: CheckCircle2, tone: 'green' },
        { label: 'Follow-ups due', value: leadFollowUps.filter((lead) => lead.followUpDate <= new Date().toISOString().slice(0, 10)).length, icon: Clock3, tone: 'amber' },
      ]
    : view.key === 'deals'
      ? [
          { label: 'Open deals', value: visibleRecords.filter((record) => !['Closed Won', 'Closed Lost'].includes(record.stage)).length, icon: Handshake, tone: 'blue' },
          { label: 'Open value', value: formatCurrency(visibleRecords.filter((record) => !['Closed Won', 'Closed Lost'].includes(record.stage)).reduce((sum, record) => sum + Number(record.amount || 0), 0)), icon: CheckCircle2, tone: 'purple' },
          { label: 'Closed won', value: visibleRecords.filter((record) => record.stage === 'Closed Won').length, icon: CheckCircle2, tone: 'green' },
        ]
      : view.key === 'tasks'
        ? [
            { label: 'Open tasks', value: visibleRecords.filter((record) => record.status !== 'Completed').length, icon: ListTodo, tone: 'blue' },
            { label: 'Due today', value: visibleRecords.filter((record) => record.status !== 'Completed' && record.dueDate === new Date().toISOString().slice(0, 10)).length, icon: CalendarDays, tone: 'amber' },
            { label: 'Completed', value: visibleRecords.filter((record) => record.status === 'Completed').length, icon: CheckCircle2, tone: 'green' },
          ]
        : [
            { label: 'Upcoming', value: visibleRecords.filter((record) => record.status === 'Scheduled' && new Date(record.startsAt) >= new Date()).length, icon: CalendarDays, tone: 'blue' },
            { label: 'Completed', value: visibleRecords.filter((record) => record.status === 'Completed').length, icon: CheckCircle2, tone: 'green' },
            { label: 'Cancelled', value: visibleRecords.filter((record) => record.status === 'Cancelled').length, icon: X, tone: 'red' },
          ]

  function openCreate(preset = {}) {
    const nextForm = { ...emptyForms[view.key], assignedTo: isAgent ? user?.name || agentOptions[0] : agentOptions[0], ...preset }
    setForm(nextForm)
    setEditing(false)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(record) {
    setForm({
      ...emptyForms[view.key],
      ...record,
      id: record.id,
      amount: record.amount === undefined ? '' : String(record.amount),
      startsAt: dateInputValue(record.startsAt),
    })
    setEditing(true)
    setSelectedRecord(null)
    setFormError('')
    setModalOpen(true)
  }

  async function submitRecord(event) {
    event.preventDefault()
    setFormError('')
    if (!form.title?.trim()) {
      setFormError('Enter a name or title for this record.')
      return
    }
    if (view.key === 'deals' && (!Number.isFinite(Number(form.amount)) || Number(form.amount) < 0)) {
      setFormError('Deal value must be a valid non-negative amount.')
      return
    }
    if (view.key === 'appointments' && !form.startsAt) {
      setFormError('Choose an appointment date and time.')
      return
    }
    const service = view.key === 'deals' ? dealService : view.key === 'tasks' ? taskService : appointmentService
    const values = {
      ...form,
      title: form.title.trim(),
      assignedTo: isAgent ? user?.name || '' : form.assignedTo,
      ...(view.key === 'deals' ? { amount: Number(form.amount), closeDate: form.closeDate || '' } : {}),
      ...(view.key === 'tasks' ? { description: form.description.trim(), dueDate: form.dueDate || '' } : {}),
      ...(view.key === 'appointments' ? { location: form.location.trim() } : {}),
    }
    delete values.id
    setSaving(true)
    try {
      if (editing) await service.update(form.id, values)
      else await service.create(values)
      setModalOpen(false)
      await loadData()
      toast.success(editing ? 'Record updated.' : 'Record created.')
    } catch (error) {
      setFormError(error.message || 'Unable to save this record.')
    } finally {
      setSaving(false)
    }
  }

  async function moveLead(id, status) {
    const current = leads.find((lead) => lead.id === id)
    if (!current || current.status === status) return
    try {
      const updated = await leadService.update(id, { status })
      setLeads((records) => records.map((lead) => lead.id === id ? updated : lead))
      toast.success(`${current.name} moved to ${status}.`)
    } catch (error) {
      toast.error(error.message || 'Unable to update lead stage.')
    }
  }

  async function removeRecord(record) {
    if (!window.confirm(`Delete "${record.title}"? This cannot be undone.`)) return
    const service = view.key === 'deals' ? dealService : view.key === 'tasks' ? taskService : appointmentService
    try {
      await service.remove(record.id)
      setSelectedRecord(null)
      await loadData()
      toast.success('Record deleted.')
    } catch (error) {
      toast.error(error.message || 'Unable to delete this record.')
    }
  }

  async function addRecordNote(event) {
    event.preventDefault()
    if (!note.trim() || !selectedRecord) return
    setSavingNote(true)
    const service = view.key === 'deals' ? dealService : view.key === 'tasks' ? taskService : appointmentService
    try {
      const updated = await service.addNote(selectedRecord.id, note, user?.name || 'EstateFlow user')
      setSelectedRecord(updated)
      setNote('')
      await loadData()
      toast.success('Note added.')
    } catch (error) {
      toast.error(error.message || 'Unable to add note.')
    } finally {
      setSavingNote(false)
    }
  }

  async function changeTaskStatus(task, status) {
    try {
      await taskService.update(task.id, { status })
      await loadData()
    } catch (error) {
      toast.error(error.message || 'Unable to update task status.')
    }
  }

  async function changeAppointmentStatus(appointment, status) {
    try {
      await appointmentService.update(appointment.id, { status })
      await loadData()
    } catch (error) {
      toast.error(error.message || 'Unable to update appointment status.')
    }
  }

  async function saveLeadNote(event) {
    event.preventDefault()
    if (!selectedLead || !note.trim()) return
    try {
      const updated = await leadService.addNote(selectedLead.id, note, user?.name || 'EstateFlow user')
      setSelectedLead(updated)
      setNote('')
      await loadData()
      toast.success('Lead note added.')
    } catch (error) {
      toast.error(error.message || 'Unable to add lead note.')
    }
  }

  return (
    <section className="workflow-page">
      <header className="workflow-page-header">
        <div>
          <span className="workflow-eyebrow">SALES WORKSPACE</span>
          <b><h1>{view.title}</h1></b>
          <p>{view.description}</p>
        </div>
        {view.key !== 'pipeline' && <button className="workflow-primary-button" type="button" onClick={() => openCreate()}><Plus size={16} />{view.key === 'deals' ? 'Add deal' : view.key === 'tasks' ? 'Add task' : 'Schedule appointment'}</button>}
      </header>

      {loadError && <div className="workflow-error" role="alert"><strong>Unable to load sales workflow</strong><span>{loadError}</span><button type="button" onClick={loadData}>Try again</button></div>}
      {loading ? <div className="workflow-loading" role="status">Loading sales workflow…</div> : !loadError && (
        <>
          <div className="workflow-stats">
            {stats.map(({ label, value, icon: Icon, tone }) => <article className="workflow-stat-card" key={label}><span className={`workflow-stat-icon workflow-tone-${tone}`}><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}
          </div>
          {view.key === 'appointments' && (
            <AppointmentCalendar
              appointments={visibleAppointments}
              onOpenAppointment={(appointment) => {
                setSelectedRecord(appointment)
                setNote('')
              }}
            />
          )}
          {view.key === 'pipeline' ? (
            <>
              <div className="workflow-section-bar"><div><h2>Lead pipeline</h2><p>Drag leads between stages or use the stage selector.</p></div><span>{visibleLeads.length} leads</span></div>
              <PipelineBoard
                leads={visibleLeads}
                onMove={moveLead}
                onOpenLead={(lead) => { setSelectedLead(lead); setNote('') }}
              />
            </>
          ) : (
            <>
              {view.key === 'tasks' && leadFollowUps.length > 0 && (
                <section className="workflow-followups">
                  <div className="workflow-section-bar"><div><h2>Lead follow-ups</h2><p>Dates already scheduled on lead records.</p></div><span>{leadFollowUps.length} scheduled</span></div>
                  <div className="workflow-followup-list">
                    {leadFollowUps.map((lead) => <article key={lead.id}><div className="workflow-avatar">{initials(lead.name)}</div><div className="workflow-followup-copy"><strong>{lead.name}</strong><small>{lead.assignedTo || 'Unassigned'}</small></div><span className={lead.followUpDate < new Date().toISOString().slice(0, 10) ? 'workflow-overdue' : ''}><CalendarDays size={14} />{formatDate(lead.followUpDate)}</span><button className="workflow-secondary-button" type="button" onClick={() => openCreate({ title: `Follow up with ${lead.name}`, contactName: lead.name, leadId: lead.id, dueDate: lead.followUpDate })}><Plus size={14} />Create task</button></article>)}
                  </div>
                </section>
              )}
              <section className="workflow-records-panel">
                <div className="workflow-section-bar">
                  <div><h2>{view.key === 'deals' ? 'All deals' : view.key === 'tasks' ? 'All tasks' : 'All appointments'}</h2><p>Search, review details, update, and track activity.</p></div>
                  <div className="workflow-list-tools">
                    <label className="workflow-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records…" aria-label="Search records" /></label>
                    <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter by status">
                      <option>All statuses</option>
                      {(view.key === 'deals' ? DEAL_STAGES : view.key === 'tasks' ? TASK_STATUSES : APPOINTMENT_STATUSES).map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                </div>
                {visibleRecords.length === 0 ? <div className="workflow-empty"><ListTodo size={25} /><strong>No matching records</strong><p>Create a record or adjust your search and filters.</p></div> : (
                  <div className="workflow-record-list">
                    {visibleRecords.map((record) => (
                      <article className="workflow-record-row" key={record.id}>
                        <div className={`workflow-record-icon workflow-tone-${stateTone(record.stage || record.status)}`}>{view.key === 'deals' ? <Handshake size={18} /> : view.key === 'tasks' ? <CheckCircle2 size={18} /> : <CalendarDays size={18} />}</div>
                        <div className="workflow-record-main">
                          <button className="workflow-card-title" type="button" onClick={() => { setSelectedRecord(record); setNote('') }}>{record.title}</button>
                          <p><UserRound size={13} />{record.contactName || 'No contact linked'}<span>·</span>{record.assignedTo || 'Unassigned'}</p>
                        </div>
                        <div className="workflow-record-meta">
                          {view.key === 'deals' ? <><strong>{formatCurrency(record.amount)}</strong><small>Close {formatDate(record.closeDate)}</small></> : view.key === 'tasks' ? <><strong>{formatDate(record.dueDate)}</strong><small>{record.type} · {record.priority} priority</small></> : <><strong>{formatDateTime(record.startsAt)}</strong><small><MapPin size={12} />{record.location || record.type}</small></>}
                        </div>
                        <span className={`workflow-status status-${statusClass(record.stage || record.status)}`}>{record.stage || record.status}</span>
                        <div className="workflow-row-actions">
                          {view.key === 'tasks' && record.status !== 'Completed' && <button type="button" className="workflow-icon-button" onClick={() => changeTaskStatus(record, 'Completed')} aria-label="Complete task" title="Complete"><Check size={15} /></button>}
                          {view.key === 'appointments' && record.status === 'Scheduled' && <button type="button" className="workflow-icon-button" onClick={() => changeAppointmentStatus(record, 'Completed')} aria-label="Mark appointment completed" title="Mark completed"><Check size={15} /></button>}
                          <button type="button" className="workflow-icon-button" onClick={() => { setSelectedRecord(record); setNote('') }} aria-label={`View ${record.title}`} title="View details"><Eye size={15} /></button>
                          <button type="button" className="workflow-icon-button" onClick={() => openEdit(record)} aria-label={`Edit ${record.title}`} title="Edit"><Edit3 size={15} /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}

      {modalOpen && <WorkflowForm type={view.key} form={form} setForm={setForm} contacts={contacts} agents={isAgent ? [user?.name].filter(Boolean) : agentOptions} onClose={() => setModalOpen(false)} onSubmit={submitRecord} saving={saving} error={formError} />}
      {selectedRecord && <RecordDetails type={view.key} record={selectedRecord} onClose={() => setSelectedRecord(null)} onEdit={() => openEdit(selectedRecord)} onDelete={() => removeRecord(selectedRecord)} onAddNote={addRecordNote} note={note} setNote={setNote} savingNote={savingNote} />}
      {selectedLead && <div className="workflow-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedLead(null)}><section className="workflow-modal workflow-detail-modal" role="dialog" aria-modal="true" aria-labelledby="workflow-lead-title"><header className="workflow-modal-header"><div><span className="workflow-eyebrow">LEAD ACTIVITY</span><h2 id="workflow-lead-title">{selectedLead.name}</h2><p>{selectedLead.status} · {selectedLead.assignedTo || 'Unassigned'}</p></div><button className="workflow-icon-button" type="button" onClick={() => setSelectedLead(null)} aria-label="Close lead activity"><X size={18} /></button></header><div className="workflow-detail-content"><section className="workflow-detail-section"><div className="workflow-section-heading"><div><h3>Notes</h3><p>Lead notes and timeline are also available on the lead profile.</p></div><MessageSquare size={17} /></div><form className="workflow-note-form" onSubmit={saveLeadNote}><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1000} placeholder="Write a note…" aria-label="New lead note" /><button className="workflow-primary-button" type="submit" disabled={!note.trim()}>Add note</button></form>{selectedLead.notes?.length ? <ul className="workflow-notes-list">{selectedLead.notes.map((item) => <li key={item.id}><p>{item.text}</p><small>{item.author ? `${item.author} · ` : ''}{formatDateTime(item.createdAt)}</small></li>)}</ul> : <p className="workflow-empty-inline">No notes yet.</p>}</section><section className="workflow-detail-section"><div className="workflow-section-heading"><div><h3>Activity timeline</h3><p>Lead status and follow-up history.</p></div><Clock3 size={17} /></div><ActivityList activities={selectedLead.activities} /></section></div></section></div>}
    </section>
  )
}
