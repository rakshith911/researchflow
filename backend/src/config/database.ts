// backend/src/config/database.ts
import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import { logger } from '../utils/logger'

let db: Database | null = null

export async function initializeDatabase(): Promise<Database> {
  if (db) return db

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'researchflow.db')

  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    logger.info(`Database connected: ${dbPath}`)

    // First create migrations table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Then run migrations before creating tables
    await runMigrations()

    // Finally create/verify all tables
    await createTables()

    return db
  } catch (error) {
    logger.error('Failed to initialize database:', error)
    throw error
  }
}

async function runMigrations() {
  if (!db) throw new Error('Database not initialized')

  const migrations = [
    {
      name: '001_add_favorites_and_last_accessed',
      up: async () => {
        try {
          // Check if documents table exists
          const tableExists = await db!.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='documents'"
          )

          if (!tableExists) {
            logger.info('Documents table does not exist yet, skipping migration')
            return
          }

          // Check if columns exist
          const tableInfo = await db!.all("PRAGMA table_info(documents)")
          const columnNames = tableInfo.map((col: any) => col.name)

          if (!columnNames.includes('is_favorite')) {
            await db!.exec('ALTER TABLE documents ADD COLUMN is_favorite INTEGER DEFAULT 0;')
            logger.info('Added is_favorite column to documents table')
          } else {
            logger.info('is_favorite column already exists')
          }

          if (!columnNames.includes('last_accessed_at')) {
            await db!.exec('ALTER TABLE documents ADD COLUMN last_accessed_at DATETIME;')
            logger.info('Added last_accessed_at column to documents table')

            // Initialize last_accessed_at for existing documents
            await db!.exec(`
              UPDATE documents 
              SET last_accessed_at = updated_at 
              WHERE last_accessed_at IS NULL;
            `)
            logger.info('Initialized last_accessed_at for existing documents')
          } else {
            logger.info('last_accessed_at column already exists')
          }

          // Create indexes if they don't exist
          await db!.exec(`
            CREATE INDEX IF NOT EXISTS idx_documents_is_favorite ON documents(is_favorite);
            CREATE INDEX IF NOT EXISTS idx_documents_last_accessed ON documents(last_accessed_at);
          `)
          logger.info('Created indexes for new columns')
        } catch (error) {
          logger.error('Error in migration 001:', error)
          throw error
        }
      }
    },
    {
      name: '002_add_collaboration_tables',
      up: async () => {
        try {
          logger.info('Running migration: 002_add_collaboration_tables')

          // Create shared_documents table
          await db!.exec(`
            CREATE TABLE IF NOT EXISTS shared_documents (
              id TEXT PRIMARY KEY,
              document_id TEXT NOT NULL,
              owner_id TEXT NOT NULL,
              share_token TEXT UNIQUE NOT NULL,
              permission TEXT NOT NULL CHECK(permission IN ('view', 'comment', 'edit')),
              expires_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
              FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            );
          `)
          logger.info('Created shared_documents table')

          // Create document_comments table
          await db!.exec(`
            CREATE TABLE IF NOT EXISTS document_comments (
              id TEXT PRIMARY KEY,
              document_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              parent_comment_id TEXT,
              content TEXT NOT NULL,
              is_resolved INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (parent_comment_id) REFERENCES document_comments(id) ON DELETE CASCADE
            );
          `)
          logger.info('Created document_comments table')

          // Create share_access_logs table (optional, for analytics)
          await db!.exec(`
            CREATE TABLE IF NOT EXISTS share_access_logs (
              id TEXT PRIMARY KEY,
              share_id TEXT NOT NULL,
              user_id TEXT,
              action TEXT NOT NULL CHECK(action IN ('view', 'edit')),
              accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              ip_address TEXT,
              FOREIGN KEY (share_id) REFERENCES shared_documents(id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
          `)
          logger.info('Created share_access_logs table')

          // Create indexes for collaboration tables
          await db!.exec(`
            CREATE INDEX IF NOT EXISTS idx_shared_documents_document_id ON shared_documents(document_id);
            CREATE INDEX IF NOT EXISTS idx_shared_documents_owner_id ON shared_documents(owner_id);
            CREATE INDEX IF NOT EXISTS idx_shared_documents_share_token ON shared_documents(share_token);
            CREATE INDEX IF NOT EXISTS idx_shared_documents_expires_at ON shared_documents(expires_at);
            
            CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
            CREATE INDEX IF NOT EXISTS idx_document_comments_user_id ON document_comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_document_comments_parent_id ON document_comments(parent_comment_id);
            CREATE INDEX IF NOT EXISTS idx_document_comments_is_resolved ON document_comments(is_resolved);
            
            CREATE INDEX IF NOT EXISTS idx_share_access_logs_share_id ON share_access_logs(share_id);
            CREATE INDEX IF NOT EXISTS idx_share_access_logs_user_id ON share_access_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_share_access_logs_accessed_at ON share_access_logs(accessed_at);
          `)
          logger.info('Created indexes for collaboration tables')

          logger.info('Migration 002_add_collaboration_tables completed successfully')
        } catch (error) {
          logger.error('Error in migration 002:', error)
          throw error
        }
      }
    },
    {
      name: '003_add_shared_with_user_id',
      up: async () => {
        try {
          logger.info('Running migration: 003_add_shared_with_user_id')

          // Check if shared_documents table exists
          const tableExists = await db!.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='shared_documents'"
          )

          if (!tableExists) {
            logger.info('shared_documents table does not exist yet, skipping migration')
            return
          }

          // Check if shared_with_user_id column exists
          const tableInfo = await db!.all("PRAGMA table_info(shared_documents)")
          const columnNames = tableInfo.map((col: any) => col.name)

          if (!columnNames.includes('shared_with_user_id')) {
            await db!.exec('ALTER TABLE shared_documents ADD COLUMN shared_with_user_id TEXT;')
            logger.info('Added shared_with_user_id column to shared_documents table')

            // Create indexes for the new column
            await db!.exec(`
              CREATE INDEX IF NOT EXISTS idx_shared_documents_shared_with_user 
              ON shared_documents(shared_with_user_id);
              
              CREATE INDEX IF NOT EXISTS idx_shared_documents_token_user 
              ON shared_documents(share_token, shared_with_user_id);
            `)
            logger.info('Created indexes for shared_with_user_id column')
          } else {
            logger.info('shared_with_user_id column already exists')
          }

          logger.info('Migration 003_add_shared_with_user_id completed successfully')
        } catch (error) {
          logger.error('Error in migration 003:', error)
          throw error
        }
      }
    },
    {
      name: '004_add_chat_history',
      up: async () => {
        try {
          logger.info('Running migration: 004_add_chat_history')

          await db!.exec(`
            CREATE TABLE IF NOT EXISTS chat_messages (
              id TEXT PRIMARY KEY,
              document_id TEXT NOT NULL,
              user_id TEXT,
              role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
              content TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
          `)

          await db!.exec(`
            CREATE INDEX IF NOT EXISTS idx_chat_messages_document_id ON chat_messages(document_id);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
          `)

          logger.info('Migration 004_add_chat_history completed successfully')
        } catch (error) {
          logger.error('Error in migration 004:', error)
          throw error
        }
      }
    }
  ]

  for (const migration of migrations) {
    try {
      const applied = await db.get(
        'SELECT * FROM migrations WHERE name = ?',
        [migration.name]
      )

      if (!applied) {
        logger.info(`Running migration: ${migration.name}`)
        await migration.up()
        await db.run(
          'INSERT INTO migrations (name) VALUES (?)',
          [migration.name]
        )
        logger.info(`Migration completed: ${migration.name}`)
      } else {
        logger.info(`Migration already applied: ${migration.name}`)
      }
    } catch (error) {
      logger.error(`Migration failed: ${migration.name}`, error)
      throw error
    }
  }
}

