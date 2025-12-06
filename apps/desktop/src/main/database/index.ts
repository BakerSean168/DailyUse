/**
 * SQLite Database Connection Manager
 *
 * 使用 better-sqlite3 管理 SQLite 数据库连接
 * 遵循 ADR-007: 数据库选型 - 本地使用 SQLite
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * 获取数据库路径
 */
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');

  // 确保目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'dailyuse.sqlite');
}

/**
 * 初始化数据库连接
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();

  db = new Database(dbPath);

  // 启用 WAL 模式以提高并发性能
  db.pragma('journal_mode = WAL');

  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 初始化表结构
  initializeTables(db);

  console.log(`[Database] Connected to SQLite: ${dbPath}`);

  return db;
}

/**
 * 获取数据库连接
 * @throws Error 如果数据库未初始化
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[Database] Connection closed');
  }
}

/**
 * 初始化所有表结构
 */
function initializeTables(database: Database.Database): void {
  // Goals 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      folder_uuid TEXT,
      parent_goal_uuid TEXT,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT,
      feasibility_analysis TEXT,
      motivation TEXT,
      status TEXT DEFAULT 'ACTIVE',
      importance TEXT DEFAULT 'MEDIUM',
      urgency TEXT DEFAULT 'MEDIUM',
      category TEXT,
      tags TEXT,
      start_date INTEGER,
      target_date INTEGER,
      completed_at INTEGER,
      archived_at INTEGER,
      sort_order INTEGER DEFAULT 0,
      reminder_config TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (folder_uuid) REFERENCES goal_folders(uuid)
    )
  `);

  // Goal Folders 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goal_folders (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      icon TEXT,
      parent_folder_uuid TEXT,
      sort_order INTEGER DEFAULT 0,
      is_system_folder INTEGER DEFAULT 0,
      folder_type TEXT,
      goal_count INTEGER DEFAULT 0,
      completed_goal_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (parent_folder_uuid) REFERENCES goal_folders(uuid)
    )
  `);

  // Key Results 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS key_results (
      uuid TEXT PRIMARY KEY,
      goal_uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      progress TEXT NOT NULL,
      weight REAL DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE
    )
  `);

  // Goal Reviews 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goal_reviews (
      uuid TEXT PRIMARY KEY,
      goal_uuid TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER,
      achievements TEXT,
      challenges TEXT,
      next_actions TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE
    )
  `);

  // Goal Records 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goal_records (
      uuid TEXT PRIMARY KEY,
      goal_uuid TEXT NOT NULL,
      key_result_uuid TEXT,
      value REAL NOT NULL,
      note TEXT,
      recorded_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (goal_uuid) REFERENCES goals(uuid) ON DELETE CASCADE,
      FOREIGN KEY (key_result_uuid) REFERENCES key_results(uuid) ON DELETE SET NULL
    )
  `);

  // Goal Statistics 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS goal_statistics (
      account_uuid TEXT PRIMARY KEY,
      total_goals INTEGER DEFAULT 0,
      active_goals INTEGER DEFAULT 0,
      completed_goals INTEGER DEFAULT 0,
      archived_goals INTEGER DEFAULT 0,
      overdue_goals INTEGER DEFAULT 0,
      total_key_results INTEGER DEFAULT 0,
      completed_key_results INTEGER DEFAULT 0,
      average_progress REAL DEFAULT 0,
      goals_by_importance TEXT,
      goals_by_urgency TEXT,
      goals_by_category TEXT,
      goals_by_status TEXT,
      goals_created_this_week INTEGER DEFAULT 0,
      goals_completed_this_week INTEGER DEFAULT 0,
      goals_created_this_month INTEGER DEFAULT 0,
      goals_completed_this_month INTEGER DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      average_rating REAL,
      last_calculated_at INTEGER NOT NULL
    )
  `);

  // Accounts 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      uuid TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      locale TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'UTC',
      status TEXT DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Auth Credentials 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS auth_credentials (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // Sessions 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_uuid) REFERENCES accounts(uuid) ON DELETE CASCADE
    )
  `);

  // Settings 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      uuid TEXT PRIMARY KEY,
      account_uuid TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(account_uuid, key)
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_goals_account ON goals(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_goals_folder ON goals(folder_uuid);
    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
    CREATE INDEX IF NOT EXISTS idx_key_results_goal ON key_results(goal_uuid);
    CREATE INDEX IF NOT EXISTS idx_goal_reviews_goal ON goal_reviews(goal_uuid);
    CREATE INDEX IF NOT EXISTS idx_goal_records_goal ON goal_records(goal_uuid);
    CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_uuid);
    CREATE INDEX IF NOT EXISTS idx_settings_account ON settings(account_uuid);
  `);

  console.log('[Database] Tables initialized');
}

/**
 * 在事务中执行操作
 */
export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  return database.transaction(fn)();
}
