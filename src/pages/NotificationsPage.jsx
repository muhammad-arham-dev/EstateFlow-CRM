import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  Bell,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  Clock3,
  Mail,
  Trash2,
  Users,
} from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { clientService } from '../features/clients/clientService'
import { leadService } from '../features/leads/leadService'
import { propertyService } from '../features/properties/propertyService'
import {
  dismissNotification,
  filterNotificationsByAge,
  getActivityNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from '../features/notifications/notificationService'
import {
  appointmentService,
  dealService,
  taskService,
} from '../features/workflow/workflowService'
import '../styles/notifications.css'

function notificationIcon(type) {
  if (type === 'overdue') return CircleAlert
  if (type === 'appointment') return CalendarDays
  if (type === 'lead') return Users
  if (type === 'task') return CheckCheck
  return Bell
}

function notificationTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'
  if (date > new Date()) return `In ${formatDistanceToNowStrict(date)}`
  return `${formatDistanceToNowStrict(date)} ago`
}

const notificationRanges = [
  { value: 'latest', label: 'Latest' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]
const upcomingRanges = [...notificationRanges, { value: 'upcoming', label: 'Upcoming' }]

function NotificationItems({ items, emptyIcon: EmptyIcon, emptyTitle, emptyDescription, loading, onRead, onDismiss }) {
  if (loading) return <p className="notifications-empty" role="status">Loading notifications…</p>
  if (!items.length) {
    return (
      <div className="notifications-empty">
        <EmptyIcon size={23} />
        <strong>{emptyTitle}</strong>
        <span>{emptyDescription}</span>
      </div>
    )
  }

  return (
    <div className="notifications-items">
      {items.map((notification) => {
        const Icon = notificationIcon(notification.type)
        return (
          <article
            className={`notification-item ${notification.isRead ? '' : 'is-unread'}`}
            key={notification.id}
            aria-label={notification.isRead ? 'Read notification' : 'Unread notification'}
          >
            <span className={`notification-item-icon notification-tone-${notification.type}`}><Icon size={17} /></span>
            <div className="notification-item-copy">
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <small><Clock3 size={12} />{notificationTime(notification.createdAt)}</small>
            </div>
            <div className="notification-item-actions">
              <Link to={notification.href} onClick={() => onRead(notification.id)}>View</Link>
              {!notification.isRead && (
                <button
                  className="notification-mark-read"
                  type="button"
                  onClick={() => onRead(notification.id)}
                  aria-label="Mark notification as read"
                  title="Mark as read"
                >
                  <CheckCheck size={15} />
                </button>
              )}
              <button
                className="notification-dismiss"
                type="button"
                onClick={() => onDismiss(notification.id)}
                aria-label="Dismiss notification"
                title="Dismiss"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [upcomingRange, setUpcomingRange] = useState('latest')
  const [recentRange, setRecentRange] = useState('latest')

  useEffect(() => {
    let cancelled = false
    async function loadNotifications() {
      try {
        const entries = await Promise.all([
          leadService.getAll(),
          clientService.getAll(),
          propertyService.getAll(),
          dealService.getAll(),
          taskService.getAll(),
          appointmentService.getAll(),
        ])
        if (cancelled) return
        const [leads, clients, properties, deals, tasks, appointments] = entries
        const records = { leads, clients, properties, deals, tasks, appointments }
        setNotifications(getNotifications({
          leads,
          tasks,
          appointments,
          activities: getActivityNotifications(records),
        }, user))
        setError('')
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load notifications.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadNotifications()
    const timer = window.setInterval(loadNotifications, 60000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user, refreshVersion])

  const unreadCount = notifications.filter((notification) => !notification.isRead).length
  const workNotifications = notifications.filter((notification) => notification.type !== 'activity')
  const upcomingNotifications = filterNotificationsByAge(workNotifications, upcomingRange)
  const recentNotifications = filterNotificationsByAge(
    notifications.filter((notification) => notification.type === 'activity'),
    recentRange,
  )

  function markRead(id) {
    try {
      markNotificationsRead([id])
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item))
    } catch (readError) {
      setError(readError.message || 'Unable to update notification status.')
    }
  }

  function markAllRead() {
    try {
      markAllNotificationsRead(notifications)
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
    } catch (readError) {
      setError(readError.message || 'Unable to update notification status.')
    }
  }

  function dismiss(id) {
    try {
      dismissNotification(id)
      setNotifications((current) => current.filter((item) => item.id !== id))
    } catch (dismissError) {
      setError(dismissError.message || 'Unable to dismiss notification.')
    }
  }

  function refreshNotifications() {
    setLoading(true)
    setRefreshVersion((version) => version + 1)
  }

  return (
    <section className="notifications-page">
      <header className="notifications-header">
        <div>
          <span className="notifications-eyebrow">WORKSPACE UPDATES</span>
          <b><h1>Notifications</h1></b>
          <p>Reminders and recent activity across your CRM.</p>
        </div>
        <div className="notifications-header-actions">
          <button type="button" className="notifications-refresh" onClick={refreshNotifications} disabled={loading}>
            Refresh
          </button>
          <button
            type="button"
            className="notifications-mark-all"
            onClick={markAllRead}
            disabled={!unreadCount}
          >
            <CheckCheck size={15} /> Mark all as read
          </button>
        </div>
      </header>

      <aside className="notifications-email-notice">
        <Mail size={18} />
        <p><strong>Email notifications are not connected.</strong> This frontend-only demo keeps notifications in this browser. Email delivery requires the backend mail service, Celery, and Redis.</p>
      </aside>

      {error && <div className="notifications-error" role="alert">{error}</div>}
      <section className="notifications-list" aria-label="Upcoming work notifications">
        <div className="notifications-list-header">
          <div><h2>Upcoming work</h2><p>{upcomingNotifications.filter((item) => !item.isRead).length} unread · {upcomingNotifications.length} reminders</p></div>
          <label className="notifications-filter">
            <select aria-label="Filter upcoming work notifications" value={upcomingRange} onChange={(event) => setUpcomingRange(event.target.value)}>
              {upcomingRanges.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <NotificationItems
          items={upcomingNotifications}
          emptyIcon={CalendarDays}
          emptyTitle="No upcoming work reminders"
          emptyDescription="Try a wider date range or check back for new reminders."
          loading={loading}
          onRead={markRead}
          onDismiss={dismiss}
        />
      </section>
      <section className="notifications-list" aria-label="Recent activity notifications">
        <div className="notifications-list-header">
          <div><h2>Recent notifications</h2><p>{recentNotifications.filter((item) => !item.isRead).length} unread · {recentNotifications.length} activity updates</p></div>
          <label className="notifications-filter">
            <select aria-label="Filter recent notifications" value={recentRange} onChange={(event) => setRecentRange(event.target.value)}>
              {notificationRanges.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <NotificationItems
          items={recentNotifications}
          emptyIcon={Bell}
          emptyTitle="No recent activity"
          emptyDescription="Try a wider date range or check back for new activity."
          loading={loading}
          onRead={markRead}
          onDismiss={dismiss}
        />
      </section>
    </section>
  )
}
