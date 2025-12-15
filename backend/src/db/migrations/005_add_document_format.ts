
import { Database } from 'sqlite'
import { logger } from '../../utils/logger'

export async function up(db: Database) {
    try {
        logger.info('Running migration: 005_add_document_format')

        // Check if format column exists
        const tableInfo = await db.all("PRAGMA table_info(documents)")
        const columnNames = tableInfo.map((col: any) => col.name)

        if (!columnNames.includes('format')) {
            // proper text column, constrained to 'markdown' or 'latex', default 'markdown'
            await db.exec(`
        ALTER TABLE documents 
        ADD COLUMN format TEXT DEFAULT 'markdown' 
        CHECK(format IN ('markdown', 'latex'));
      `)
            logger.info('Added format column to documents table')

            // Index for faster filtering by format
            await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_documents_format ON documents(format);
      `)
        } else {
            logger.info('format column already exists')
        }

        logger.info('Migration 005_add_document_format completed successfully')
    } catch (error) {
        logger.error('Error in migration 005:', error)
        throw error
    }
}
