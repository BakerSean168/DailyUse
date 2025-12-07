/**
 * Pagination Utilities
 *
 * 通用分页工具，用于 IPC Handler 和 Repository
 */

// ============ Types ============

export interface PaginationParams {
  /** 页码 (1-based) */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  /** 数据列表 */
  data: T[];
  /** 分页信息 */
  pagination: {
    /** 当前页码 */
    page: number;
    /** 每页数量 */
    pageSize: number;
    /** 总数量 */
    total: number;
    /** 总页数 */
    totalPages: number;
    /** 是否有下一页 */
    hasNext: boolean;
    /** 是否有上一页 */
    hasPrev: boolean;
  };
}

// ============ Constants ============

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============ Functions ============

/**
 * 规范化分页参数
 */
export function normalizePaginationParams(params?: PaginationParams): Required<PaginationParams> {
  const page = Math.max(1, params?.page ?? DEFAULT_PAGE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE));
  const sortBy = params?.sortBy ?? 'createdAt';
  const sortOrder = params?.sortOrder ?? 'desc';

  return { page, pageSize, sortBy, sortOrder };
}

/**
 * 计算分页偏移量
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * 创建分页结果
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  params: Required<PaginationParams>
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.pageSize);

  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * 在内存中对数组进行分页
 * 用于已获取全部数据后的客户端分页
 */
export function paginateArray<T>(
  items: T[],
  params?: PaginationParams
): PaginatedResult<T> {
  const normalized = normalizePaginationParams(params);
  const offset = calculateOffset(normalized.page, normalized.pageSize);
  const data = items.slice(offset, offset + normalized.pageSize);

  return createPaginatedResult(data, items.length, normalized);
}

/**
 * 无限滚动加载的游标分页参数
 */
export interface CursorPaginationParams {
  /** 游标 (上次最后一条记录的标识) */
  cursor?: string;
  /** 每次加载数量 */
  limit?: number;
  /** 加载方向 */
  direction?: 'forward' | 'backward';
}

export interface CursorPaginatedResult<T> {
  /** 数据列表 */
  data: T[];
  /** 下一页游标 (null 表示没有更多数据) */
  nextCursor: string | null;
  /** 上一页游标 */
  prevCursor: string | null;
  /** 是否有更多数据 */
  hasMore: boolean;
}

/**
 * 规范化游标分页参数
 */
export function normalizeCursorParams(params?: CursorPaginationParams): Required<CursorPaginationParams> {
  return {
    cursor: params?.cursor ?? '',
    limit: Math.min(MAX_PAGE_SIZE, Math.max(1, params?.limit ?? DEFAULT_PAGE_SIZE)),
    direction: params?.direction ?? 'forward',
  };
}
