/**
 * Template Recommendation Service
 * 模板推荐服务 - 基于用户上下文推荐合适的目标模板
 */

import type { GoalTemplate } from '../../application/templates/GoalTemplates';
import {
  BUILT_IN_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByRole,
  getTemplatesByIndustry,
} from '../../application/templates/GoalTemplates';

/**
 * 推荐过滤条件
 */
export interface RecommendationFilters {
  /** 用户角色 */
  role?: string;
  /** 所属行业 */
  industry?: string;
  /** 目标类别 */
  category?: GoalTemplate['category'];
  /** 搜索关键词 */
  searchQuery?: string;
  /** 标签过滤 */
  tags?: string[];
}

/**
 * 推荐结果
 */
export interface RecommendationResult {
  /** 推荐的模板 */
  template: GoalTemplate;
  /** 匹配分数 (0-100) */
  score: number;
  /** 匹配原因 */
  reasons: string[];
}

/**
 * 模板推荐引擎
 */
class TemplateRecommendationService {
  /**
   * 获取所有模板
   */
  getAllTemplates(): GoalTemplate[] {
    return [...BUILT_IN_TEMPLATES];
  }

  /**
   * 根据过滤条件推荐模板
   */
  recommendTemplates(filters: RecommendationFilters = {}): RecommendationResult[] {
    let candidates = [...BUILT_IN_TEMPLATES];

    // 1. 应用类别过滤
    if (filters.category) {
      candidates = getTemplatesByCategory(filters.category);
    }

    // 2. 计算每个模板的匹配分数
    const results = candidates.map((template) => {
      const { score, reasons } = this.calculateMatchScore(template, filters);
      return { template, score, reasons };
    });

    // 3. 按分数排序
    results.sort((a, b) => b.score - a.score);

    // 4. 只返回分数 > 0 的结果
    return results.filter((r) => r.score > 0);
  }

  /**
   * 计算模板与过滤条件的匹配分数
   */
  private calculateMatchScore(
    template: GoalTemplate,
    filters: RecommendationFilters,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // 基础分数 (所有模板都有)
    score += 20;

    // 角色匹配 (+40分)
    if (filters.role) {
      const roleMatch = template.roles.some((r) =>
        r.toLowerCase().includes(filters.role!.toLowerCase()),
      );
      if (roleMatch) {
        score += 40;
        reasons.push(`适合 ${filters.role} 角色`);
      }
    }

    // 行业匹配 (+30分)
    if (filters.industry) {
      const industryMatch = template.industries.some(
        (i) =>
          i.toLowerCase().includes(filters.industry!.toLowerCase()) ||
          i === '通用' ||
          i === 'All Industries',
      );
      if (industryMatch) {
        score += 30;
        reasons.push(`适用于 ${filters.industry} 行业`);
      }
    }

    // 搜索关键词匹配 (+20分)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const titleMatch = template.title.toLowerCase().includes(query);
      const descMatch = template.description.toLowerCase().includes(query);
      const tagMatch = template.tags.some((tag) => tag.toLowerCase().includes(query));

      if (titleMatch || descMatch || tagMatch) {
        score += 20;
        reasons.push(`包含关键词: ${filters.searchQuery}`);
      }
    }

    // 标签匹配 (+10分 per tag)
    if (filters.tags && filters.tags.length > 0) {
      const matchedTags = template.tags.filter((tag) =>
        filters.tags!.some((filterTag) => tag.toLowerCase().includes(filterTag.toLowerCase())),
      );
      if (matchedTags.length > 0) {
        score += matchedTags.length * 10;
        reasons.push(`匹配标签: ${matchedTags.join(', ')}`);
      }
    }

    // 没有任何匹配原因时，给个默认理由
    if (reasons.length === 0 && score === 20) {
      reasons.push('通用模板');
    }

    return { score, reasons };
  }

  /**
   * 获取热门模板 (按类别统计使用频率)
   */
  getPopularTemplates(limit = 5): GoalTemplate[] {
    // TODO: 实际应该从数据库统计
    // 现在返回每个类别的第一个模板
    const popular: GoalTemplate[] = [];
    const categories: GoalTemplate['category'][] = [
      'product',
      'engineering',
      'sales',
      'marketing',
      'general',
    ];

    categories.forEach((category) => {
      const templates = getTemplatesByCategory(category);
      if (templates.length > 0) {
        popular.push(templates[0]);
      }
    });

    return popular.slice(0, limit);
  }

  /**
   * 智能推荐 - 基于用户历史目标分析
   */
  async getSmartRecommendations(userId?: string): Promise<RecommendationResult[]> {
    // TODO: 实现基于用户历史的智能推荐
    // 1. 分析用户过往创建的目标类别
    // 2. 识别用户常用的标签和关键词
    // 3. 推荐相似但尚未使用的模板

    // 现在返回热门模板作为默认推荐
    const popular = this.getPopularTemplates();
    return popular.map((template) => ({
      template,
      score: 80,
      reasons: ['热门模板', '高完成率'],
    }));
  }

  /**
   * 按类别分组模板
   */
  groupByCategory(): Record<GoalTemplate['category'], GoalTemplate[]> {
    return {
      product: getTemplatesByCategory('product'),
      engineering: getTemplatesByCategory('engineering'),
      sales: getTemplatesByCategory('sales'),
      marketing: getTemplatesByCategory('marketing'),
      general: getTemplatesByCategory('general'),
    };
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): GoalTemplate[] {
    if (!query || query.trim().length === 0) {
      return this.getAllTemplates();
    }

    const lowerQuery = query.toLowerCase();
    return BUILT_IN_TEMPLATES.filter(
      (template) =>
        template.title.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        template.roles.some((role) => role.toLowerCase().includes(lowerQuery)),
    );
  }
}

// 单例导出
export const templateRecommendationService = new TemplateRecommendationService();
export default templateRecommendationService;
