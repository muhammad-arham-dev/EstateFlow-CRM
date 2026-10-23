import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  House,
  Plus,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '../features/auth/AuthContext'
import { clientService } from '../features/clients/clientService'
import { leadService } from '../features/leads/leadService'
import { propertyService } from '../features/properties/propertyService'
import {
  appointmentService,
  dealService,
  taskService,
} from '../features/workflow/workflowService'
import {
  getDealPipeline,
  getLeadSources,
  getLeadTrend,
  getRecentActivity,
} from '../features/reports/reportData'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [chartRange, setChartRange] = useState(6)
  const [records, setRecords] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    let requestId = 0
    const loadDashboardData = () => {
      const currentRequestId = ++requestId
      Promise.all([
        leadService.getAll(),
        clientService.getAll(),
        propertyService.getAll(),
        dealService.getAll(),
        taskService.getAll(),
        appointmentService.getAll(),
      ])
        .then(([leads, clients, properties, deals, tasks, appointments]) => {
          if (!cancelled && currentRequestId === requestId) {
            setRecords({ leads, clients, properties, deals, tasks, appointments })
            setLoadError('')
          }
        })
        .catch((error) => {
          if (!cancelled && currentRequestId === requestId) {
            setLoadError(error.message || 'Unable to load dashboard data.')
          }
        })
    }

    loadDashboardData()
    window.addEventListener('estateflow:data-changed', loadDashboardData)
    return () => {
      cancelled = true
      window.removeEventListener('estateflow:data-changed', loadDashboardData)
    }
  }, [])

  const isAgent = user?.role === 'Agent'
  const data = useMemo(() => {
    if (!records) return null
    const assigned = (collection) => collection.filter(
      (record) => !isAgent || record.assignedTo === user?.name,
    )
    const leads = assigned(records.leads)
    const clients = assigned(records.clients)
    const properties = assigned(records.properties)
    const deals = assigned(records.deals)
    const tasks = assigned(records.tasks)
    const appointments = assigned(records.appointments)
    const openDeals = deals.filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage))
    const closedWonDeals = deals.filter((deal) => deal.stage === 'Closed Won')
    const closedRevenue = closedWonDeals
      .reduce((total, deal) => total + Number(deal.amount || 0), 0)
    const today = format(new Date(), 'yyyy-MM-dd')
    const followUps = tasks
      .filter((task) => task.status !== 'Completed')
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
      .slice(0, 3)
    const activityCollections = [
      { records: leads, type: 'Lead' },
      { records: clients, type: 'Client' },
      { records: properties, type: 'Property' },
      { records: deals, type: 'Deal' },
      { records: tasks, type: 'Task' },
      { records: appointments, type: 'Appointment' },
    ]
    return {
      leads,
      clients,
      properties,
      deals,
      tasks,
      appointments,
      openDeals,
      leadTrend: getLeadTrend(leads, chartRange),
      pipeline: getDealPipeline(openDeals).filter((stage) => stage.count),
      sources: getLeadSources(leads),
      activities: getRecentActivity(activityCollections),
      followUps,
      todayFollowUps: tasks.filter((task) => task.status !== 'Completed' && task.dueDate && task.dueDate <= today).length,
      closedRevenue,
      closedDealCount: closedWonDeals.length,
    }
  }, [records, isAgent, user?.name, chartRange])

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const stats = data ? [
    { label: 'Total leads', value: data.leads.length, note: 'in your workspace', icon: Users, color: 'blue', path: '/leads' },
    { label: 'Active clients', value: data.clients.length, note: 'in your workspace', icon: Users, color: 'violet', path: '/clients' },
    { label: 'Active properties', value: data.properties.filter((property) => property.status === 'Available').length, note: 'currently available', icon: House, color: 'green', path: '/properties' },
    { label: 'Open deals', value: data.openDeals.length, note: 'in your pipeline', icon: CircleDollarSign, color: 'orange', path: '/deals' },
  ] : []

  return (
    <div className="dashboard-page">
      <section className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">
            {format(new Date(), "EEEE, MMMM d, yyyy").toUpperCase()}
          </p>
          <h1>
            {greeting}, {firstName} <span className="greeting-emoji">✦</span>
          </h1>
          <p className="page-description">
            Here’s what’s happening with your real estate business today.
          </p>
        </div>

        <button
          className="button button-primary"
          onClick={() => navigate("/leads")}
        >
          <Plus size={17} />
          Add new lead
        </button>
      </section>

      <section className="stats-grid" aria-label="Business overview">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.label}
              className="stat-card"
              onClick={() => navigate(stat.path)}
            >
              <div className="stat-card-top">
                <span className={`stat-icon stat-icon-${stat.color}`}>
                  <Icon size={19} />
                </span>
                <span className="stat-change change-up">Live</span>
              </div>
              <span className="stat-label">{stat.label}</span>
              <strong className="stat-value">{stat.value}</strong>
              <span className="stat-note">{stat.note}</span>
            </button>
          );
        })}
      </section>

      {loadError && <p className="dashboard-load-error" role="alert">{loadError}</p>}
      {!data && !loadError && <p className="dashboard-loading" role="status">Loading your workspace data…</p>}

      <section className="insight-banner">
        <div className="insight-icon">
          <CalendarClock size={21} />
        </div>
        <div className="insight-copy">
          <strong>{!data ? 'Loading follow-ups…' : data.todayFollowUps ? `You have ${data.todayFollowUps} follow-ups that need attention today` : 'No follow-ups are due today'}</strong>
          <span>
            Staying consistent with follow-ups helps keep opportunities moving.
          </span>
        </div>
        <button className="text-action" onClick={() => navigate("/tasks")}>
          View tasks <ArrowRight size={15} />
        </button>
      </section>

      <section className="charts-grid">
        <article className="panel lead-trend-panel">
          <div className="panel-heading">
            <div>
              <h2>Lead performance</h2>
              <p>Lead acquisition and conversions over time</p>
            </div>
            <select
              className="period-select"
              value={chartRange}
              onChange={(event) => setChartRange(Number(event.target.value))}
              aria-label="Lead chart time range"
            >
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </div>

          <div className="chart-legend">
            <span>
              <i className="legend-dot legend-blue" /> New leads
            </span>
            <span>
              <i className="legend-dot legend-violet" /> Converted
            </span>
          </div>

          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data?.leadTrend || []}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="leadsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#6F8FEA" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6F8FEA" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="convertedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#A28AE8" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#A28AE8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#EEF0F5"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#929AAF", fontSize: 12 }}
                  dy={9}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#929AAF", fontSize: 12 }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="New leads"
                  stroke="#6F8FEA"
                  strokeWidth={2.5}
                  fill="url(#leadsGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="converted"
                  name="Converted"
                  stroke="#A28AE8"
                  strokeWidth={2.5}
                  fill="url(#convertedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel pipeline-panel">
          <div className="panel-heading">
            <div>
              <h2>Deal pipeline</h2>
              <p>Active opportunities by stage</p>
            </div>
            <button
              className="icon-button panel-more"
              onClick={() => navigate("/pipeline")}
              aria-label="Open pipeline"
            >
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="pipeline-total">
            <strong>{data?.openDeals.length || 0}</strong>
            <span>Active Opportunities</span>
          </div>

          <div className="pipeline-bars">
            {(data?.pipeline || []).map((item) => (
              <div className="pipeline-row" key={item.stage}>
                <div className="pipeline-row-label">
                  <span>{item.stage}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="pipeline-track">
                  <span
                    className="pipeline-fill"
                    style={{
                      width: `${Math.max(8, (item.count / Math.max(1, ...data.pipeline.map((stage) => stage.count))) * 100)}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            className="panel-footer-action"
            onClick={() => navigate("/pipeline")}
          >
            View full pipeline <ArrowRight size={15} />
          </button>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Latest updates across your workspace</p>
            </div>
            <button
              className="text-action"
              onClick={() => navigate("/notifications")}
            >
              View all <ArrowRight size={15} />
            </button>
          </div>

          <div className="activity-list">
            {(data?.activities || []).map((activity) => (
              <div
                className="activity-item"
                key={`${activity.id}-${activity.type}`}
              >
                <div className={`avatar avatar-${activity.type.toLowerCase()}`}>
                  {(activity.recordName || 'U').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="activity-content">
                  <p>
                    <strong>{activity.recordName}</strong> {activity.text}
                  </p>
                  <span>{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                <span
                  className={`activity-type type-${activity.type.toLowerCase()}`}
                >
                  {activity.type}
                </span>
              </div>
            ))}
          </div>

          <button
            className="panel-footer-action"
            onClick={() => navigate("/notifications")}
          >
            See all activity <ArrowRight size={15} />
          </button>
        </article>

        <article className="panel source-panel">
          <div className="panel-heading">
            <div>
              <h2>Lead sources</h2>
              <p>Where your leads come from</p>
            </div>
            <button
              className="icon-button panel-more"
              onClick={() => navigate("/reports")}
              aria-label="Open reports"
            >
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="source-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.sources || []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={3}
                  stroke="none"
                >
                  {(data?.sources || []).map((source) => (
                    <Cell key={source.name} fill={source.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="source-chart-center">
              <strong>{data?.leads.length || 0}</strong>
              <span>Leads</span>
            </div>
          </div>

          <div className="source-legend">
            {(data?.sources || []).map((source) => (
              <div className="source-legend-row" key={source.name}>
                <span className="source-legend-name">
                  <i style={{ background: source.color }} />
                  {source.name}
                </span>
                <strong>{source.value}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel tasks-panel">
        <div className="panel-heading">
          <div>
            <h2>Today’s follow-ups</h2>
            <p>Stay organized and keep every opportunity moving</p>
          </div>
          <button
            className="button button-secondary button-small"
            onClick={() => navigate("/tasks")}
          >
            View all tasks <ArrowRight size={15} />
          </button>
        </div>

        <div className="task-list">
          {(data?.followUps || []).map((task) => (
          <div className="task-row" key={task.id}>
              <span className="task-check">
                <CheckCircle2 size={19} />
              </span>
              <div className="task-info">
                <strong>{task.title}</strong>
                <span>{task.contactName || 'No contact'} · {task.type}</span>
              </div>
              <span
                className={`priority-pill priority-${task.priority.toLowerCase()}`}
              >
                {task.priority}
              </span>
              <span className="task-time">
                <Clock3 size={14} /> {task.dueDate || 'No due date'}
              </span>
              <button
                className="icon-button task-open"
                onClick={() => navigate("/tasks")}
                aria-label={`Open task: ${task.title}`}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="revenue-strip">
        <div className="revenue-strip-icon">
          <CircleDollarSign size={22} />
        </div>
        <div>
          <span>Closed revenue (all time)</span>
          <strong>{currency.format(data?.closedRevenue || 0)}</strong>
        </div>
        <div className="revenue-strip-growth">
          <strong>{data?.closedDealCount || 0}</strong>
          <span>closed deals</span>
        </div>
        <button className="text-action" onClick={() => navigate("/reports")}>
          Revenue report <ArrowRight size={15} />
        </button>
      </section>
    </div>
  );
}
