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

type DemoUser = {
  id: string
  email: string
  fullName: string
  role: 'student' | 'staff' | 'admin'
}

const demoUsers: DemoUser[] = [
  {
    id: 'student.demo',
    email: 'student@hs-mainz.de',
    fullName: 'Student Demo',
    role: 'student',
  },
  {
    id: 'staff.demo',
    email: 'staff@hs-mainz.de',
    fullName: 'Staff Demo',
    role: 'staff',
  },
  {
    id: 'admin.demo',
    email: 'admin@hs-mainz.de',
    fullName: 'Admin Demo',
    role: 'admin',
  },
]

async function seedUsers() {
  let created = 0

  for (const user of demoUsers) {
    const exists = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    })

    if (exists) continue

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: 'active',
      },
    })

    created += 1
  }

  const total = await prisma.user.count()
  console.log(`Demo users seed complete. Created ${created} user(s). Total users: ${total}.`)
}

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
  .then(() => seedUsers())
  .catch((error) => {
    console.error('Failed to seed demo rooms:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
