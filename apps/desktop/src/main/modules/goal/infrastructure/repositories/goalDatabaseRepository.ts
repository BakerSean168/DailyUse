import type { Database } from 'better-sqlite3';
import type { IGoalRepository } from '../../domain/repositories/iGoalRepository';
import { Goal } from '../../domain/aggregates/goal';
import { GoalFolder } from '../../domain/aggregates/GoalFolder';
import { GoalRecord } from '../../domain/entities/record';
import { KeyResult } from '../../domain/entities/keyResult';
import { GoalReview } from '../../domain/entities/goalReview';

/**
 * 目标模块数据库仓储实现
 * 负责所有目标相关实体的数据库持久化、查询与转换
 */
export class GoalDatabaseRepository implements IGoalRepository {
  constructor(private db: Database) {}

  // ========================= 目标目录相关 =========================

  /**
   * 创建目标目录
   * @param accountUuid 用户账号uuid
   * @param GoalFolder 目标目录实体
   * @returns 创建后的 GoalFolder 实体
   * @example
   * const dir = await repo.createGoalFolderectory('acc-uuid', GoalFolder);
   */
  async createGoalFolderectory(accountUuid: string, GoalFolder: GoalFolder): Promise<GoalFolder> {
    const row = await this.mapGoalFolderToRow(accountUuid, GoalFolder);
    const stmt = this.db.prepare(`
      INSERT INTO goal_directories (
        uuid, account_uuid, name, description, icon, color, parent_uuid, category_uuid, sort_key, sort_order, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      row.uuid,
      accountUuid,
      row.name,
      row.description,
      row.icon,
      row.color,
      row.parentUuid || null,
      row.categoryUuid || null,
      row.sortKey || 'default',
      row.sortOrder || 0,
      row.status || 'active',
      row.createdAt?.getTime?.() || Date.now(),
      row.updatedAt?.getTime?.() || Date.now(),
    );
    const createdGoalFolder = await this.getGoalFolderectoryByUuid(accountUuid, GoalFolder.uuid);
    if (!createdGoalFolder) throw new Error('Failed to create goal directory');
    return createdGoalFolder;
    // 返回示例: GoalFolder 实例
  }

  /**
   * 根据uuid获取目标目录
   * @param accountUuid 用户账号uuid
   * @param uuid 目录uuid
   * @returns GoalFolder 实体或 null
   */
  async getGoalFolderectoryByUuid(accountUuid: string, uuid: string): Promise<GoalFolder | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM goal_directories WHERE account_uuid = ? AND uuid = ?`,
    );
    const row = stmt.get(accountUuid, uuid);
    if (!row) return null;
    return await this.mapRowToGoalFolder(row);
    // 返回示例: GoalFolder 实例或 null
  }

  /**
   * 获取所有目标目录
   * @param accountUuid 用户账号uuid
   * @returns 目录数组 GoalFolder[]
   */
  async getAllGoalFolderectories(accountUuid: string): Promise<GoalFolder[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM goal_directories WHERE account_uuid = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(accountUuid);
    const GoalFolders: GoalFolder[] = [];
    for (const row of rows) {
      const GoalFolder = await this.mapRowToGoalFolder(row);
      GoalFolders.push(GoalFolder);
    }
    return GoalFolders;
    // 返回示例: [GoalFolder, GoalFolder, ...]
  }

