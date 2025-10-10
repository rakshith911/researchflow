// backend/src/routes/settings.routes.ts
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserSettings,
  updateUserSettings,
  getUserStatistics,
  exportUserData,
  deleteUserAccount
} from '../controllers/settings.controller'

const router = Router()

// All settings routes require authentication
router.use(authMiddleware)

// Profile management
router.get('/profile', getUserProfile)
router.put('/profile', updateUserProfile)

// Password management
router.post('/password', changePassword)

// User preferences (editor settings, theme, notifications)
router.get('/preferences', getUserSettings)
router.put('/preferences', updateUserSettings)

// Statistics
router.get('/statistics', getUserStatistics)

// Data export (GDPR compliance)
router.get('/export', exportUserData)

// Account deletion (danger zone)
router.delete('/account', deleteUserAccount)

export default router