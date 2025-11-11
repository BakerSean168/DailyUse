# Story 11.6: Advanced Search (高级搜索功能) - 实施计划

**Story Points:** 5  
**预计时间:** 1-2 天  
**优先级:** P2  
**依赖:** Story 11.2 (基础搜索功能)

---

## 📋 Story 概览

### 用户故事
作为高级用户，我希望使用更精准的搜索功能（line/section/property），这样我可以在复杂的知识库中快速定位特定信息。

### 验收标准

**AC #1**: line: 同行关键词搜索 ✅
- 输入多个关键词（空格分隔）
- 返回所有关键词都在同一行的匹配项
- 示例：`line:(obsidian plugin)` 匹配包含这两个词的行

**AC #2**: section: 同标题下搜索 ✅
- 返回在同一 Markdown 标题下的匹配项
- 结果显示所在标题名称

**AC #3**: [property]: YAML 属性搜索 ✅
- 格式：`[author]:sean`
- 搜索 YAML frontmatter 中的属性
- 支持任意自定义属性

**AC #4**: 搜索性能优化 ✅
- 1000+ 笔记响应时间 <1s
- 搜索结果分页（每页 50 条）
- 考虑引入全文索引

---

## 🎯 实施策略

### 当前状态分析

**已有功能（Story 11.2）:**
- ✅ 基础全文搜索（file/tag/content）
- ✅ 搜索模式切换（4 个模式）
- ✅ 搜索结果高亮
- ✅ SearchPanel 组件完整

**需要增强:**
- ⏳ line: 同行多关键词搜索
- ⏳ section: Markdown 标题下搜索
- ⏳ [property]: YAML frontmatter 搜索
- ⏳ 性能优化（分页、缓存）

### 技术方案

#### 1. line: 同行搜索
```typescript
// 算法：正则表达式 + 行内匹配
function searchInLine(content: string, keywords: string[]): LineMatch[] {
  const lines = content.split('\n');
  const results: LineMatch[] = [];
  
  lines.forEach((line, lineNumber) => {
    // 检查所有关键词是否都在这一行
    const allMatch = keywords.every(keyword => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (allMatch) {
      results.push({
        lineNumber: lineNumber + 1,
        content: line,
        matchedKeywords: keywords
      });
    }
  });
  
  return results;
}
```

#### 2. section: 标题下搜索
```typescript
// 算法：Markdown 标题追踪
function searchInSection(content: string, keyword: string): SectionMatch[] {
  const lines = content.split('\n');
  const results: SectionMatch[] = [];
  let currentSection = { title: 'Root', level: 0, startLine: 0 };
  
  lines.forEach((line, index) => {
    // 检测 Markdown 标题
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      currentSection = {
        title: headerMatch[2],
        level: headerMatch[1].length,
        startLine: index + 1
      };
    }
    
    // 检查关键词
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      results.push({
        section: currentSection.title,
        lineNumber: index + 1,
        content: line
      });
    }
  });
  
  return results;
}
```

#### 3. [property]: YAML 搜索
```typescript
// 使用 yaml 库解析 frontmatter
import yaml from 'yaml';

function searchByProperty(content: string, property: string, value: string): boolean {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return false;
  
  try {
    const frontmatter = yaml.parse(frontmatterMatch[1]);
    const propertyValue = frontmatter[property];
    
    // 支持精确匹配或部分匹配
    if (typeof propertyValue === 'string') {
      return propertyValue.toLowerCase().includes(value.toLowerCase());
    } else if (Array.isArray(propertyValue)) {
      return propertyValue.some(v => 
        v.toLowerCase().includes(value.toLowerCase())
      );
    }
    
    return false;
  } catch (error) {
    return false;
  }
}
```

#### 4. 性能优化
- **分页**: 虚拟滚动（每页 50 条）
- **缓存**: 搜索结果缓存（LRU）
- **索引**: 考虑 Lunr.js 或 MeiliSearch（Phase 2）
- **Web Worker**: 大文件搜索异步处理

---

## 📦 实施阶段

### Phase 1: SearchPanel 增强 (1h)
**目标**: 添加 3 种新搜索模式

**文件修改:**
1. `apps/web/src/modules/repository/presentation/components/SearchPanel.vue`
   - 添加 `line` / `section` / `property` 模式到 mode chips
   - 更新 UI 文案和提示
   - 添加搜索语法帮助文本