async function createTables() {
  if (!db) throw new Error('Database not initialized')

  await db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Documents table
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('research', 'engineering', 'healthcare', 'meeting', 'general')),
      tags TEXT DEFAULT '[]',
      linked_documents TEXT DEFAULT '[]',
      collaborators TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at DATETIME,
      version INTEGER DEFAULT 1,
      word_count INTEGER DEFAULT 0,
      reading_time INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- User settings table
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'light' CHECK(theme IN ('light', 'dark', 'auto')),
      editor_font_size INTEGER DEFAULT 14,
      editor_line_height REAL DEFAULT 1.6,
      editor_word_wrap INTEGER DEFAULT 1,
      editor_show_line_numbers INTEGER DEFAULT 1,
      editor_font_family TEXT DEFAULT 'monospace',
      auto_save_interval INTEGER DEFAULT 3000,
      show_preview INTEGER DEFAULT 1,
      split_view INTEGER DEFAULT 1,
      email_notifications INTEGER DEFAULT 1,
      desktop_notifications INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Uploads table for tracking uploaded files
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      document_id TEXT,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      url TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
    CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);
    CREATE INDEX IF NOT EXISTS idx_documents_is_favorite ON documents(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_documents_last_accessed ON documents(last_accessed_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
    CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
    CREATE INDEX IF NOT EXISTS idx_uploads_document_id ON uploads(document_id);
  `)

  logger.info('Database tables created/verified')
}

export async function getDatabase(): Promise<Database> {
  if (!db) {
    return await initializeDatabase()
  }
  return db
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close()
    db = null
    logger.info('Database connection closed')
  }
}