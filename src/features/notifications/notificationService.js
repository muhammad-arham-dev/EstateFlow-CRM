import { dispatchNotificationsChanged } from '../../utils/appEvents.js'

const STATE_KEY = 'estateflow_notification_state_v1'
const REMINDER_WINDOW_DAYS = 7
const NOTIFICATION_AGE_RANGES = {
  latest: 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '12m': 365 * 24 * 60 * 60 * 1000,
}

export function filterNotificationsByAge(notifications, range, now = Date.now()) {
  if (range === 'upcoming') {
    return notifications.filter((notification) => {
      const scheduledFor = new Date(notification.scheduledFor).getTime()
      return Number.isFinite(scheduledFor) && scheduledFor > now
    })
  }
  const duration = NOTIFICATION_AGE_RANGES[range]
  if (range !== 'all' && !duration) {
    throw new Error(`Unsupported notification age range: ${range}`)
  }
  const cutoff = range === 'all' ? Number.NEGATIVE_INFINITY : now - duration

  return notifications.filter((notification) => {
    const createdAt = new Date(notification.createdAt).getTime()
    const scheduledFor = new Date(notification.scheduledFor || '').getTime()
    const isUpcoming = Number.isFinite(scheduledFor) && scheduledFor > now
    const isRecentPast = !isUpcoming && Number.isFinite(createdAt) && createdAt >= cutoff && createdAt <= now
    return (range === 'latest' && isUpcoming) || isRecentPast
  })
}

function readState() {
  let stored
  try {
    stored = localStorage.getItem(STATE_KEY)
  } catch {
    throw new Error('Unable to access notification settings in this browser.')
  }

  if (stored === null) return { readIds: [], dismissedIds: [] }

  try {
    const state = JSON.parse(stored)
    if (!Array.isArray(state.readIds) || !Array.isArray(state.dismissedIds)) {
      throw new Error()
    }
    return state
  } catch {
    throw new Error('Saved notification settings are invalid.')
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
    dispatchNotificationsChanged()
  } catch {
    throw new Error('Unable to save notification settings in this browser.')
  }
}

function assignedToCurrentUser(records, user) {
  return user?.role === 'Agent'
    ? records.filter((record) => record.assignedTo === user.name)
    : records
}

function daysFromToday(value, now) {
  if (!value) return null
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (Number.isNaN(date.getTime())) return null
  return Math.round((date - today) / 86400000)
}

export function getActivityNotifications(records) {
  const sources = [
    { key: 'leads', label: 'Lead', href: '/leads' },
    { key: 'clients', label: 'Client', href: '/clients' },
    { key: 'properties', label: 'Property', href: '/properties' },
    { key: 'deals', label: 'Deal', href: '/deals' },
    { key: 'tasks', label: 'Task', href: '/tasks' },
    { key: 'appointments', label: 'Appointment', href: '/appointments' },
  ]

  return sources.flatMap(({ key, label, href }) =>
    (records[key] || []).flatMap((record) =>
      (record.activities || []).map((activity) => ({
        id: activity.id,
        title: `${label} update`,
        message: `${record.name || record.title}: ${activity.text}`,
        createdAt: activity.createdAt,
        href,
        assignedTo: record.assignedTo,
      })),
    ),
  )
}