  /**
   * 更新目标目录
   * @param accountUuid 用户账号uuid
   * @param GoalFolder 目标目录实体
   * @returns 更新后的 GoalFolder 实体
   */
  async updateGoalFolderectory(accountUuid: string, GoalFolder: GoalFolder): Promise<GoalFolder> {
    const row = await this.mapGoalFolderToRow(accountUuid, GoalFolder);
    const stmt = this.db.prepare(`
      UPDATE goal_directories 
      SET name = ?, description = ?, icon = ?, color = ?, parent_uuid = ?, 
          category_uuid = ?, sort_key = ?, sort_order = ?, status = ?, updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(
      row.name,
      row.description,
      row.icon,
      row.color,
      row.parent_uuid || null,
      row.category_uuid || null,
      row.sort_key || 'default',
      row.sort_order || 0,
      row.status || 'active',
      row.updated_at,
      accountUuid,
      row.uuid,
    );
    const updatedGoalFolder = await this.getGoalFolderectoryByUuid(accountUuid, GoalFolder.uuid);
    if (!updatedGoalFolder) throw new Error('Failed to update goal directory');
    return updatedGoalFolder;
  }

  /**
   * 删除目标目录
   * @param accountUuid 用户账号uuid
   * @param uuid 目录uuid
   */
  async deleteGoalFolderectory(accountUuid: string, uuid: string): Promise<void> {
    const stmt = this.db.prepare(
      `DELETE FROM goal_directories WHERE account_uuid = ? AND uuid = ?`,
    );
    stmt.run(accountUuid, uuid);
  }

  // ========================= 目标相关 =========================

  /**
   * 创建目标
   * @param accountUuid 用户账号uuid
   * @param goal 目标实体
   * @returns 创建后的 Goal 实体
   * @example
   * const goal = await repo.createGoal('acc-uuid', goal);
   */
  async createGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    const row = await this.mapGoalToRow(accountUuid, goal);
    const stmt = this.db.prepare(`
      INSERT INTO goals (
        uuid, account_uuid, directory_uuid, category_uuid, name, description, color, icon,
        feasibility_analysis, motive_analysis, start_time, end_time, priority, goal_type,
        tags, notes, attachments, analysis, status, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      row.uuid,
      accountUuid,
      row.directory_uuid,
      row.category_uuid || null,
      row.name,
      row.description,
      row.color,
      row.icon,
      row.feasibility_analysis,
      row.motive_analysis,
      row.start_time,
      row.end_time,
      row.priority,
      row.goal_type,
      row.tags,
      row.notes,
      row.attachments,
      row.analysis,
      row.status,
      row.version,
      row.created_at,
      row.updated_at,
    );
    // 创建关键结果
    for (const kr of goal.keyResults) {
      await this.createKeyResult(accountUuid, goal.uuid, kr);
    }
    const createdGoal = await this.getGoalByUuid(accountUuid, goal.uuid);
    if (!createdGoal) throw new Error('Failed to create goal');
    return createdGoal;
    // 返回示例: Goal 实例
  }

  /**
   * 根据uuid获取目标
   * @param accountUuid 用户账号uuid
   * @param uuid 目标uuid
   * @returns Goal 实体或 null
   */
  async getGoalByUuid(accountUuid: string, uuid: string): Promise<Goal | null> {
    const stmt = this.db.prepare(`SELECT * FROM goals WHERE account_uuid = ? AND uuid = ?`);
    const row = stmt.get(accountUuid, uuid);
    if (!row) return null;
    // 加载关键结果、记录、评审
    const keyResults = await this.getKeyResultsByGoalUuid(accountUuid, uuid);
    const records = await this.getGoalRecordsByGoal(accountUuid, uuid);
    const reviews = await this.getGoalReviewsByGoal(accountUuid, uuid);
    return await this.mapRowToGoal(row, keyResults, records, reviews);
    // 返回示例: Goal 实例或 null
  }

  /**
   * 获取所有目标
   * @param accountUuid 用户账号uuid
   * @returns 目标数组 Goal[]
   */
  async getAllGoals(accountUuid: string): Promise<Goal[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM goals WHERE account_uuid = ? ORDER BY created_at DESC`,
    );
    const rows: any[] = stmt.all(accountUuid);
    const goals: Goal[] = [];
    for (const row of rows) {
      const keyResults = await this.getKeyResultsByGoalUuid(accountUuid, row.uuid);
      const records = await this.getGoalRecordsByGoal(accountUuid, row.uuid);
      const reviews = await this.getGoalReviewsByGoal(accountUuid, row.uuid);
      const goal = await this.mapRowToGoal(row, keyResults, records, reviews);
      goals.push(goal);
    }
    return goals;
    // 返回示例: [Goal, Goal, ...]
  }

  /**
   * 获取指定目录下的所有目标
   * @param accountUuid 用户账号uuid
   * @param directoryId 目录uuid
   * @returns 目标数组 Goal[]
   */
  async getGoalsByDirectory(accountUuid: string, directoryId: string): Promise<Goal[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM goals WHERE account_uuid = ? AND directory_uuid = ? ORDER BY created_at DESC`,
    );
    const rows: any[] = stmt.all(accountUuid, directoryId);
    const goals: Goal[] = [];
    for (const row of rows) {
      const keyResults = await this.getKeyResultsByGoalUuid(accountUuid, row.uuid);
      const records = await this.getGoalRecordsByGoal(accountUuid, row.uuid);
      const reviews = await this.getGoalReviewsByGoal(accountUuid, row.uuid);
      const goal = await this.mapRowToGoal(row, keyResults, records, reviews);
      goals.push(goal);
    }
    return goals;
  }

