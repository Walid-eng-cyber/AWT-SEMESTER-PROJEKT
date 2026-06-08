import { createServer } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './db/client.js'
import { registerGraphQL } from './graphql/gateway.js'
import { registerWebSocketServer } from './realtime/ws-server.js'

async function bootstrap() {
  await prisma.$connect()

  const app = createApp()
  await registerGraphQL(app)

  const server = createServer(app)
  registerWebSocketServer(server)

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${env.PORT}`)
    console.log(`GraphQL Gateway on http://localhost:${env.PORT}/graphql`)
    console.log(`WebSocket on ws://localhost:${env.PORT}/ws`)
  })
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend:', error)
  process.exit(1)
})
