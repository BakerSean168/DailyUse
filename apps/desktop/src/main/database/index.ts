/**
 * @file SQLite Database Connection Manager
 * @description 使用 better-sqlite3 管理 SQLite 数据库连接
 * 遵循 ADR-007: 数据库选型 - 本地使用 SQLite
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * @function getDatabasePath
 * @description 获取数据库路径
 * @returns {string} 数据库文件的完整路径
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
 * @function initializeDatabase
 * @description 初始化数据库连接
 * 
 * EPIC-003 性能优化：
 * - WAL 模式提高并发写入性能
 * - 增大页缓存减少磁盘 I/O
 * - 内存临时存储加速查询
 * - mmap 内存映射提高读取性能
 *
 * @returns {Database.Database} Database connection instance
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
 * @function getDatabase
 * @description 获取数据库连接
 * @throws {Error} 如果数据库未初始化
 * @returns {Database.Database} Database connection instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * @function closeDatabase
 * @description 关闭数据库连接
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
 * @function startMemoryCleanup
 * @description 启动定期内存清理
 * 每 5 分钟释放未使用的缓存内存
 * @param {number} [intervalMs=300000] - 清理间隔（毫秒），默认为 5 分钟
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
 * @function stopMemoryCleanup
 * @description 停止定期内存清理
 */
export function stopMemoryCleanup(): void {
  if (memoryCleanupInterval) {
    clearInterval(memoryCleanupInterval);
    memoryCleanupInterval = null;
  }
}

/**
 * @function getDatabaseStats
 * @description 获取数据库性能统计
 * @returns {Object} 数据库性能统计信息
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
  
  const cacheSizeResult = db.pragma('cache_size') as Array<{ cache_size: number }>;
  const pageSizeResult = db.pragma('page_size') as Array<{ page_size: number }>;
  const pageCountResult = db.pragma('page_count') as Array<{ page_count: number }>;
  const journalModeResult = db.pragma('journal_mode') as Array<{ journal_mode: string }>;
  const mmapSizeResult = db.pragma('mmap_size') as Array<{ mmap_size: number }>;
  
  const cacheSize = cacheSizeResult[0]?.cache_size ?? 0;
  const pageSize = pageSizeResult[0]?.page_size ?? 0;
  const pageCount = pageCountResult[0]?.page_count ?? 0;
  const journalMode = journalModeResult[0]?.journal_mode ?? '';
  const mmapSize = mmapSizeResult[0]?.mmap_size ?? 0;
  
  return {
    cacheSize: Math.abs(cacheSize),
    pageSize,
    pageCount,
    walMode: journalMode === 'wal',
    mmapSize,
  };
}

/**
 * @function executeCheckpoint
 * @description 手动执行 WAL checkpoint
 * 将 WAL 数据合并到主数据库文件
 */
export function executeCheckpoint(): void {
  if (db) {
    const result = db.pragma('wal_checkpoint(PASSIVE)');
    console.log('[Database] Checkpoint executed:', result);
  }
}

/**
 * @function initializeTables
 * @description 初始化所有表结构
 * @param {Database.Database} database - 数据库实例
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

  // ========== EPIC-004: 同步基础设施表 ==========
  initializeSyncTables(database);

  console.log('[Database] Tables initialized');
}

/**
 * @function initializeSyncTables
 * @description 初始化同步相关表结构
 * EPIC-004: Offline Sync - 多设备数据同步
 * @param {Database.Database} database - 数据库实例
 */
function initializeSyncTables(database: Database.Database): void {
  // sync_log 表 - 记录所有本地变更
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
      payload TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      version INTEGER NOT NULL,
      sync_error TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // sync_log 索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced);
    CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_sync_log_device ON sync_log(device_id);
  `);

  // devices 表 - 设备注册信息
  database.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      device_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      app_version TEXT,
      last_sync_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  // sync_state 表 - 同步状态 (单例)
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_state TEXT DEFAULT 'idle',
      pending_count INTEGER DEFAULT 0,
      last_sync_version INTEGER DEFAULT 0,
      last_sync_at INTEGER,
      last_error TEXT,
      updated_at INTEGER NOT NULL
    )
  `);

  // 初始化 sync_state 默认行
  database.exec(`
    INSERT OR IGNORE INTO sync_state (id, current_state, pending_count, updated_at)
    VALUES (1, 'idle', 0, ${Date.now()})
  `);

  // conflict_records 表 - 冲突记录
  database.exec(`
    CREATE TABLE IF NOT EXISTS conflict_records (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      local_data TEXT NOT NULL,
      server_data TEXT NOT NULL,
      conflicting_fields TEXT NOT NULL,
      resolution TEXT,
      resolved_at INTEGER,
      resolved_by TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // conflict_records 索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_conflict_unresolved ON conflict_records(entity_type) WHERE resolved_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_conflict_entity ON conflict_records(entity_type, entity_id);
  `);

  // sync_settings 表 - 同步设置
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER DEFAULT 1,
      auto_sync INTEGER DEFAULT 1,
      wifi_only INTEGER DEFAULT 0,
      conflict_notification TEXT DEFAULT 'taskbar',
      manual_sync_interval INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    )
  `);

  // 初始化 sync_settings 默认行
  database.exec(`
    INSERT OR IGNORE INTO sync_settings (id, updated_at)
    VALUES (1, ${Date.now()})
  `);

  // app_config 表 - 应用配置 (用于存储设备 ID 等)
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  console.log('[Database] Sync tables initialized (EPIC-004)');
}

/**
 * @function transaction
 * @description 在事务中执行操作
 * @template T
 * @param {() => T} fn - 包含数据库操作的函数
 * @returns {T} 函数的返回值
 */
export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  return database.transaction(fn)();
}