  /**
   * 更新目标
   * @param accountUuid 用户账号uuid
   * @param goal 目标实体
   * @returns 更新后的 Goal 实体
   */
  async updateGoal(accountUuid: string, goal: Goal): Promise<Goal> {
    const row = await this.mapGoalToRow(accountUuid, goal);
    const stmt = this.db.prepare(`
      UPDATE goals 
      SET directory_uuid = ?, category_uuid = ?, name = ?, description = ?, color = ?, icon = ?,
          feasibility_analysis = ?, motive_analysis = ?, start_time = ?, end_time = ?, priority = ?, goal_type = ?,
          tags = ?, notes = ?, attachments = ?, analysis = ?, status = ?, version = ?, updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(
      row.directory_uuid,
      row.category_uuid || null,
      row.name,
      row.description,
      row.color,
      row.icon,
      row.feasibility_analysis,
      row.motive_analysis,
      row.start_time,
      row.end_time,
      row.priority,
      row.goal_type,
      row.tags,
      row.notes,
      row.attachments,
      row.analysis,
      row.status,
      row.version,
      row.updated_at,
      accountUuid,
      row.uuid,
    );
    // 更新关键结果（增量同步）
    await this.updateKeyResultsForGoal(accountUuid, goal.uuid, goal.keyResults);
    const updatedGoal = await this.getGoalByUuid(accountUuid, goal.uuid);
    if (!updatedGoal) throw new Error('Failed to update goal');
    return updatedGoal;
  }

  /**
   * 删除目标
   * @param accountUuid 用户账号uuid
   * @param uuid 目标uuid
   */
  async deleteGoal(accountUuid: string, uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goals WHERE account_uuid = ? AND uuid = ?`);
    stmt.run(accountUuid, uuid);
  }

  // ========================= 关键结果相关 =========================

  /**
   * 增量同步关键结果（更新、插入、删除）
   * @param accountUuid 用户账号uuid
   * @param goalUuid 目标uuid
   * @param keyResults 关键结果数组
   * @example
   * await repo.updateKeyResultsForGoal('acc-uuid', 'goal-uuid', [KeyResult, ...])
   */
  private async updateKeyResultsForGoal(
    accountUuid: string,
    goalUuid: string,
    keyResults: KeyResult[],
  ) {
    // 1. 查询数据库中现有的 keyResult uuid
    const stmt: any = this.db.prepare(
      `SELECT uuid FROM key_results WHERE goal_uuid = ? AND account_uuid = ?`,
    );
    const dbKRs: { uuid: string }[] = stmt.all(goalUuid, accountUuid);
    const dbKRUuidSet = new Set(dbKRs.map((kr) => kr.uuid));
    const inputKRUuidSet = new Set(keyResults.map((kr) => kr.uuid));

    // 2. 更新和新增
    for (const kr of keyResults) {
      if (dbKRUuidSet.has(kr.uuid)) {
        // 已存在，执行 UPDATE
        await this.updateKeyResult(accountUuid, goalUuid, kr);
      } else {
        // 不存在，执行 INSERT
        await this.createKeyResult(accountUuid, goalUuid, kr);
      }
    }

    // 3. 删除数据库中有但前端没有的
    for (const dbUuid of dbKRUuidSet) {
      if (!inputKRUuidSet.has(dbUuid)) {
        await this.deleteKeyResult(accountUuid, goalUuid, dbUuid);
      }
    }
  }

