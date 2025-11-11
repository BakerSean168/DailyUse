# Story 11.5: 标签统计与过滤 - 实施计划

**Story Points:** 5
**预计时间:** 1-2 天
**优先级:** P1 - Epic 11 最后一个故事

---

## 📋 验收标准 (Acceptance Criteria)

### AC #1: Tag 统计 API ✅
- [x] `GET /api/tags/statistics/:repositoryUuid`
- [x] 返回格式：`[{tag, count, resources: [{uuid, title, path}]}]`
- [x] 按使用频率降序排序
- [x] 响应时间 <500ms

### AC #2: TagsPanel UI ✅
- [x] 显示标签云（chip 形式）
- [x] 每个 tag 显示使用次数 badge
- [x] 点击 tag 过滤显示相关笔记
- [x] 支持搜索标签（filter input）

### AC #3: Tag 过滤功能 ✅
- [x] 点击标签触发过滤
- [x] 右侧显示笔记列表（标题 + 路径 + 更新时间）
- [x] 点击笔记打开编辑器

### AC #4: Tag 高亮显示 ✅
- [x] 文件树中笔记名称右侧显示 tag 数量 badge
- [x] Badge 颜色：primary，大小：x-small

---

## 🎯 实施策略

### Phase 1: Backend - Tag 统计 API (2-3 hours)

#### 1.1 创建 TagsApplicationService
**文件:** `apps/api/src/modules/repository/application/services/TagsApplicationService.ts`

```typescript
export class TagsApplicationService {
  async getTagStatistics(repositoryUuid: string): Promise<TagStatisticsDto[]> {
    // 1. 加载仓储所有资源（仅 MARKDOWN 类型）
    // 2. 解析每个资源的 YAML frontmatter
    // 3. 聚合 tag 统计
    // 4. 返回排序结果
  }
}
```

**关键逻辑:**
- YAML frontmatter 解析（复用 Story 11.6 的解析器）
- 聚合算法：`Map<tag, {count, resources[]}>`
- 排序：按 count 降序

#### 1.2 创建 Tag API 路由
**文件:** `apps/api/src/modules/repository/infrastructure/http/TagsController.ts`

```typescript
@Controller('/tags')
export class TagsController {
  @Get('/statistics/:repositoryUuid')
  async getStatistics(@Param('repositoryUuid') uuid: string) {
    // 调用 TagsApplicationService
  }
}
```

#### 1.3 创建 Tag 合约类型
**文件:** `packages/contracts/src/repository/TagsContracts.ts`

```typescript
export interface TagStatisticsDto {
  tag: string;
  count: number;
  resources: TagResourceReferenceDto[];
}

export interface TagResourceReferenceDto {
  uuid: string;
  title: string;
  path: string;
  updatedAt: string;
}
```

---

### Phase 2: Frontend - TagsPanel 组件 (2-3 hours)

#### 2.1 创建 TagsStore
**文件:** `apps/web/src/modules/repository/presentation/stores/tagsStore.ts`

```typescript
export const useTagsStore = defineStore('tags', () => {
  const statistics = ref<TagStatistics[]>([]);
  const selectedTag = ref<string | null>(null);
  const filteredResources = ref<TagResourceReference[]>([]);

  async function loadStatistics(repositoryUuid: string) {
    // 调用 API
  }

  function selectTag(tag: string) {
    // 过滤资源
  }

  return { statistics, selectedTag, filteredResources, loadStatistics, selectTag };
});
```

#### 2.2 创建 TagsPanel 组件
**文件:** `apps/web/src/modules/repository/presentation/components/TagsPanel.vue`

**UI 结构:**
```vue
<template>
  <div class="tags-panel">
    <!-- 搜索框 -->
    <v-text-field
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      placeholder="搜索标签..."
      clearable
    />

    <!-- 标签云 -->
    <div class="tags-cloud">
      <v-chip
        v-for="stat in filteredStatistics"
        :key="stat.tag"
        :variant="selectedTag === stat.tag ? 'flat' : 'tonal'"
        :color="selectedTag === stat.tag ? 'primary' : 'default'"
        @click="handleSelectTag(stat.tag)"
      >
        {{ stat.tag }}
        <v-badge :content="stat.count" inline color="primary" />
      </v-chip>
    </div>

    <!-- 标签过滤结果 -->
    <div v-if="selectedTag" class="tag-resources">
      <v-list>
        <v-list-item
          v-for="resource in filteredResources"
          :key="resource.uuid"
          @click="handleOpenResource(resource)"
        >
          <template #prepend>
            <v-icon icon="mdi-file-document-outline" />
          </template>
          <v-list-item-title>{{ resource.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ resource.path }}</v-list-item-subtitle>
          <template #append>
            <span class="text-caption">{{ formatDate(resource.updatedAt) }}</span>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>
```

