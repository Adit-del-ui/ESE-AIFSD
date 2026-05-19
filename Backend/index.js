const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

// ── CORS ────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true
}))

app.use(express.json())
app.use(morgan('dev'))

// ── Routes ───────────────────────────────────────────
const complaintsRouter = require('./routes/complaints')
const aiRouter         = require('./routes/ai')
const authRouter       = require('./routes/auth')

app.use('/api/auth',       authRouter)
app.use('/api/complaints', complaintsRouter)
app.use('/api/ai',         aiRouter)

// ── Health check ─────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── 404 handler ──────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

// ── Error handler ─────────────────────────────────────
const { errorHandler } = require('./internal/errorHandler')
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000

async function start() {
  try {
    const mongo = process.env.MONGO_DB
    if (mongo) {
      await mongoose.connect(mongo)
      console.log('✅ Connected to MongoDB')
    } else {
      console.warn('⚠️  MONGO_DB not set — skipping MongoDB connection')
    }
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
  } catch (err) {
    console.error('❌ Failed to start server', err)
    process.exit(1)
  }
}

start()
