import { createApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './db/client.js'
import { registerGraphQL } from './graphql/gateway.js'

async function bootstrap() {
  await prisma.$connect()

  const app = createApp()
  await registerGraphQL(app)

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${env.PORT}`)
    console.log(`GraphQL Gateway on http://localhost:${env.PORT}/graphql`)
  })
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend:', error)
  process.exit(1)
})