#### 2.3 集成到 RepositoryView
**文件:** `apps/web/src/modules/repository/presentation/views/RepositoryView.vue`

- TagsPanel 已在模板中占位（`v-show="activeTab === 'tags'"`)
- 需要传递 `repository-uuid` prop
- 需要实现 `@select` 事件处理

---

### Phase 3: FilesPanel Tag Badge (1 hour)

#### 3.1 修改 FilesPanel 组件
**文件:** `apps/web/src/modules/repository/presentation/components/FilesPanel.vue`

**变更点:**
1. 加载资源时解析 tag 数量
2. 在资源名称右侧显示 badge

```vue
<template #append>
  <!-- 现有的菜单按钮 -->
  <v-menu>...</v-menu>

  <!-- 新增 Tag Badge -->
  <v-badge
    v-if="resource.tagCount > 0"
    :content="resource.tagCount"
    color="primary"
    inline
    size="x-small"
  />
</template>
```

---

## 🔧 技术实现细节

### YAML Frontmatter 解析（复用 Story 11.6）

```typescript
// 提取 YAML frontmatter
function extractFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const parsed = parseSimpleYaml(yaml);
  return parsed;
}

// 提取 tags 字段
function extractTags(frontmatter: Record<string, any>): string[] {
  const tags = frontmatter.tags;
  
  if (typeof tags === 'string') {
    // tags: ddd
    return [tags];
  } else if (Array.isArray(tags)) {
    // tags: [ddd, architecture]
    return tags.map(String);
  }
  
  return [];
}
```

### Tag 聚合算法

```typescript
type TagStatistic = {
  tag: string;
  count: number;
  resources: TagResourceReference[];
};

function aggregateTags(resources: Resource[]): TagStatistic[] {
  const tagMap = new Map<string, TagStatistic>();

  for (const resource of resources) {
    const tags = extractTags(resource.content);
    
    for (const tag of tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { tag, count: 0, resources: [] });
      }
      
      const stat = tagMap.get(tag)!;
      stat.count++;
      stat.resources.push({
        uuid: resource.uuid,
        title: resource.title,
        path: resource.path,
        updatedAt: resource.updatedAt,
      });
    }
  }

  // 按 count 降序排序
  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
}
```

---

## 📊 工作量估算

| Phase | 任务 | 预估时间 |
|-------|------|----------|
| Phase 1 | Backend Tag 统计 API | 2-3h |
| Phase 2 | Frontend TagsPanel 组件 | 2-3h |
| Phase 3 | FilesPanel Tag Badge | 1h |
| Phase 4 | 测试与调试 | 1h |
| **总计** | | **6-10h** |

**保守估算:** 8 小时（1 工作日）

---

## ✅ 验证清单

### 功能测试
- [ ] Tag 统计 API 返回正确数据
- [ ] TagsPanel 显示所有 tags
- [ ] Tag chip 显示正确的 count badge
- [ ] 搜索标签过滤功能正常
- [ ] 点击 tag 显示过滤后的笔记列表
- [ ] 点击笔记打开编辑器
- [ ] FilesPanel 显示 tag count badge

### 边界情况
- [ ] 无 tags 的笔记
- [ ] 无 frontmatter 的笔记
- [ ] 空仓储（无笔记）
- [ ] 超长 tag 名称
- [ ] 特殊字符 tag
- [ ] 大量 tags（100+）

### 性能测试
- [ ] 小型仓储（<100 文件）: <200ms
- [ ] 中型仓储（<500 文件）: <400ms
- [ ] 大型仓储（<1000 文件）: <500ms

---

## 🎯 成功标准

1. ✅ 所有 4 个 AC 完成
2. ✅ API 响应时间 <500ms
3. ✅ UI 交互流畅无卡顿
4. ✅ Tag 统计准确无误
5. ✅ Epic 11 100% 完成（36/36 SP）

---

**预计完成时间:** 2025-01-11 晚上
**Epic 11 里程碑:** 🎉 最后一个故事！

---

🚀 准备开始实施！
