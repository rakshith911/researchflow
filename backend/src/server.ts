// backend/src/server.ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeDatabase } from './config/database'
import { logger } from './utils/logger'

// Routes
import authRoutes from './routes/auth.routes'
import documentRoutes from './routes/documents.routes'
import insightsRoutes from './routes/insights.routes'
import knowledgeGraphRoutes from './routes/knowledge-graph.routes'
import smartWritingRoutes from './routes/smart-writing.routes'
import backlinksRoutes from './routes/backlinks.routes'
import settingsRoutes from './routes/settings.routes'
import uploadRoutes from './routes/upload.routes'
import sharingRoutes from './routes/sharing.routes' // ✅ NEW - Collaboration sharing
import commentsRoutes from './routes/comments.routes' // ✅ NEW - Document comments
import adminRoutes from './routes/admin.routes' // ✅ NEW - Admin routes
import templatesRoutes from './routes/templates.routes' // ✅ NEW - Template import
import importRoutes from './routes/import.routes' // ✅ NEW - Import operations
import chatRoutes from './routes/chat.routes' // ✅ NEW - Chat Assistant

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes) // Includes comment routes now
app.use('/api/insights', insightsRoutes)
app.use('/api/knowledge-graph', knowledgeGraphRoutes)
app.use('/api/smart-writing', smartWritingRoutes)
app.use('/api/backlinks', backlinksRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/sharing', sharingRoutes) // ✅ NEW - Share management
app.use('/api/comments', commentsRoutes) // ✅ NEW - Individual comment operations
app.use('/api/admin', adminRoutes) // ✅ NEW - Admin operations
app.use('/api/templates', templatesRoutes) // ✅ NEW - Template operations
app.use('/api/import', importRoutes) // ✅ NEW - Import operations
app.use('/api/chat', chatRoutes) // ✅ NEW - Chat Assistant

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase()
    logger.info('Database initialized successfully')

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info('📦 Collaboration features enabled')
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...')
  const { closeDatabase } = await import('./config/database')
  await closeDatabase()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...')
  const { closeDatabase } = await import('./config/database')
  await closeDatabase()
  process.exit(0)
})

export default app