import { Router } from 'express'
import { getDatabase } from '../config/database'
import { logger } from '../utils/logger'

const router = Router()

// DANGEROUS: Wipes all data
router.delete('/reset', async (req, res) => {
    try {
        const db = await getDatabase()

        // Disable foreign keys to allow truncation
        await db.run('PRAGMA foreign_keys = OFF')

        // Truncate all tables
        await db.run('DELETE FROM users')
        await db.run('DELETE FROM documents')
        await db.run('DELETE FROM user_settings')
        await db.run('DELETE FROM uploads')
        await db.run('DELETE FROM shared_documents')
        await db.run('DELETE FROM document_comments')
        await db.run('DELETE FROM share_access_logs')

        // Re-enable foreign keys
        await db.run('PRAGMA foreign_keys = ON')

        logger.info('SYSTEM RESET: All data wiped')

        res.json({ success: true, message: 'System reset successful' })
    } catch (error) {
        logger.error('System reset failed:', error)
        res.status(500).json({ success: false, error: 'System reset failed' })
    }
})

export default router
