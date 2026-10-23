import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartNoAxesCombined, CircleDollarSign, Users, UserRound } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { AGENTS, LEAD_STATUSES, leadService } from '../features/leads/leadService'
import {
  appointmentService,
  dealService,
  taskService,
} from '../features/workflow/workflowService'
import '../styles/reports.css'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const statusColors = ['#6687e8', '#927be4', '#e5a657', '#c46868', '#62ad9a', '#5785d7']
const dealStageColors = {
  Prospecting: '#6687e8',
  Offer: '#e5a657',
  'Under Contract': '#927be4',
  'Closed Won': '#62ad7a',
  'Closed Lost': '#c46868',
}

function LeadStatusAxisTick({ x, y, payload }) {
  const words = payload.value.split(' ')

  return (
    <g transform={`translate(${x},${y})`}>
      <text className="reports-status-tick" x={0} y={10} fill="#758098" fontSize={8} textAnchor="middle">
        {words.map((word, index) => (
          <tspan key={`${word}-${index}`} x={0} dy={index === 0 ? 0 : 11}>
            {word}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function filterByPeriod(records, period) {
  if (period === 'all') return records
  const days = Number(period)
  const cutoff = Date.now() - days * 86400000
  return records.filter((record) => {
    const createdAt = new Date(record.createdAt).getTime()
    return Number.isFinite(createdAt) && createdAt >= cutoff
  })
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('all')
  const [records, setRecords] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      leadService.getAll(),
      dealService.getAll(),
      taskService.getAll(),
      appointmentService.getAll(),
    ])
      .then(([leads, deals, tasks, appointments]) => {
        if (!cancelled) {
          setRecords({ leads, deals, tasks, appointments })
          setError('')
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Unable to load report data.')
      })
    return () => { cancelled = true }
  }, [])

  const report = useMemo(() => {
    if (!records) return null
    const isAgent = user?.role === 'Agent'
    const assigned = (list) => list.filter((item) => !isAgent || item.assignedTo === user?.name)
    const leads = filterByPeriod(assigned(records.leads), period)
    const deals = filterByPeriod(assigned(records.deals), period)
    const tasks = filterByPeriod(assigned(records.tasks), period)
    const appointments = filterByPeriod(assigned(records.appointments), period)
    const leadStatuses = LEAD_STATUSES
      .map((status) => ({
        status,
        count: leads.filter((lead) => lead.status === status).length,
      }))
      .filter(({ count }) => count > 0)

    const leadSources = leads.reduce((result, lead) => {
      const source = lead.source || 'Other'
      result.set(source, (result.get(source) || 0) + 1)
      return result
    }, new Map())
    const sources = [...leadSources]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))

    const dealStages = ['Prospecting', 'Offer', 'Under Contract', 'Closed Won', 'Closed Lost']
      .map((stage) => {
        const stageDeals = deals.filter((deal) => deal.stage === stage)
        return {
          stage,
          count: stageDeals.length,
          value: stageDeals.reduce((total, deal) => total + Number(deal.amount || 0), 0),
        }
      })

    const agentNames = new Set([
      ...AGENTS,
      ...leads.map((lead) => lead.assignedTo).filter(Boolean),
      ...deals.map((deal) => deal.assignedTo).filter(Boolean),
      ...tasks.map((task) => task.assignedTo).filter(Boolean),
    ])
    const agents = [...agentNames]
      .filter((name) => !isAgent || name === user?.name)
      .map((name) => {
        const agentLeads = leads.filter((lead) => lead.assignedTo === name)
        const agentDeals = deals.filter((deal) => deal.assignedTo === name)
        const agentTasks = tasks.filter((task) => task.assignedTo === name)
        const agentAppointments = appointments.filter((appointment) => appointment.assignedTo === name)
        return {
          name,
          leads: agentLeads.length,
          converted: agentLeads.filter((lead) => lead.status === 'Converted').length,
          closedWon: agentDeals.filter((deal) => deal.stage === 'Closed Won').length,
          revenue: agentDeals
            .filter((deal) => deal.stage === 'Closed Won')
            .reduce((total, deal) => total + Number(deal.amount || 0), 0),
          openTasks: agentTasks.filter((task) => task.status !== 'Completed').length,
          appointments: agentAppointments.filter((appointment) => appointment.status === 'Scheduled').length,
        }
      })
      .sort((a, b) => b.revenue - a.revenue || b.leads - a.leads)

    const converted = leads.filter((lead) => lead.status === 'Converted').length
    const closedWonDeals = deals.filter((deal) => deal.stage === 'Closed Won')

    return {
      leads,
      deals,
      tasks,
      appointments,
      leadStatuses,
      sources,
      dealStages,
      agents,
      conversionRate: leads.length ? Math.round((converted / leads.length) * 100) : 0,
      revenue: closedWonDeals.reduce((total, deal) => total + Number(deal.amount || 0), 0),
      openDeals: deals.filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage)).length,
    }
  }, [records, period, user?.role, user?.name])

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">BUSINESS INTELLIGENCE</span>
          <b><h1>Reports &amp; Analytics</h1></b>
          <p>Track lead performance, agent activity, and sales outcomes.</p>
        </div>
        <label className="reports-period">
          <span>Reporting period</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
        </label>
      </header>

      {error && <div className="reports-error" role="alert">{error}</div>}
      {!records && !error && <div className="reports-loading" role="status">Loading reports…</div>}
      {report && (
        <>
          <div className="reports-stats">
            <article className="reports-stat-card">
              <span className="reports-stat-icon reports-tone-blue"><Users size={19} /></span>
              <div><small>Leads in period</small><strong>{report.leads.length}</strong></div>
            </article>
            <article className="reports-stat-card">
              <span className="reports-stat-icon reports-tone-purple"><ChartNoAxesCombined size={19} /></span>
              <div><small>Lead conversion rate</small><strong>{report.conversionRate}%</strong></div>
            </article>
            <article className="reports-stat-card">
              <span className="reports-stat-icon reports-tone-green"><CircleDollarSign size={19} /></span>
              <div><small>Closed won revenue</small><strong>{currency.format(report.revenue)}</strong></div>
            </article>
            <article className="reports-stat-card">
              <span className="reports-stat-icon reports-tone-amber"><UserRound size={19} /></span>
              <div><small>Open deals</small><strong>{report.openDeals}</strong></div>
            </article>
          </div>

          <div className="reports-chart-grid">
            <article className="reports-panel">
              <div className="reports-panel-heading">
                <div><h2>Lead report</h2><p>Current lead distribution by status</p></div>
              </div>
              {report.leadStatuses.length ? (
                <div className="reports-bar-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.leadStatuses}
                      margin={{ top: 8, right: 0, bottom: 2, left: 0 }}
                      barCategoryGap={8}
                    >
                      <CartesianGrid stroke="#edf0f6" vertical={false} />
                      <XAxis
                        dataKey="status"
                        height={48}
                        interval={0}
                        tick={<LeadStatusAxisTick />}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        width={28}
                        allowDecimals={false}
                        domain={[0, (dataMax) => Math.max(1, dataMax)]}
                        tick={{ fill: '#758098', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip />
                      <Bar dataKey="count" name="Leads" fill="#6687e8" radius={[5, 5, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="reports-empty">No lead records in this period.</p>}
            </article>

            <article className="reports-panel">
              <div className="reports-panel-heading">
                <div><h2>Lead sources</h2><p>Where leads in this period came from</p></div>
              </div>
              {report.sources.length ? (
                <div className="reports-source-list">
                  {report.sources.map((source, index) => (
                    <div className="reports-source-row" key={source.name}>
                      <span><i style={{ background: statusColors[index % statusColors.length] }} />{source.name}</span>
                      <strong>{source.value}</strong>
                    </div>
                  ))}
                </div>
              ) : <p className="reports-empty">No lead source data in this period.</p>}
            </article>
          </div>

          <section className="reports-panel reports-sales-panel">
            <div className="reports-panel-heading">
              <div><h2>Sales report</h2><p>Deal volume and expected value by stage</p></div>
            </div>
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead><tr><th>Deal stage</th><th>Deals</th><th>Value</th></tr></thead>
                <tbody>
                  {report.dealStages.map((stage) => (
                    <tr key={stage.stage}>
                      <td><span className="reports-stage-dot" style={{ background: dealStageColors[stage.stage] || '#758098' }} />{stage.stage}</td>
                      <td>{stage.count}</td>
                      <td>{currency.format(stage.value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><th>Total</th><th>{report.deals.length}</th><th>{currency.format(report.deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0))}</th></tr></tfoot>
              </table>
            </div>
          </section>

          <section className="reports-panel reports-agent-panel">
            <div className="reports-panel-heading">
              <div><h2>Agent report</h2><p>Lead conversions, closed deals, and open work by agent</p></div>
            </div>
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead><tr><th>Agent</th><th>Leads</th><th>Converted</th><th>Deals won</th><th>Revenue</th><th>Open tasks</th><th>Appointments</th></tr></thead>
                <tbody>
                  {report.agents.map((agent) => (
                    <tr key={agent.name}>
                      <td>{agent.name}</td><td>{agent.leads}</td><td>{agent.converted}</td>
                      <td>{agent.closedWon}</td><td>{currency.format(agent.revenue)}</td><td>{agent.openTasks}</td><td>{agent.appointments}</td>
                    </tr>
                  ))}
                  {!report.agents.length && <tr><td colSpan="7" className="reports-empty-cell">No agent data in this period.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  )
}
