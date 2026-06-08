import process from 'node:process'

process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5433/campus_platform?schema=public'
process.env.JWT_SECRET ||= 'dev-jwt-secret-change-me'
process.env.NODE_ENV ||= 'test'
