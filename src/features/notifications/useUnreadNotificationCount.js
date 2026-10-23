import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { clientService } from '../clients/clientService'
import { leadService } from '../leads/leadService'
import { propertyService } from '../properties/propertyService'
import { getActivityNotifications, getNotifications } from './notificationService'
import {
  appointmentService,
  dealService,
  taskService,
} from '../workflow/workflowService'

export function useUnreadNotificationCount() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let refreshTimer

    async function refreshNotificationCount() {
      try {
        const [leads, clients, properties, deals, tasks, appointments] = await Promise.all([
          leadService.getAll(),
          clientService.getAll(),
          propertyService.getAll(),
          dealService.getAll(),
          taskService.getAll(),
          appointmentService.getAll(),
        ])
        const notifications = getNotifications({
          leads,
          tasks,
          appointments,
          activities: getActivityNotifications({
            leads,
            clients,
            properties,
            deals,
            tasks,
            appointments,
          }),
        }, user)
        if (!cancelled) {
          setUnreadCount(notifications.filter((notification) => !notification.isRead).length)
        }
      } catch (error) {
        if (!cancelled) toast.error(error.message || 'Unable to load notification count.')
      }
    }

    function scheduleRefresh() {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(refreshNotificationCount, 100)
    }

    refreshNotificationCount()
    window.addEventListener('estateflow:data-changed', scheduleRefresh)
    window.addEventListener('estateflow:notifications-changed', scheduleRefresh)
    window.addEventListener('focus', scheduleRefresh)
    const timer = window.setInterval(refreshNotificationCount, 60000)

    return () => {
      cancelled = true
      window.clearTimeout(refreshTimer)
      window.clearInterval(timer)
      window.removeEventListener('estateflow:data-changed', scheduleRefresh)
      window.removeEventListener('estateflow:notifications-changed', scheduleRefresh)
      window.removeEventListener('focus', scheduleRefresh)
    }
  }, [user])

  return unreadCount
}