  /**
   * 创建关键结果
   * @param accountUuid 用户账号uuid
   * @param goalUuid 目标uuid
   * @param keyResult 关键结果实体
   * @returns 新关键结果uuid
   */
  async createKeyResult(
    accountUuid: string,
    goalUuid: string,
    keyResult: KeyResult,
  ): Promise<string> {
    const row = await this.mapKeyResultToRow(accountUuid, goalUuid, keyResult);
    const stmt = this.db.prepare(`
      INSERT INTO key_results (
        uuid, account_uuid, goal_uuid, name, description, 
        start_value, target_value, current_value, unit, calculation_method, 
        weight, priority, status, progress_percentage, deadline, 
        completed_at, tags, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      row.uuid,
      accountUuid,
      goalUuid,
      row.name,
      row.description,
      row.start_value,
      row.target_value,
      row.current_value,
      row.unit,
      row.calculation_method,
      row.weight,
      row.priority,
      row.status,
      row.progress_percentage,
      row.deadline,
      row.completed_at,
      row.tags,
      row.notes,
      row.created_at,
      row.updated_at,
    );
    return keyResult.uuid;
    // 返回示例: "key-result-uuid"
  }

  /**
   * 删除关键结果
   * @param accountUuid 用户账号uuid
   * @param goalUuid 目标uuid
   * @param keyResultUuid 关键结果uuid
   */
  async deleteKeyResult(
    accountUuid: string,
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<void> {
    const stmt = this.db.prepare(
      `DELETE FROM key_results WHERE account_uuid = ? AND goal_uuid = ? AND uuid = ?`,
    );
    stmt.run(accountUuid, goalUuid, keyResultUuid);
  }

  /**
   * 获取目标下所有关键结果
   * @param accountUuid 用户账号uuid
   * @param goalUuid 目标uuid
   * @returns KeyResult[]
   */
  async getKeyResultsByGoalUuid(accountUuid: string, goalUuid: string): Promise<KeyResult[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM key_results WHERE account_uuid = ? AND goal_uuid = ? ORDER BY created_at ASC`,
    );
    const rows = stmt.all(accountUuid, goalUuid);
    const keyResults: KeyResult[] = [];
    for (const row of rows) {
      const keyResult = await this.mapRowToKeyResult(row);
      keyResults.push(keyResult);
    }
    return keyResults;
    // 返回示例: [KeyResult, KeyResult, ...]
  }

