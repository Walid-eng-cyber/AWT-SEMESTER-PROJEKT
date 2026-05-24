import type { Notification, PagedResponse } from '../contracts'
import { endpoints } from '../endpoints'
import { getJson, postJson } from '../http'

export function listNotifications(unreadOnly = false, page = 1, pageSize = 20): Promise<PagedResponse<Notification>> {
  return getJson<PagedResponse<Notification>>(endpoints.notifications.list, {
    unreadOnly,
    page,
    pageSize,
  })
}

export function markNotificationAsRead(notificationId: string): Promise<Notification> {
  return postJson<Notification>(endpoints.notifications.markRead(notificationId))
}