**变更内容:**
```vue
// 添加新搜索模式
const searchModes = [
  { value: 'file', label: '文件名', icon: 'mdi-file-document-outline' },
  { value: 'tag', label: '标签', icon: 'mdi-tag-outline' },
  { value: 'content', label: '内容', icon: 'mdi-text-search' },
  { value: 'line', label: '同行', icon: 'mdi-format-line-spacing' }, // 新增
  { value: 'section', label: '章节', icon: 'mdi-format-header-1' }, // 新增
  { value: 'property', label: '属性', icon: 'mdi-code-brackets' }  // 新增
];

// 添加搜索提示
const searchHelp = computed(() => {
  switch (selectedMode.value) {
    case 'line':
      return '输入多个关键词（空格分隔），匹配同一行包含所有关键词的内容';
    case 'section':
      return '搜索同一 Markdown 标题下的内容';
    case 'property':
      return '格式：[属性名]:值，例如 [author]:sean';
    default:
      return '';
  }
});
```

### Phase 2: 搜索算法实现 (2h)
**目标**: 实现 3 种搜索算法

**文件修改:**
1. `packages/domain-client/src/repository/search/SearchService.ts` (新建)
   - `searchInLine(content, keywords)` - 同行搜索
   - `searchInSection(content, keyword)` - 章节搜索
   - `searchByProperty(content, property, value)` - 属性搜索
   - `parseSearchQuery(query, mode)` - 查询解析器

**核心逻辑:**
```typescript
export class AdvancedSearchService {
  // AC#1: 同行搜索
  static searchInLine(content: string, keywords: string[]): LineMatch[] {
    const lines = content.split('\n');
    return lines
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter(({ line }) => 
        keywords.every(kw => line.toLowerCase().includes(kw.toLowerCase()))
      )
      .map(({ line, lineNumber }) => ({
        lineNumber,
        content: line.trim(),
        matchedKeywords: keywords
      }));
  }

  // AC#2: 章节搜索
  static searchInSection(content: string, keyword: string): SectionMatch[] {
    const lines = content.split('\n');
    const results: SectionMatch[] = [];
    let currentSection = { title: 'Document Root', level: 0 };

    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        currentSection = {
          title: headerMatch[2].trim(),
          level: headerMatch[1].length
        };
      }

      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({
          section: currentSection.title,
          lineNumber: index + 1,
          content: line.trim(),
          sectionLevel: currentSection.level
        });
      }
    });

    return results;
  }

  // AC#3: YAML 属性搜索
  static searchByProperty(
    content: string,
    property: string,
    value: string
  ): PropertyMatch | null {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    try {
      const frontmatter = yaml.parse(frontmatterMatch[1]);
      const propValue = frontmatter[property];

      if (typeof propValue === 'string') {
        if (propValue.toLowerCase().includes(value.toLowerCase())) {
          return { property, value: propValue, matched: true };
        }
      } else if (Array.isArray(propValue)) {
        const matched = propValue.some(v =>
          String(v).toLowerCase().includes(value.toLowerCase())
        );
        if (matched) {
          return { property, value: propValue, matched: true };
        }
      }

      return null;
    } catch (error) {
      console.error('YAML parsing error:', error);
      return null;
    }
  }
}
```

### Phase 3: API 集成 (1.5h)
**目标**: 后端支持高级搜索

**文件修改:**
1. `apps/api/src/modules/repository/application/ResourceSearchService.ts`
   - 添加 `searchByLine(repositoryUuid, keywords)` 方法
   - 添加 `searchBySection(repositoryUuid, keyword)` 方法
   - 添加 `searchByProperty(repositoryUuid, property, value)` 方法
   - 集成前端 AdvancedSearchService

2. `apps/api/src/modules/repository/presentation/ResourceController.ts`
   - 添加 `/api/repository/:uuid/search/advanced` 端点
   - 支持 `mode` 参数：line/section/property
   - 返回结构化搜索结果

