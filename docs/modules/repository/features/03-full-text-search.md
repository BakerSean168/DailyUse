# Feature Spec: 全文搜索

> **功能编号**: REPOSITORY-003  
> **RICE 评分**: 119 (Reach: 7, Impact: 5, Confidence: 6.8, Effort: 2)  
> **优先级**: P2  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 价值主张

**核心收益**:

- ✅ 秒级全文搜索
- ✅ 智能排序（相关度）
- ✅ 高亮匹配结果
- ✅ 搜索历史和建议

---

## 2. 核心场景

### 场景 1: 快速全文搜索

```
🔍 全文搜索
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[OKR 方法论...] 🔍

搜索结果 (42 个文档)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 OKR 实施指南 (95% 相关)
...掌握 **OKR** **方法论** 是提升团队效率的关键...
最后修改: 2 天前 | 作者: 张三
[打开]

📄 产品规划文档 (87% 相关)
...参考 **OKR** **方法论** 制定季度目标...
最后修改: 1 周前 | 作者: 李四
[打开]

[显示更多...]
```

---

### 场景 2: 高级搜索

```
🔍 高级搜索
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

关键词: [OKR]

文件类型:
☑️ 文档  ☑️ 笔记  ☐ 任务

作者: [全部 ▼]

修改时间:
⚪ 任何时间
⚪ 最近 7 天
🔘 最近 30 天
⚪ 自定义范围

标签: [选择标签...]

[搜索]  [清空]
```

---

## 3. 技术要点

```typescript
// 使用 Elasticsearch 或 MeiliSearch
interface SearchService {
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const results = await this.searchEngine.search({
      query,
      fields: ['title^3', 'content', 'tags^2'],  // 权重
      filters: options?.filters,
      highlight: {
        fields: ['content'],
        pre_tag: '<mark>',
        post_tag: '</mark>'
      },
      page: options?.page || 1,
      perPage: 20
    });

    return results.map(hit => ({
      documentUuid: hit.uuid,
      title: hit.title,
      snippet: hit.highlight?.content?.[0] || hit.content.slice(0, 200),
      score: hit.score,
      matchedAt: hit.matchedFields
    }));
  }
}
```

---

## 4. MVP 范围

- ✅ 全文搜索（标题+内容）
- ✅ 搜索结果高亮
- ✅ 相关度排序
- ✅ 搜索历史

---

**文档状态**: ✅ Ready
