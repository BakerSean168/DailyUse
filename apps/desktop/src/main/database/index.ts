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
 * 
 * EPIC-003 性能优化：
 * - WAL 模式提高并发写入性能
 * - 增大页缓存减少磁盘 I/O
 * - 内存临时存储加速查询
 * - mmap 内存映射提高读取性能
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const startTime = performance.now();
  const dbPath = getDatabasePath();

  db = new Database(dbPath);

  // ========== EPIC-003: 性能优化 Pragma ==========
  
  // WAL 模式：提高并发写入性能
  db.pragma('journal_mode = WAL');
  
  // 同步模式：NORMAL 平衡安全与速度（比 FULL 快，比 OFF 安全）
  db.pragma('synchronous = NORMAL');
  
  // 页缓存大小：负数表示 KB（约 40MB 缓存）
  db.pragma('cache_size = -40000');
  
  // 临时表存储：使用内存加速
  db.pragma('temp_store = MEMORY');
  
  // 内存映射大小：256MB（加速大文件读取）
  db.pragma('mmap_size = 268435456');
  
  // 锁模式：NORMAL 允许其他进程访问
  db.pragma('locking_mode = NORMAL');
  
  // 自动检查点间隔：1000 页后自动 checkpoint（约 4MB）
  db.pragma('wal_autocheckpoint = 1000');

  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 初始化表结构
  initializeTables(db);

  const initTime = performance.now() - startTime;
  console.log(`[Database] Connected to SQLite: ${dbPath} (${initTime.toFixed(2)}ms)`);
  console.log('[Database] Performance pragmas enabled: WAL, cache=40MB, mmap=256MB');

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
    // 最终 checkpoint 确保所有 WAL 数据写入主数据库
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {
      console.warn('[Database] Checkpoint failed:', e);
    }
    db.close();
    db = null;
    console.log('[Database] Connection closed');
  }
}

// ========== EPIC-003: 性能优化函数 ==========

let memoryCleanupInterval: NodeJS.Timeout | null = null;

/**
 * 启动定期内存清理
 * 每 5 分钟释放未使用的缓存内存
 */
export function startMemoryCleanup(intervalMs: number = 5 * 60 * 1000): void {
  if (memoryCleanupInterval) return;
  
  memoryCleanupInterval = setInterval(() => {
    if (db) {
      try {
        db.pragma('shrink_memory');
        console.log('[Database] Memory cleanup executed');
      } catch (e) {
        console.warn('[Database] Memory cleanup failed:', e);
      }
    }
  }, intervalMs);
  
  console.log(`[Database] Memory cleanup scheduled every ${intervalMs / 1000}s`);
}

/**
 * 停止定期内存清理
 */
export function stopMemoryCleanup(): void {
  if (memoryCleanupInterval) {
    clearInterval(memoryCleanupInterval);
    memoryCleanupInterval = null;
  }
}

/**
 * 获取数据库性能统计
 */
export function getDatabaseStats(): {
  cacheSize: number;
  pageSize: number;
  pageCount: number;
  walMode: boolean;
  mmapSize: number;
} {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  const cacheSize = db.pragma('cache_size')[0]?.cache_size ?? 0;
  const pageSize = db.pragma('page_size')[0]?.page_size ?? 0;
  const pageCount = db.pragma('page_count')[0]?.page_count ?? 0;
  const journalMode = db.pragma('journal_mode')[0]?.journal_mode ?? '';
  const mmapSize = db.pragma('mmap_size')[0]?.mmap_size ?? 0;
  
  return {
    cacheSize: Math.abs(cacheSize),
    pageSize,
    pageCount,
    walMode: journalMode === 'wal',
    mmapSize,
  };
}

/**
 * 手动执行 WAL checkpoint
 * 将 WAL 数据合并到主数据库文件
 */
export function executeCheckpoint(): void {
  if (db) {
    const result = db.pragma('wal_checkpoint(PASSIVE)');
    console.log('[Database] Checkpoint executed:', result);
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