function getReminderNotifications({ leads, tasks, appointments, user, now }) {
  const reminders = []

  for (const lead of assignedToCurrentUser(leads, user)) {
    const days = daysFromToday(lead.followUpDate, now)
    if (
      days === null ||
      days > REMINDER_WINDOW_DAYS ||
      ['Converted', 'Lost', 'Unqualified'].includes(lead.status)
    ) continue

    const overdue = days < 0
    reminders.push({
      id: `lead-follow-up:${lead.id}:${lead.followUpDate}`,
      title: overdue ? 'Lead follow-up is overdue' : days === 0 ? 'Lead follow-up due today' : 'Upcoming lead follow-up',
      message: `${lead.name} · ${lead.followUpDate}`,
      type: overdue ? 'overdue' : 'lead',
      createdAt: new Date(`${lead.followUpDate}T09:00:00`).toISOString(),
      scheduledFor: new Date(`${lead.followUpDate}T23:59:59`).toISOString(),
      href: '/leads',
    })
  }

  for (const task of assignedToCurrentUser(tasks, user)) {
    const days = daysFromToday(task.dueDate, now)
    if (task.status === 'Completed' || days === null || days > REMINDER_WINDOW_DAYS) continue

    const overdue = days < 0
    reminders.push({
      id: `task-reminder:${task.id}:${task.dueDate}`,
      title: overdue ? 'Task is overdue' : days === 0 ? 'Task due today' : 'Upcoming task',
      message: `${task.title} · ${task.dueDate}`,
      type: overdue ? 'overdue' : 'task',
      createdAt: new Date(`${task.dueDate}T09:00:00`).toISOString(),
      scheduledFor: new Date(`${task.dueDate}T23:59:59`).toISOString(),
      href: '/tasks',
    })
  }

  const nowTime = now.getTime()
  for (const appointment of assignedToCurrentUser(appointments, user)) {
    const startsAt = new Date(appointment.startsAt)
    if (appointment.status !== 'Scheduled' || Number.isNaN(startsAt.getTime())) continue
    const reminderMinutes = {
      'At appointment time': 0,
      '15 minutes before': 15,
      '1 hour before': 60,
      '1 day before': 1440,
      None: null,
    }[appointment.reminder || '1 day before']
    if (reminderMinutes === null || reminderMinutes === undefined) continue
    const reminderAt = startsAt.getTime() - reminderMinutes * 60000
    const isUpcoming = startsAt.getTime() > nowTime
    const reminderIsDue = nowTime >= reminderAt && nowTime <= startsAt.getTime() + 30 * 60000
    if (!isUpcoming && !reminderIsDue) continue

    reminders.push({
      id: `appointment-reminder:${appointment.id}:${appointment.startsAt}`,
      title: 'Upcoming appointment',
      message: `${appointment.title} · ${startsAt.toLocaleString()}`,
      type: 'appointment',
      createdAt: isUpcoming ? startsAt.toISOString() : now.toISOString(),
      scheduledFor: startsAt.toISOString(),
      href: '/appointments',
    })
  }

  return reminders
}

export function getNotifications(records, user, now = new Date()) {
  const reminders = getReminderNotifications({ ...records, user, now })
  const recentActivities = records.activities || []
  const activityNotifications = recentActivities
    .filter((activity) => {
      const createdAt = new Date(activity.createdAt).getTime()
      return Number.isFinite(createdAt) &&
        (user?.role !== 'Agent' || activity.assignedTo === user.name)
    })
    .map((activity) => ({
      id: `activity:${activity.id}`,
      title: activity.title,
      message: activity.message,
      type: 'activity',
      createdAt: activity.createdAt,
      href: activity.href,
    }))

  const state = readState()
  const excluded = new Set(state.dismissedIds)
  const read = new Set(state.readIds)
  return [...reminders, ...activityNotifications]
    .filter((notification) => !excluded.has(notification.id))
    .map((notification) => ({ ...notification, isRead: read.has(notification.id) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function markNotificationsRead(notificationIds) {
  const state = readState()
  const readIds = new Set(state.readIds)
  notificationIds.forEach((id) => readIds.add(id))
  writeState({ ...state, readIds: [...readIds] })
}

export function markAllNotificationsRead(notifications) {
  markNotificationsRead(notifications.map(({ id }) => id))
}

export function dismissNotification(notificationId) {
  const state = readState()
  const dismissedIds = new Set(state.dismissedIds)
  dismissedIds.add(notificationId)
  writeState({ ...state, dismissedIds: [...dismissedIds] })
}