**API 设计:**
```typescript
// GET /api/repository/:uuid/search/advanced
interface AdvancedSearchRequest {
  mode: 'line' | 'section' | 'property';
  query: string;
  page?: number;
  limit?: number;
}

interface AdvancedSearchResponse {
  results: Array<{
    resourceUuid: string;
    resourceName: string;
    matches: LineMatch[] | SectionMatch[] | PropertyMatch[];
    totalMatches: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

### Phase 4: 性能优化 (1h)
**目标**: AC#4 - 响应时间 <1s

**优化策略:**
1. **分页加载**
   - 每页 50 条结果
   - 虚拟滚动（vue-virtual-scroller）
   - 懒加载匹配内容

2. **搜索缓存**
   - LRU 缓存最近 20 次搜索结果
   - 缓存 key: `${mode}-${query}-${repositoryUuid}`
   - TTL: 5 分钟

3. **并发优化**
   - Web Worker 异步搜索（>100 文件时启用）
   - Promise.all 并行处理多个文件
   - 限制并发数（p-limit: 5）

4. **索引优化（可选）**
   - 考虑引入 Lunr.js（前端全文索引）
   - 或 MeiliSearch（独立搜索服务）
   - 预索引文件内容，加速搜索

**性能基准:**
```typescript
// 测试数据
const benchmarks = {
  smallRepo: { files: 50, target: '<200ms' },
  mediumRepo: { files: 500, target: '<500ms' },
  largeRepo: { files: 1000, target: '<1000ms' }
};
```

### Phase 5: UI/UX 增强 (1h)
**目标**: 优化搜索体验

**增强功能:**
1. **搜索语法提示**
   - Tooltip 显示搜索语法
   - 示例：`line:(vue component)` / `section:配置` / `[author]:sean`

2. **结果分组显示**
   - line: 按文件名分组，显示行号
   - section: 按章节名称分组
   - property: 按属性值分组

3. **高亮优化**
   - line: 高亮匹配的关键词
   - section: 显示章节面包屑
   - property: 显示 YAML frontmatter

4. **搜索历史**
   - 保存最近 20 次搜索（包含模式）
   - 快速重复搜索
   - 清空历史按钮

**UI 示例:**
```vue
<!-- line 搜索结果 -->
<div class="line-result">
  <div class="file-name">README.md</div>
  <div class="match-line">
    <span class="line-number">42</span>
    <span class="content">
      使用 <mark>vue</mark> 和 <mark>component</mark> 构建界面
    </span>
  </div>
</div>

<!-- section 搜索结果 -->
<div class="section-result">
  <div class="breadcrumb">配置 > 环境变量</div>
  <div class="match-content">
    <mark>DATABASE_URL</mark> 配置说明...
  </div>
</div>

<!-- property 搜索结果 -->
<div class="property-result">
  <div class="property-badge">[author]: sean</div>
  <div class="resource-name">DDD 设计笔记.md</div>
  <div class="frontmatter">
    ---
    author: sean
    tags: [ddd, architecture]
    ---
  </div>
</div>
```

### Phase 6: 测试与文档 (30min)
**目标**: 验证功能正确性

**测试清单:**
- [ ] **line 搜索**: 2+ 关键词同行匹配
- [ ] **section 搜索**: Markdown 标题下匹配
- [ ] **property 搜索**: YAML frontmatter 匹配
- [ ] **性能测试**: 1000 文件 <1s
- [ ] **分页**: 每页 50 条正常加载
- [ ] **边界情况**: 空结果、特殊字符、超长文本

**文档更新:**
- 更新 `STORY_11-2_SEARCH_COMPLETE.md`（添加高级搜索部分）
- 创建 `STORY_11-6_ADVANCED_SEARCH_COMPLETE.md`

---

## 📊 工作量估算

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| Phase 1 | SearchPanel 增强 | 1h |
| Phase 2 | 搜索算法实现 | 2h |
| Phase 3 | API 集成 | 1.5h |
| Phase 4 | 性能优化 | 1h |
| Phase 5 | UI/UX 增强 | 1h |
| Phase 6 | 测试与文档 | 30min |
| **总计** | | **7 小时** |

**实际目标**: 6-7 小时（1-2 天）

---

## 🎯 成功指标

### 功能性
- ✅ 3 种高级搜索模式全部实现
- ✅ 搜索结果准确匹配 AC 描述
- ✅ UI/UX 符合 Obsidian 风格

### 性能
- ✅ 小型仓储（<100 文件）: <200ms
- ✅ 中型仓储（<500 文件）: <500ms
- ✅ 大型仓储（<1000 文件）: <1s

### 可用性
- ✅ 搜索语法清晰易懂
- ✅ 搜索结果分组合理
- ✅ 错误提示友好

---

## 🚀 后续优化（Phase 2）

### 可选增强
1. **全文索引引擎**
   - Lunr.js（前端轻量级索引）
   - MeiliSearch（独立搜索服务，性能更强）
   - 索引构建时间: <10s（1000 文件）

2. **搜索语法扩展**
   - 布尔运算符：`AND` / `OR` / `NOT`
   - 正则表达式：`/pattern/`
   - 通配符：`*.md` / `test?`

3. **搜索历史智能化**
   - 搜索频率统计
   - 热门搜索推荐
   - 搜索纠错建议

4. **导出搜索结果**
   - CSV 格式导出
   - Markdown 汇总导出
   - 批量操作支持

---

**创建时间:** 2025-01-11  
**预计完成:** 2025-01-11 (当天完成)  
**负责人:** Amelia + Winston

---

🎯 **开始实施 Story 11.6！让知识库搜索更加强大！** 🚀
