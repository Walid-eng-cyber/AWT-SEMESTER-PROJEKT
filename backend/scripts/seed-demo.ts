import { PrismaClient, RoomStatus } from '@prisma/client'

const prisma = new PrismaClient()

type DemoRoom = {
  name: string
  location: string
  capacity: number
  equipment: string[]
  status?: RoomStatus
}

const demoRooms: DemoRoom[] = [
  {
    name: 'Studio B-402',
    location: 'Building B - Level 4',
    capacity: 32,
    equipment: ['Projector', 'Smartboard', 'Whiteboard'],
    status: RoomStatus.AVAILABLE,
  },
  {
    name: 'Lichtstudio A.04',
    location: 'Building A - Floor 2',
    capacity: 24,
    equipment: ['Pro Audio', 'Smartboard'],
    status: RoomStatus.AVAILABLE,
  },
  {
    name: 'Engineering Lab B.301',
    location: 'Building B - Level 3',
    capacity: 48,
    equipment: ['Projector', 'Touch Display', 'Streaming Kit'],
    status: RoomStatus.AVAILABLE,
  },
  {
    name: 'Auditorium C.101',
    location: 'Building C - Level 1',
    capacity: 120,
    equipment: ['Projector', 'Pro Audio', 'Streaming Kit'],
    status: RoomStatus.OCCUPIED,
  },
]

async function seedRooms() {
  let created = 0

  for (const room of demoRooms) {
    const exists = await prisma.room.findFirst({
      where: {
        name: room.name,
        location: room.location,
      },
      select: { id: true },
    })

    if (exists) continue

    await prisma.room.create({
      data: {
        name: room.name,
        location: room.location,
        capacity: room.capacity,
        equipment: room.equipment,
        status: room.status ?? RoomStatus.AVAILABLE,
      },
    })

    created += 1
  }

  const total = await prisma.room.count()
  console.log(`Demo seed complete. Created ${created} room(s). Total rooms: ${total}.`)
}

seedRooms()
  .catch((error) => {
    console.error('Failed to seed demo rooms:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
