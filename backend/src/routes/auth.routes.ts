// backend/src/routes/auth.routes.ts
import { Router } from 'express'
import { register, login, getCurrentUser } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// These routes are already mounted at /api/auth in server.ts
// So /register becomes /api/auth/register
router.post('/register', register)
router.post('/login', login)
router.get('/me', authMiddleware, getCurrentUser)

export default router