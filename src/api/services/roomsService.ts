import type { PagedResponse, Room, RoomType } from '../contracts'
import { endpoints } from '../endpoints'
import { getJson } from '../http'

export interface RoomsFilter {
  building?: string
  type?: RoomType
  minSeats?: number
  equipment?: string
  page?: number
  pageSize?: number
}

export function listRooms(filter: RoomsFilter = {}): Promise<PagedResponse<Room>> {
  return getJson<PagedResponse<Room>>(endpoints.rooms.list, {
    building: filter.building,
    type: filter.type,
    minSeats: filter.minSeats,
    equipment: filter.equipment,
    page: filter.page ?? 1,
    pageSize: filter.pageSize ?? 20,
  })
}

export function getRoomById(roomId: string): Promise<Room> {
  return getJson<Room>(endpoints.rooms.byId(roomId))
}

export function listAvailableRooms(from: string, to: string, minSeats?: number, building?: string): Promise<Room[]> {
  return getJson<Room[]>(endpoints.rooms.available, {
    from,
    to,
    minSeats,
    building,
  })
}
