import type { AvailabilityWindow } from '../contracts'
import { endpoints } from '../endpoints'
import { getJson } from '../http'

export function getRoomAvailability(roomId: string, from: string, to: string): Promise<AvailabilityWindow> {
  return getJson<AvailabilityWindow>(endpoints.availability.window, {
    roomId,
    from,
    to,
  })
}
