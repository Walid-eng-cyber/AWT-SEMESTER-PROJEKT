import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { asyncHandler } from '../lib/async-handler.js'
import { prisma } from '../db/client.js'
import { getAvailabilityWindow } from '../services/availability-service.js'

const WEBSITE_KNOWLEDGE = [
  'Project: Hochschule Mainz room booking portal.',
  'Main pages: landing, sign in, sign up, dashboard, room search, room details, bookings, events, settings, assistant.',
  'Primary features: room discovery, booking requests, reservation management, events listing, language preference (EN/DE).',
  'Roles in backend: student, staff, admin.',
  'Backend API base path: /api/v1 with authentication, rooms, appointments, availability, notifications, and assistant chat.',
  'Assistant should prioritize help about booking flows, room availability, events, and account/sign-in guidance.',
  'If user asks about unsupported actions, suggest the closest available workflow in this portal.',
].join('\n')

const SILVI_BASE_SYSTEM_PROMPT = [
  'You are Silvi, the booking room assistant for this website.',
  'When greeting, clearly introduce yourself as: "I am Silvi, your booking room assistant."',
  'Use the website and live data context below as your grounding knowledge and answer concisely.',
  'For availability questions, prioritize the provided live snapshot over assumptions.',
  'Do not invent unavailable features; if uncertain, say what is known from context.',
  '',
  'Website context:',
  WEBSITE_KNOWLEDGE,
].join('\n')

async function buildLiveAvailabilityContext() {
  const now = new Date()
  const to = new Date(now.getTime() + 12 * 60 * 60 * 1000)

  const rooms = await prisma.room.findMany({
    orderBy: { name: 'asc' },
    take: 10,
    select: {
      id: true,
      name: true,
      location: true,
      capacity: true,
      status: true,
    },
  })

  if (rooms.length === 0) {
    return `Live availability snapshot at ${now.toISOString()}: no rooms found.`
  }

  const summaries = await Promise.all(rooms.map(async (room) => {
    try {
      const window = await getAvailabilityWindow({
        roomId: room.id,
        from: now,
        to,
      })

      const currentSlot = window.slots.find((slot) => (
        new Date(slot.startsAt) <= now && new Date(slot.endsAt) > now
      ))
      const currentState = currentSlot?.state ?? 'unknown'

      const nextFreeSlot = window.slots.find((slot) => (
        slot.state === 'free' && new Date(slot.endsAt) > now
      ))

      const nextFreeText = nextFreeSlot
        ? (new Date(nextFreeSlot.startsAt) <= now
            ? 'available now'
            : `next free at ${new Date(nextFreeSlot.startsAt).toISOString()}`)
        : 'no free slot in next 12h'

      return `- ${room.name} (${room.location}, cap ${room.capacity}, room status ${room.status}): current ${currentState}, ${nextFreeText}.`
    } catch {
      return `- ${room.name} (${room.location}, cap ${room.capacity}, room status ${room.status}): availability unavailable.`
    }
  }))

  return [
    `Live availability snapshot generated at ${now.toISOString()} (window to ${to.toISOString()}):`,
    ...summaries,
  ].join('\n')
}

const chatSchema = z.object({
  model: z.string().min(1).max(200).optional(),
  maxTokens: z.number().int().positive().max(800).optional(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(4000),
    }),
  ).min(1),
})

const routerResponseSchema = z.object({
  error: z.string().optional(),
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().optional(),
      }),
    }),
  ).optional(),
})

export const assistantRouter = Router()

assistantRouter.post('/assistant/chat', asyncHandler(async (req, res) => {
  const payload = chatSchema.parse(req.body)

  if (!env.HF_API_KEY) {
    res.status(503).json({
      type: 'assistant_unavailable',
      message: 'Hugging Face API key is not configured on the backend.',
    })
    return
  }

  const liveAvailabilityContext = await buildLiveAvailabilityContext()
  const systemPrompt = `${SILVI_BASE_SYSTEM_PROMPT}\n\n${liveAvailabilityContext}`

  const model = (payload.model ?? 'openai/gpt-oss-120b:cerebras').trim()
  let response: Response
  try {
    response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: payload.maxTokens ?? 220,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...payload.messages,
        ],
      }),
    })
  } catch (error) {
    res.status(502).json({
      type: 'assistant_error',
      message: error instanceof Error
        ? `Cannot reach Hugging Face router from backend: ${error.message}`
        : 'Cannot reach Hugging Face router from backend.',
    })
    return
  }

  const body = routerResponseSchema.parse(await response.json())

  if (!response.ok) {
    const errorText = typeof body.error === 'string' ? body.error : `Hugging Face request failed (${response.status}).`
    res.status(502).json({
      type: 'assistant_error',
      message: errorText,
    })
    return
  }

  const text = body.choices?.[0]?.message?.content?.trim() ?? ''

  if (!text) {
    res.status(502).json({
      type: 'assistant_error',
      message: 'The model returned an empty response.',
    })
    return
  }

  res.status(200).json({ text })
}))
