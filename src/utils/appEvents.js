export function dispatchDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('estateflow:data-changed'))
  }
}

export function dispatchNotificationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('estateflow:notifications-changed'))
  }
}
