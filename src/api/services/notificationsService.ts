import type { Notification } from '../contracts'
import { endpoints } from '../endpoints'
import { getJson, postJson } from '../http'

export function listNotifications(unreadOnly = false): Promise<Notification[]> {
  return getJson<Notification[]>(endpoints.notifications.list, {
    read: unreadOnly ? false : undefined,
  })
}

export function markNotificationAsRead(notificationId: string): Promise<Notification> {
  return postJson<Notification>(endpoints.notifications.markRead(notificationId))
}
