/**
 * Upload Statistics Service
 * 上传统计服务 - 跟踪上传性能和结果
 */

import { ref, computed, readonly } from 'vue';

/**
 * 单次上传记录
 */
export interface UploadRecord {
  id: string;
  filename: string;
  size: number;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  compressed?: boolean;
  originalSize?: number;
  compressionRatio?: number;
}

/**
 * 上传会话统计
 */
export interface UploadSessionStats {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalFiles: number;
  successCount: number;
  failCount: number;
  totalSize: number;
  totalDuration: number;
  averageSpeed: number; // bytes per second
  records: UploadRecord[];
}

/**
 * 全局上传统计
 */
export interface GlobalUploadStats {
  totalUploads: number;
  totalSuccess: number;
  totalFailed: number;
  totalBytes: number;
  totalDuration: number;
  averageSpeed: number;
  averageFileSize: number;
  successRate: number;
}

// 统计状态
const sessions = ref<UploadSessionStats[]>([]);
const currentSession = ref<UploadSessionStats | null>(null);
const maxSessions = 50; // 保留最近50个会话

/**
 * 创建新的上传会话
 */
export function createUploadSession(): string {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const session: UploadSessionStats = {
    sessionId,
    startTime: Date.now(),
    totalFiles: 0,
    successCount: 0,
    failCount: 0,
    totalSize: 0,
    totalDuration: 0,
    averageSpeed: 0,
    records: [],
  };
  
  currentSession.value = session;
  
  console.log(`📊 [UploadStats] 创建上传会话: ${sessionId}`);
  
  return sessionId;
}

/**
 * 记录上传开始
 */
export function recordUploadStart(
  filename: string,
  size: number,
  type: string,
  originalSize?: number
): string {
  const recordId = `record_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  if (!currentSession.value) {
    createUploadSession();
  }
  
  const record: UploadRecord = {
    id: recordId,
    filename,
    size,
    type,
    startTime: Date.now(),
    success: false,
    originalSize,
  };
  
  currentSession.value!.records.push(record);
  currentSession.value!.totalFiles++;
  
  console.log(`📤 [UploadStats] 开始上传: ${filename} (${formatSize(size)})`);
  
  return recordId;
}

/**
 * 记录上传成功
 */
export function recordUploadSuccess(recordId: string, compressedSize?: number): void {
  if (!currentSession.value) return;
  
  const record = currentSession.value.records.find(r => r.id === recordId);
  if (!record) return;
  
  record.endTime = Date.now();
  record.duration = record.endTime - record.startTime;
  record.success = true;
  
  if (compressedSize !== undefined && record.originalSize) {
    record.compressed = true;
    record.compressionRatio = compressedSize / record.originalSize;
    record.size = compressedSize;
  }
  
  currentSession.value.successCount++;
  currentSession.value.totalSize += record.size;
  currentSession.value.totalDuration += record.duration;
  
  const speed = record.duration > 0 ? (record.size / record.duration) * 1000 : 0;
  
  console.log(
    `✅ [UploadStats] 上传成功: ${record.filename}`,
    `| 耗时: ${record.duration}ms`,
    `| 速度: ${formatSize(speed)}/s`,
    record.compressed ? `| 压缩率: ${(record.compressionRatio! * 100).toFixed(1)}%` : ''
  );
}

/**
 * 记录上传失败
 */
export function recordUploadFailure(recordId: string, error: string): void {
  if (!currentSession.value) return;
  
  const record = currentSession.value.records.find(r => r.id === recordId);
  if (!record) return;
  
  record.endTime = Date.now();
  record.duration = record.endTime - record.startTime;
  record.success = false;
  record.error = error;
  
  currentSession.value.failCount++;
  
  console.error(`❌ [UploadStats] 上传失败: ${record.filename} | 错误: ${error}`);
}

/**
 * 结束当前上传会话
 */
export function endUploadSession(): UploadSessionStats | null {
  if (!currentSession.value) return null;
  
  const session = currentSession.value;
  session.endTime = Date.now();
  
  // 计算平均速度
  if (session.totalDuration > 0) {
    session.averageSpeed = (session.totalSize / session.totalDuration) * 1000;
  }
  
  // 保存会话
  sessions.value.unshift(session);
  
  // 限制保存的会话数量
  if (sessions.value.length > maxSessions) {
    sessions.value = sessions.value.slice(0, maxSessions);
  }
  
  console.log(
    `📊 [UploadStats] 会话结束: ${session.sessionId}`,
    `| 文件数: ${session.totalFiles}`,
    `| 成功: ${session.successCount}`,
    `| 失败: ${session.failCount}`,
    `| 总大小: ${formatSize(session.totalSize)}`,
    `| 平均速度: ${formatSize(session.averageSpeed)}/s`
  );
  
  currentSession.value = null;
  
  return session;
}

/**
 * 获取全局统计
 */
export function getGlobalStats(): GlobalUploadStats {
  const allRecords = sessions.value.flatMap(s => s.records);
  const successRecords = allRecords.filter(r => r.success);
  
  const totalUploads = allRecords.length;
  const totalSuccess = successRecords.length;
  const totalFailed = totalUploads - totalSuccess;
  const totalBytes = successRecords.reduce((sum, r) => sum + r.size, 0);
  const totalDuration = successRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  return {
    totalUploads,
    totalSuccess,
    totalFailed,
    totalBytes,
    totalDuration,
    averageSpeed: totalDuration > 0 ? (totalBytes / totalDuration) * 1000 : 0,
    averageFileSize: totalSuccess > 0 ? totalBytes / totalSuccess : 0,
    successRate: totalUploads > 0 ? (totalSuccess / totalUploads) * 100 : 0,
  };
}

/**
 * 获取最近的会话
 */
export function getRecentSessions(count = 10): UploadSessionStats[] {
  return sessions.value.slice(0, count);
}

/**
 * 获取当前会话
 */
export function getCurrentSession(): UploadSessionStats | null {
  return currentSession.value;
}

/**
 * 清除所有统计数据
 */
export function clearStats(): void {
  sessions.value = [];
  currentSession.value = null;
  console.log('📊 [UploadStats] 统计数据已清除');
}

/**
 * 格式化文件大小
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * 格式化时长
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

// 导出响应式状态
export const uploadSessions = readonly(sessions);
export const activeSession = readonly(currentSession);

// 计算属性
export const globalStats = computed(() => getGlobalStats());