  /**
   * 更新关键结果
   * @param accountUuid 用户账号uuid
   * @param goalUuid 目标uuid
   * @param keyResult 关键结果实体
   * @returns 更新后的 KeyResult 实体
   */
  async updateKeyResult(
    accountUuid: string,
    goalUuid: string,
    keyResult: KeyResult,
  ): Promise<KeyResult> {
    const row = await this.mapKeyResultToRow(accountUuid, goalUuid, keyResult);
    const stmt = this.db.prepare(`
      UPDATE key_results 
      SET name = ?, description = ?, start_value = ?, target_value = ?, current_value = ?, 
          unit = ?, calculation_method = ?, weight = ?, priority = ?, status = ?, 
          progress_percentage = ?, deadline = ?, completed_at = ?, tags = ?, notes = ?, 
          updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(
      row.name,
      row.description,
      row.start_value,
      row.target_value,
      row.current_value,
      row.unit,
      row.calculation_method,
      row.weight,
      row.priority,
      row.status,
      row.progress_percentage,
      row.deadline,
      row.completed_at,
      row.tags,
      row.notes,
      row.updated_at,
      accountUuid,
      row.uuid,
    );
    // 返回更新后的 KeyResult
    const updatedKeyResult = await this.getKeyResultsByGoalUuid(accountUuid, goalUuid);
    if (!updatedKeyResult) throw new Error('Failed to update key result');
    return updatedKeyResult[0];
  }

  // ========================= 目标记录相关 =========================

  /**
   * 创建目标记录
   * @param accountUuid 用户账号uuid
   * @param record 目标记录实体
   * @returns 创建后的 GoalRecord 实体
   */
  async createGoalRecord(accountUuid: string, record: GoalRecord): Promise<GoalRecord> {
    const row = await this.mapGoalRecordToRow(accountUuid, record);
    const stmt = this.db.prepare(`
      INSERT INTO goal_records (
        uuid, account_uuid, goal_uuid, key_result_uuid, value, notes, metadata, 
        is_verified, verified_by, verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      row.uuid,
      accountUuid,
      row.goal_uuid,
      row.key_result_uuid,
      row.value,
      row.notes,
      row.metadata,
      row.is_verified,
      row.verified_by,
      row.verified_at,
      row.created_at,
      row.updated_at,
    );
    return record;
    // 返回示例: GoalRecord 实例
  }

  /**
   * 根据uuid获取目标记录
   * @param accountUuid 用户账号uuid
   * @param uuid 记录uuid
   * @returns GoalRecord 实体或 null
   */
  async getGoalRecordByUuid(accountUuid: string, uuid: string): Promise<GoalRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM goal_records WHERE account_uuid = ? AND uuid = ?`);
    const row = stmt.get(accountUuid, uuid);
    if (!row) return null;
    return this.mapRowToGoalRecord(row);
  }

  /**
   * 获取目标下所有记录
   * @param accountUuid 用户账号uuid
   * @param goalUuid 目标uuid
   * @returns GoalRecord[]
   */
  async getGoalRecordsByGoal(accountUuid: string, goalUuid: string): Promise<GoalRecord[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM goal_records WHERE account_uuid = ? AND goal_uuid = ? ORDER BY created_at DESC`,
    );
    const rows = stmt.all(accountUuid, goalUuid);
    const records: GoalRecord[] = [];
    for (const row of rows) {
      const record = await this.mapRowToGoalRecord(row);
      records.push(record);
    }
    return records;
    // 返回示例: [GoalRecord, GoalRecord, ...]
  }

  /**
   * 更新目标记录
   * @param accountUuid 用户账号uuid
   * @param record 目标记录实体
   * @returns 更新后的 GoalRecord 实体
   */
  async updateGoalRecord(accountUuid: string, record: GoalRecord): Promise<GoalRecord> {
    const row = await this.mapGoalRecordToRow(accountUuid, record);
    const stmt = this.db.prepare(`
      UPDATE goal_records 
      SET value = ?, notes = ?, metadata = ?, is_verified = ?, verified_by = ?, 
          verified_at = ?, updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(
      row.value,
      row.notes,
      row.metadata,
      row.is_verified,
      row.verified_by,
      row.verified_at,
      row.updated_at,
      accountUuid,
      row.uuid,
    );
    return record;
  }

  /**
   * 删除目标记录
   * @param accountUuid 用户账号uuid
   * @param uuid 记录uuid
   */
  async deleteGoalRecord(accountUuid: string, uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goal_records WHERE account_uuid = ? AND uuid = ?`);
    stmt.run(accountUuid, uuid);
  }

  // ========================= 目标评审相关 =========================

  /**
   * 创建目标评审
   * @param accountUuid 用户账号uuid
   * @param review 目标评审实体
   * @returns 创建后的 GoalReview 实体
   */
  async createGoalReview(accountUuid: string, review: GoalReview): Promise<GoalReview> {
    const row = await this.mapGoalReviewToRow(accountUuid, review);
    const stmt = this.db.prepare(`
      INSERT INTO goal_reviews (
        uuid, account_uuid, goal_uuid, title, review_type, review_date, 
        executive_rating, progress_rating, goalReasonableness_rating, 
        achievements, challenges, learnings, next_steps, adjustment_recommendations, 
        snapshot, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      row.uuid,
      accountUuid,
      row.goal_uuid,
      row.title,
      row.review_type,
      row.review_date,
      row.executive_rating,
      row.progress_rating,
      row.goalReasonableness_rating,
      row.achievements,
      row.challenges,
      row.learnings,
      row.next_steps,
      row.adjustment_recommendations,
      row.snapshot,
      row.metadata,
      row.created_at,
      row.updated_at,
    );
    return review;
    // 返回示例: GoalReview 实例
  }

  /**
   * 删除目标评审
   * @param accountUuid 用户账号uuid
   * @param uuid 评审uuid
   */
  async removeGoalReview(accountUuid: string, uuid: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goal_reviews WHERE account_uuid = ? AND uuid = ?`);
    stmt.run(accountUuid, uuid);
  }

  /**
   * 根据uuid获取目标评审
   * @param accountUuid 用户账号uuid
   * @param uuid 评审uuid
   * @returns GoalReview 实体或 null
   */
  async getGoalReviewByUuid(accountUuid: string, uuid: string): Promise<GoalReview | null> {
    const stmt = this.db.prepare(`SELECT * FROM goal_reviews WHERE account_uuid = ? AND uuid = ?`);
    const row = stmt.get(accountUuid, uuid);
    if (!row) return null;
    return this.mapRowToGoalReview(row);
  }

  /**
   * 获取目标下所有评审
   * @param accountUuid 用户账号uuid
   * @param goalUuid 目标uuid
   * @returns GoalReview[]
   */
  async getGoalReviewsByGoal(accountUuid: string, goalUuid: string): Promise<GoalReview[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM goal_reviews WHERE account_uuid = ? AND goal_uuid = ? ORDER BY review_date DESC`,
    );
    const rows = stmt.all(accountUuid, goalUuid);
    const reviews: GoalReview[] = [];
    for (const row of rows) {
      const review = await this.mapRowToGoalReview(row);
      reviews.push(review);
    }
    return reviews;
    // 返回示例: [GoalReview, GoalReview, ...]
  }

  /**
   * 更新目标评审
   * @param accountUuid 用户账号uuid
   * @param review 目标评审实体
   * @returns 更新后的 GoalReview 实体
   */
  async updateGoalReview(accountUuid: string, review: GoalReview): Promise<GoalReview> {
    const row = await this.mapGoalReviewToRow(accountUuid, review);
    const stmt = this.db.prepare(`
      UPDATE goal_reviews 
      SET title = ?, review_type = ?, review_date = ?, 
          executive_rating = ?, progress_rating = ?, goalReasonableness_rating = ?, 
          achievements = ?, challenges = ?, learnings = ?, next_steps = ?, 
          adjustment_recommendations = ?, snapshot = ?, metadata = ?, updated_at = ?
      WHERE account_uuid = ? AND uuid = ?
    `);
    stmt.run(
      row.title,
      row.review_type,
      row.review_date,
      row.executive_rating,
      row.progress_rating,
      row.goalReasonableness_rating,
      row.achievements,
      row.challenges,
      row.learnings,
      row.next_steps,
      row.adjustment_recommendations,
      row.snapshot,
      row.metadata,
      row.updated_at,
      accountUuid,
      row.uuid,
    );
    const updatedReview = await this.getGoalReviewByUuid(accountUuid, review.uuid);
    if (!updatedReview) throw new Error('Failed to update goal review');
    return updatedReview;
  }

  // ========================= 批量操作 =========================

  /**
   * 批量删除目标
   * @param accountUuid 用户账号uuid
   * @param uuids 目标uuid数组
   */
  async batchDeleteGoals(accountUuid: string, uuids: string[]): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goals WHERE account_uuid = ? AND uuid = ?`);
    for (const uuid of uuids) {
      stmt.run(accountUuid, uuid);
    }
  }

  /**
   * 批量删除目标记录
   * @param accountUuid 用户账号uuid
   * @param uuids 记录uuid数组
   */
  async batchDeleteGoalRecords(accountUuid: string, uuids: string[]): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM goal_records WHERE account_uuid = ? AND uuid = ?`);
    for (const uuid of uuids) {
      stmt.run(accountUuid, uuid);
    }
  }

  // ========================= 辅助方法（实体<->数据库行） =========================

  /**
   * Goal 实体转数据库行
   * @param accountUuid 用户账号uuid
   * @param goal Goal 实体
   * @returns 数据库行对象
   * @example
   * {
   *   uuid: 'xxx',
   *   name: '目标A',
   *   directory_uuid: 'dir-uuid',
   *   start_time: 1710000000000,
   *   ...
   * }
   */
  private async mapGoalToRow(accountUuid: string, goal: Goal): Promise<any> {
    const dto = goal.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      directory_uuid: dto.dirUuid,
      category_uuid: null, // Not in DTO
      name: dto.name,
      description: dto.description || null,
      color: dto.color,
      icon: null, // Not in DTO
      feasibility_analysis: JSON.stringify(dto.analysis.feasibility),
      motive_analysis: JSON.stringify(dto.analysis.motive),
      start_time:
        typeof dto.startTime === 'string'
          ? new Date(dto.startTime).getTime()
          : dto.startTime.getTime(),
      end_time:
        typeof dto.endTime === 'string' ? new Date(dto.endTime).getTime() : dto.endTime.getTime(),
      priority: 3, // Default value
      goal_type: 'personal', // Default value
      tags: null, // Not in DTO
      notes: dto.note || null,
      attachments: null, // Not in DTO
      analysis: JSON.stringify(dto.analysis),
      status: dto.lifecycle.status,
      version: dto.version,
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  /**
   * GoalFolder 实体转数据库行
   * @param accountUuid 用户账号uuid
   * @param GoalFolder GoalFolder 实体
   * @returns 数据库行对象
   */
  private async mapGoalFolderToRow(accountUuid: string, GoalFolder: GoalFolder): Promise<any> {
    const dto = GoalFolder.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      name: dto.name,
      description: dto.description || null,
      icon: dto.icon,
      color: dto.color || 'default-color',
      parent_uuid: dto.parentUuid || null,
      category_uuid: null, // Not in DTO
      sort_key: dto.sortConfig?.sortKey || 'default',
      sort_order: dto.sortConfig?.sortOrder || 0,
      status: dto.lifecycle.status,
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  /**
   * GoalRecord 实体转数据库行
   * @param accountUuid 用户账号uuid
   * @param record GoalRecord 实体
   * @returns 数据库行对象
   */
  private async mapGoalRecordToRow(accountUuid: string, record: GoalRecord): Promise<any> {
    const dto = record.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      goal_uuid: dto.goalUuid,
      key_result_uuid: dto.keyResultUuid,
      value: dto.value,
      notes: dto.note || null,
      metadata: null, // Not in DTO
      is_verified: 0, // Default value
      verified_by: null, // Default value
      verified_at: null, // Default value
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  /**
   * KeyResult 实体转数据库行
   * @param accountUuid 用户账号uuid
   * @param goalUuid 目标uuid
   * @param keyResult KeyResult 实体
   * @returns 数据库行对象
   */
  private async mapKeyResultToRow(
    accountUuid: string,
    goalUuid: string,
    keyResult: KeyResult,
  ): Promise<any> {
    const dto = keyResult.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      goal_uuid: goalUuid,
      name: dto.name,
      description: null, // Not in DTO
      start_value: dto.startValue,
      target_value: dto.targetValue,
      current_value: dto.currentValue,
      unit: null, // Not in DTO
      calculation_method: dto.calculationMethod,
      weight: dto.weight,
      priority: 3, // Default value
      status: dto.lifecycle.status,
      progress_percentage: 0.0, // Default value
      deadline: null, // Not in DTO
      completed_at: null, // Not in DTO
      tags: null, // Not in DTO
      notes: null, // Not in DTO
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  /**
   * GoalReview 实体转数据库行
   * @param accountUuid 用户账号uuid
   * @param review GoalReview 实体
   * @returns 数据库行对象
   */
  private async mapGoalReviewToRow(accountUuid: string, review: GoalReview): Promise<any> {
    const dto = review.toDTO();
    const row = {
      uuid: dto.uuid,
      account_uuid: accountUuid,
      goal_uuid: dto.goalUuid,
      title: dto.title,
      review_type: dto.type,
      review_date: dto.reviewDate.getTime(),
      executive_rating: dto.rating.executionEfficiency,
      progress_rating: dto.rating.progressSatisfaction,
      goalReasonableness_rating: dto.rating.goalReasonableness,
      achievements: dto.content.achievements,
      challenges: dto.content.challenges,
      learnings: dto.content.learnings,
      next_steps: dto.content.nextSteps,
      adjustment_recommendations: dto.content.adjustments || null,
      snapshot: JSON.stringify(dto.snapshot),
      metadata: null,
      created_at: dto.lifecycle.createdAt?.getTime() || Date.now(),
      updated_at: dto.lifecycle.updatedAt?.getTime() || Date.now(),
    };
    return row;
  }

  /**
   * 数据库行转 Goal 实体
   * @param row 数据库行
   * @param keyResults 关键结果数组
   * @param records 记录数组
   * @param reviews 评审数组
   * @returns Goal 实体
   */
  private async mapRowToGoal(
    row: any,
    keyResults: KeyResult[],
    records: GoalRecord[],
    reviews: GoalReview[],
  ): Promise<Goal> {
    const goalDTO = {
      uuid: row.uuid,
      name: row.name,
      description: row.description,
      color: row.color,
      dirUuid: row.directory_uuid,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      note: row.note,
      analysis: {
        motive: row.motive,
        feasibility: row.feasibility,
      },
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        status: row.status || 'active',
      },
      version: row.version,
      accountUuid: row.account_uuid,
      keyResults: keyResults,
      records: records,
      reviews: reviews,
    };
    return Goal.fromDTO(goalDTO);
  }

  /**
   * 数据库行转 GoalFolder 实体
   * @param row 数据库行
   * @returns GoalFolder 实体
   */
  private async mapRowToGoalFolder(row: any): Promise<GoalFolder> {
    const GoalFolderDTO = {
      uuid: row.uuid,
      name: row.name,
      description: row.description || undefined,
      icon: row.icon,
      color: row.color || 'default-color',
      sortConfig: {
        sortKey: row.sort_key || 'default',
        sortOrder: row.sort_order || 0,
      },
      parentUuid: row.parent_uuid,
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        status: row.status || 'active',
      },
    };
    return GoalFolder.fromDTO(GoalFolderDTO);
  }

  /**
   * 数据库行转 KeyResult 实体
   * @param row 数据库行
   * @returns KeyResult 实体
   */
  private async mapRowToKeyResult(row: any): Promise<KeyResult> {
    const keyResultDTO = {
      uuid: row.uuid,
      name: row.name,
      startValue: row.start_value,
      targetValue: row.target_value,
      currentValue: row.current_value,
      calculationMethod: row.calculation_method,
      weight: row.weight,
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        status: row.status || 'active',
      },
    };
    return KeyResult.fromDTO(keyResultDTO);
  }

  /**
   * 数据库行转 GoalRecord 实体
   * @param row 数据库行
   * @returns GoalRecord 实体
   */
  private async mapRowToGoalRecord(row: any): Promise<GoalRecord> {
    const recordDTO = {
      uuid: row.uuid,
      goalUuid: row.goal_uuid,
      keyResultUuid: row.key_result_uuid,
      value: row.value,
      note: row.notes,
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
    };
    return GoalRecord.fromDTO(recordDTO);
  }

  /**
   * 数据库行转 GoalReview 实体
   * @param row 数据库行
   * @returns GoalReview 实体
   */
  private async mapRowToGoalReview(row: any): Promise<GoalReview> {
    const reviewDTO = {
      uuid: row.uuid,
      goalUuid: row.goal_uuid,
      title: row.title,
      type: row.review_type,
      reviewDate: new Date(row.review_date),
      content: {
        achievements: row.achievements,
        challenges: row.challenges,
        learnings: row.learnings,
        nextSteps: row.next_steps,
        adjustments: row.adjustment_recommendations || '',
      },
      snapshot: JSON.parse(row.snapshot),
      metadata: JSON.parse(row.metadata || '{}'),
      rating: {
        progressSatisfaction: row.progress_rating,
        executionEfficiency: row.executive_rating,
        goalReasonableness: row.goalReasonableness_rating,
      },
      lifecycle: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
    };
    return GoalReview.fromDTO(reviewDTO);
  }
}
