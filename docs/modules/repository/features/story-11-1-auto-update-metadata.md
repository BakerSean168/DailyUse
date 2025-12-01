# Story 11-1: 保存时自动更新元数据时间戳

## 概述
当用户编辑并保存笔记内容时，自动更新 YAML frontmatter 中的 `updated` 时间戳字段。

## 用户故事
作为一个笔记用户，我希望在保存笔记时自动更新元数据中的修改时间，以便我能追踪每篇笔记的最后编辑时间。

## 验收标准

### AC1: 自动更新 updated 字段
- [ ] 当用户编辑内容并触发保存时，自动更新 frontmatter 中的 `updated` 字段
- [ ] 时间格式使用 ISO 8601 格式 (如 `2025-12-01T21:30:00`)
- [ ] 如果 frontmatter 中没有 `updated` 字段，自动添加

### AC2: 不影响其他元数据
- [ ] 保存时不修改 `created`、`title`、`tags` 等其他字段
- [ ] 保持 frontmatter 的原有格式和顺序

### AC3: 仅在内容实际变化时更新
- [ ] 只有当内容实际发生变化时才更新时间戳
- [ ] 避免仅切换模式就触发更新

## 技术实现

### 修改文件
- `apps/web/src/modules/repository/presentation/components/ObsidianEditor.vue`

### 实现方案
```typescript
function updateFrontmatterTimestamp(content: string): string {
  const now = new Date().toISOString().slice(0, 19); // 去掉毫秒
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    // 如果没有 frontmatter，添加一个
    return `---\nupdated: ${now}\n---\n\n${content}`;
  }
  
  let frontmatter = match[1];
  if (frontmatter.includes('updated:')) {
    frontmatter = frontmatter.replace(/updated:.*/, `updated: ${now}`);
  } else {
    frontmatter += `\nupdated: ${now}`;
  }
  
  return content.replace(frontmatterRegex, `---\n${frontmatter}\n---`);
}
```

## 优先级
🔥 高 - 基础功能，改动小

## 预估工时
0.5 小时
