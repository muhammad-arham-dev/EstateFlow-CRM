import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
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

const stats = [
  { label: 'Total leads', value: '1,284', change: '+12.8%', trend: 'up', note: 'vs. last month', icon: Users, color: 'blue', path: '/leads' },
  { label: 'Active clients', value: '384', change: '+8.2%', trend: 'up', note: 'vs. last month', icon: Users, color: 'violet', path: '/clients' },
  { label: 'Active properties', value: '246', change: '+5.4%', trend: 'up', note: 'vs. last month', icon: House, color: 'green', path: '/properties' },
  { label: 'Open deals', value: '58', change: '-2.4%', trend: 'down', note: 'vs. last month', icon: CircleDollarSign, color: 'orange', path: '/deals' },
]

const leadTrend = [
  { month: 'May', leads: 72, converted: 24 },
  { month: 'Jun', leads: 88, converted: 31 },
  { month: 'Jul', leads: 76, converted: 27 },
  { month: 'Aug', leads: 105, converted: 39 },
  { month: 'Sep', leads: 92, converted: 34 },
  { month: 'Oct', leads: 124, converted: 46 },
]

const pipeline = [
  { stage: 'New Lead', count: 24, color: '#7C9BF4' },
  { stage: 'Qualified', count: 18, color: '#9478E8' },
  { stage: 'Viewing', count: 12, color: '#E6A65B' },
  { stage: 'Negotiation', count: 9, color: '#5CB8A5' },
  { stage: 'Under Contract', count: 6, color: '#5184D8' },
]

const sources = [
  { name: 'Zillow', value: 34, color: '#6687E8' },
  { name: 'Referral', value: 26, color: '#65B7A5' },
  { name: 'Website', value: 21, color: '#A28AE8' },
  { name: 'Realtor.com', value: 12, color: '#E9AE67' },
  { name: 'Other', value: 7, color: '#B9C1CF' },
]

const activities = [
  { initials: 'JM', color: 'avatar-blue', title: 'Jordan Miller', action: 'was qualified as a lead', time: '12 min ago', type: 'Lead' },
  { initials: 'SC', color: 'avatar-purple', title: 'Sophia Carter', action: 'scheduled a property viewing', time: '38 min ago', type: 'Appointment' },
  { initials: 'DW', color: 'avatar-green', title: 'Daniel Wilson', action: 'moved a deal to Negotiation', time: '1 hr ago', type: 'Deal' },
  { initials: 'ER', color: 'avatar-orange', title: 'Emma Roberts', action: 'added a new property listing', time: '2 hrs ago', type: 'Property' },
]

const tasks = [
  { title: 'Follow up with Olivia Martinez', meta: 'Lead · Call', time: '10:30 AM', priority: 'High' },
  { title: 'Prepare offer for Oak Street', meta: 'Deal · Document review', time: '12:00 PM', priority: 'Medium' },
  { title: 'Confirm viewing with James Lee', meta: 'Appointment · Follow-up', time: '2:30 PM', priority: 'High' },
]

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;

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
                <span
                  className={`stat-change ${stat.trend === "up" ? "change-up" : "change-down"}`}
                >
                  <TrendIcon size={14} />
                  {stat.change}
                </span>
              </div>
              <span className="stat-label">{stat.label}</span>
              <strong className="stat-value">{stat.value}</strong>
              <span className="stat-note">{stat.note}</span>
            </button>
          );
        })}
      </section>

      <section className="insight-banner">
        <div className="insight-icon">
          <CalendarClock size={21} />
        </div>
        <div className="insight-copy">
          <strong>You have 3 follow-ups that need attention today</strong>
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
              defaultValue="6months"
              aria-label="Lead chart time range"
            >
              <option value="6months">Last 6 months</option>
              <option value="30days">Last 30 days</option>
              <option value="year">This year</option>
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
                data={leadTrend}
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
            <strong>69</strong>
            <span>active opportunities</span>
          </div>

          <div className="pipeline-bars">
            {pipeline.map((item) => (
              <div className="pipeline-row" key={item.stage}>
                <div className="pipeline-row-label">
                  <span>{item.stage}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className="pipeline-track">
                  <span
                    className="pipeline-fill"
                    style={{
                      width: `${(item.count / 24) * 100}%`,
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
            {activities.map((activity) => (
              <div
                className="activity-item"
                key={`${activity.title}-${activity.type}`}
              >
                <div className={`avatar ${activity.color}`}>
                  {activity.initials}
                </div>
                <div className="activity-content">
                  <p>
                    <strong>{activity.title}</strong> {activity.action}
                  </p>
                  <span>{activity.time}</span>
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
                  data={sources}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={3}
                  stroke="none"
                >
                  {sources.map((source) => (
                    <Cell key={source.name} fill={source.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="source-chart-center">
              <strong>100%</strong>
              <span>Total leads</span>
            </div>
          </div>

          <div className="source-legend">
            {sources.map((source) => (
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
          {tasks.map((task) => (
            <div className="task-row" key={task.title}>
              <span className="task-check">
                <CheckCircle2 size={19} />
              </span>
              <div className="task-info">
                <strong>{task.title}</strong>
                <span>{task.meta}</span>
              </div>
              <span
                className={`priority-pill priority-${task.priority.toLowerCase()}`}
              >
                {task.priority}
              </span>
              <span className="task-time">
                <Clock3 size={14} /> {task.time}
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
          <span>Closed revenue this month</span>
          <strong>{currency.format(428500)}</strong>
        </div>
        <div className="revenue-strip-growth">
          <ArrowUpRight size={16} />
          <strong>18.6%</strong>
          <span>vs. last month</span>
        </div>
        <button className="text-action" onClick={() => navigate("/reports")}>
          Revenue report <ArrowRight size={15} />
        </button>
      </section>
    </div>
  );
}
