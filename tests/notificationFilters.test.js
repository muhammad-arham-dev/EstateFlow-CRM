import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { filterNotificationsByAge } from '../src/features/notifications/notificationService.js'

describe('notification date filters', () => {
  const now = new Date('2026-10-24T12:00:00.000Z').getTime()
  const notifications = [
    { id: 'recent', createdAt: '2026-10-24T08:00:00.000Z' },
    { id: 'old', createdAt: '2026-10-20T08:00:00.000Z' },
    { id: 'scheduled', createdAt: '2026-10-20T08:00:00.000Z', scheduledFor: '2026-10-25T08:00:00.000Z' },
    { id: 'future-activity', createdAt: '2026-10-25T08:00:00.000Z' },
  ]

  it('shows recent activity and scheduled work in Latest, but not future activity', () => {
    assert.deepEqual(
      filterNotificationsByAge(notifications, 'latest', now).map(({ id }) => id),
      ['recent', 'scheduled'],
    )
  })

  it('shows upcoming work only in the Upcoming filter', () => {
    assert.deepEqual(
      filterNotificationsByAge(notifications, 'upcoming', now).map(({ id }) => id),
      ['scheduled'],
    )
    assert.equal(
      filterNotificationsByAge(notifications, 'all', now).some(({ id }) => id === 'scheduled'),
      false,
    )
  })

  it('rejects unsupported filter ranges instead of silently returning no results', () => {
    assert.throws(
      () => filterNotificationsByAge(notifications, 'invalid', now),
      /Unsupported notification age range/,
    )
  })
})
