import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Edit3,
  Eye,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { agentService } from '../features/agents/agentService'
import { AGENTS, leadService } from '../features/leads/leadService'
import { clientService } from '../features/clients/clientService'
import { propertyService } from '../features/properties/propertyService'
import { appointmentService, dealService, taskService } from '../features/workflow/workflowService'
import '../styles/team-tools.css'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default function AgentsPage() {
  const [records, setRecords] = useState(null)
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState('')
  const [editingAgent, setEditingAgent] = useState(null)
  const [viewingAgent, setViewingAgent] = useState(null)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    city: '',
    dateOfBirth: '',
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const loadRequest = useRef(0)

  const loadTeamData = useCallback(async () => {
    const currentRequestId = ++loadRequest.current
    try {
      const [agents, leads, clients, properties, deals, tasks, appointments] = await Promise.all([
        agentService.getAll(),
        leadService.getAll(),
        clientService.getAll(),
        propertyService.getAll(),
        dealService.getAll(),
        taskService.getAll(),
        appointmentService.getAll(),
      ])
      if (currentRequestId !== loadRequest.current) return
      setRecords({ agents, leads, clients, properties, deals, tasks, appointments })
      setLoadError('')
    } catch (error) {
      if (currentRequestId === loadRequest.current) {
        setLoadError(error.message || 'Unable to load agent performance data.')
      }
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(loadTeamData)
    window.addEventListener('estateflow:data-changed', loadTeamData)
    return () => {
      window.clearTimeout(timeout)
      loadRequest.current += 1
      window.removeEventListener('estateflow:data-changed', loadTeamData)
    }
  }, [loadTeamData])

  const agents = useMemo(() => {
    if (!records) return []
    const names = new Set([
      ...AGENTS,
      ...records.agents.map((agent) => agent.name),
      ...Object.entries(records)
        .filter(([key]) => key !== 'agents')
        .flatMap(([, collection]) => collection)
        .flat()
        .map((record) => record.assignedTo)
        .filter(Boolean),
    ])

    return [...names].map((name) => {
      const directoryRecord = records.agents.find((agent) => agent.name === name)
      const agentLeads = records.leads.filter((lead) => lead.assignedTo === name)
      const agentClients = records.clients.filter((client) => client.assignedTo === name)
      const agentProperties = records.properties.filter((property) => property.assignedTo === name)
      const agentDeals = records.deals.filter((deal) => deal.assignedTo === name)
      const agentTasks = records.tasks.filter((task) => task.assignedTo === name)
      const agentAppointments = records.appointments.filter((appointment) => appointment.assignedTo === name)
      const wonDeals = agentDeals.filter((deal) => deal.stage === 'Closed Won')

      return {
        id: directoryRecord?.id || '',
        name,
        email: directoryRecord?.email || '',
        phone: directoryRecord?.phone || '',
        address: directoryRecord?.address || '',
        country: directoryRecord?.country || '',
        city: directoryRecord?.city || '',
        dateOfBirth: directoryRecord?.dateOfBirth || '',
        status: directoryRecord?.status || 'Unlisted',
        leads: agentLeads.length,
        converted: agentLeads.filter((lead) => lead.status === 'Converted').length,
        clients: agentClients.length,
        properties: agentProperties.length,
        openDeals: agentDeals.filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage)).length,
        revenue: wonDeals.reduce((total, deal) => total + Number(deal.amount || 0), 0),
        openTasks: agentTasks.filter((task) => task.status !== 'Completed').length,
        appointments: agentAppointments.filter((appointment) => appointment.status === 'Scheduled').length,
      }
    }).sort((a, b) => b.revenue - a.revenue || b.leads - a.leads || a.name.localeCompare(b.name))
  }, [records])

  const visibleAgents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return agents.filter((agent) => !query || agent.name.toLowerCase().includes(query))
  }, [agents, search])

  const totals = useMemo(() => agents.reduce((result, agent) => ({
    leads: result.leads + agent.leads,
    revenue: result.revenue + agent.revenue,
    openTasks: result.openTasks + agent.openTasks,
    appointments: result.appointments + agent.appointments,
  }), { leads: 0, revenue: 0, openTasks: 0, appointments: 0 }), [agents])

  function openCreateAgent(name = '') {
    setEditingAgent(null)
    setViewingAgent(null)
    setForm({ name, email: '', phone: '', address: '', country: '', city: '', dateOfBirth: '' })
    setFormError('')
    setAgentModalOpen(true)
  }

  function openEditAgent(agent) {
    setViewingAgent(null)
    setEditingAgent(agent)
    setForm({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      address: agent.address || '',
      country: agent.country || '',
      city: agent.city || '',
      dateOfBirth: agent.dateOfBirth || '',
    })
    setFormError('')
    setAgentModalOpen(true)
  }

  function openAgentDetails(agent) {
    setEditingAgent(null)
    setViewingAgent(agent)
    setAgentModalOpen(true)
  }

  async function saveAgent(event) {
    event.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      if (editingAgent) {
        await agentService.update(editingAgent.id, form)
      } else {
        await agentService.create(form)
      }
      setEditingAgent(null)
      setAgentModalOpen(false)
      toast.success(editingAgent ? 'Agent details updated.' : 'Agent added to the directory.')
      await loadTeamData()
    } catch (error) {
      setFormError(error.message || 'Unable to save agent details.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAgentStatus(agent) {
    const status = agent.status === 'Active' ? 'Inactive' : 'Active'
    if (!window.confirm(`${status === 'Inactive' ? 'Deactivate' : 'Reactivate'} ${agent.name}?`)) return
    try {
      await agentService.setStatus(agent.id, status)
      toast.success(`${agent.name} is now ${status.toLowerCase()}.`)
      await loadTeamData()
    } catch (error) {
      toast.error(error.message || 'Unable to update agent status.')
    }
  }

  return (
    <section className="agents-page">
      <header className="agents-header">
        <div>
          <span className="agents-eyebrow">TEAM MANAGEMENT</span>
          <b><h1>Agents</h1></b>
          <p>Review team assignments and performance across your workspace.</p>
        </div>
        <div className="agents-header-actions">
          <label className="agents-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search agents…"
              aria-label="Search agents"
            />
          </label>
          <button className="agents-add-button" type="button" onClick={() => openCreateAgent()}>
            <Plus size={16} />
            Add agent
          </button>
        </div>
      </header>

      {loadError && <p className="agents-error" role="alert">{loadError}</p>}
      {!records && !loadError && <p className="agents-state" role="status">Loading agent performance…</p>}

      {records && (
        <>
          <div className="agents-summary">
            <article className="agents-summary-team"><Users size={18} /><span>Team members</span><strong>{agents.length}</strong></article>
            <article className="agents-summary-leads"><BriefcaseBusiness size={18} /><span>Assigned leads</span><strong>{totals.leads}</strong></article>
            <article className="agents-summary-revenue"><CircleDollarSign size={18} /><span>Closed revenue</span><strong>{currency.format(totals.revenue)}</strong></article>
            <article className="agents-summary-tasks"><ClipboardCheck size={18} /><span>Open tasks</span><strong>{totals.openTasks}</strong></article>
          </div>

          <section className="agents-list" aria-label="Agent performance">
            {visibleAgents.map((agent) => (
              <article className="agent-card" key={agent.name}>
                <div className="agent-card-heading">
                  <span className="agent-avatar" aria-hidden="true">
                    {agent.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                  </span>
                  <div>
                    <h2>{agent.name}</h2>
                    <p>{agent.email || 'Legacy assignment'}</p>
                  </div>
                  <div className="agent-card-actions">
                    <span className={`agent-status agent-status-${agent.status.toLowerCase()}`}>{agent.status}</span>
                    {agent.id ? (
                      <>
                        <button type="button" className="agent-icon-button" onClick={() => openAgentDetails(agent)} aria-label={`View ${agent.name}`} title="View agent"><Eye size={14} /></button>
                        <button
                          type="button"
                          className={`agent-status-button ${agent.status === 'Active' ? 'agent-status-button-deactivate' : 'agent-status-button-reactivate'}`}
                          onClick={() => toggleAgentStatus(agent)}
                        >
                          {agent.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="agent-status-button" onClick={() => openCreateAgent(agent.name)}>Add to directory</button>
                    )}
                  </div>
                </div>
                <dl className="agent-metrics">
                  <div><dt>Leads</dt><dd>{agent.leads}</dd></div>
                  <div><dt>Converted</dt><dd>{agent.converted}</dd></div>
                  <div><dt>Clients</dt><dd>{agent.clients}</dd></div>
                  <div><dt>Properties</dt><dd>{agent.properties}</dd></div>
                  <div><dt>Open deals</dt><dd>{agent.openDeals}</dd></div>
                  <div><dt>Closed revenue</dt><dd>{currency.format(agent.revenue)}</dd></div>
                  <div><dt>Open tasks</dt><dd>{agent.openTasks}</dd></div>
                  <div><dt>Appointments</dt><dd><CalendarDays size={13} />{agent.appointments}</dd></div>
                </dl>
              </article>
            ))}
            {!visibleAgents.length && <p className="agents-state">No agents match “{search.trim()}”.</p>}
          </section>

          <p className="agents-footnote">
            Team details and assignments are stored in this browser. Deactivated agents remain visible here and keep their existing record history. Account invitations and role administration require the backend.
          </p>
        </>
      )}

      {agentModalOpen && (
        <div className="agent-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAgentModalOpen(false)}>
          <section className="agent-modal" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
            <header>
              <div>
                <span className="agents-eyebrow">TEAM DIRECTORY</span>
                <h2 id="agent-modal-title">{viewingAgent ? 'Agent details' : editingAgent ? 'Edit agent' : 'Add agent'}</h2>
              </div>
              <button type="button" className="agent-icon-button" onClick={() => setAgentModalOpen(false)} aria-label="Close agent form"><X size={16} /></button>
            </header>
            {viewingAgent ? (
              <div className="agent-details">
                <div className="agent-details-heading">
                  <span className="agent-avatar" aria-hidden="true">
                    {viewingAgent.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                  </span>
                  <div>
                    <h3>{viewingAgent.name}</h3>
                    <span className={`agent-status agent-status-${viewingAgent.status.toLowerCase()}`}>{viewingAgent.status}</span>
                  </div>
                </div>
                <dl className="agent-details-grid">
                  <div><dt>Email address</dt><dd>{viewingAgent.email || 'Not provided'}</dd></div>
                  <div><dt>Phone number</dt><dd>{viewingAgent.phone || 'Not provided'}</dd></div>
                  <div><dt>Address</dt><dd>{viewingAgent.address || 'Not provided'}</dd></div>
                  <div><dt>City</dt><dd>{viewingAgent.city || 'Not provided'}</dd></div>
                  <div><dt>Country</dt><dd>{viewingAgent.country || 'Not provided'}</dd></div>
                  <div><dt>Date of birth</dt><dd>{viewingAgent.dateOfBirth || 'Not provided'}</dd></div>
                </dl>
                <footer className="agent-details-actions">
                  <button type="button" className="agent-cancel-button" onClick={() => setAgentModalOpen(false)}>Close</button>
                  <button type="button" className="agents-add-button" onClick={() => openEditAgent(viewingAgent)}><Edit3 size={14} />Edit agent</button>
                </footer>
              </div>
            ) : (
              <form onSubmit={saveAgent}>
              <label>
                Full name
                <input autoFocus required readOnly={Boolean(editingAgent)} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                {editingAgent && <small>Names stay fixed so assigned CRM records retain their owner.</small>}
              </label>
              <label>
                Email address
                <input required type="email" autoComplete="off" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                <small>Directory contact only; no invitation is sent.</small>
              </label>
              <label>
                Phone (optional)
                <input type="tel" autoComplete="off" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label>
                Address (optional)
                <input autoComplete="street-address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
              </label>
              <label>
                City (optional)
                <input autoComplete="address-level2" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
              </label>
              <label>
                Country (optional)
                <input autoComplete="country-name" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
              </label>
              <label>
                Date of birth (optional)
                <input type="date" value={form.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
              </label>
              {formError && <p className="agents-error" role="alert">{formError}</p>}
              <footer>
                <button type="button" className="agent-cancel-button" onClick={() => setAgentModalOpen(false)}>Cancel</button>
                <button type="submit" className="agents-add-button" disabled={saving}>{saving ? 'Saving…' : editingAgent ? 'Save changes' : 'Add agent'}</button>
              </footer>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
