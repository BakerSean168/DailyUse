# 📚 Story 7-1 Quick Start Guide
## 知识仓库 - 快速启动指南

**最后更新**: 2025-10-31

---

## ⚡ 5 分钟快速启动

### 1️⃣ 启动后端服务 (Terminal 1)

```bash
cd /workspaces/DailyUse

# 确保数据库 schema 已更新
npx prisma generate
npx prisma migrate dev

# 启动 API 服务
npm run dev:api
# 或使用 nx
nx run api:serve
```

**预期输出**:
```
✓ Nest application successfully started
✓ Listening on http://localhost:3000
✓ Document module initialized
```

### 2️⃣ 启动前端服务 (Terminal 2)

```bash
cd /workspaces/DailyUse

# 启动 Web 应用
npm run dev:web
# 或使用 nx
nx run web:serve
```

**预期输出**:
```
✓ Vite dev server running
✓ Local: http://localhost:5173
✓ Network: http://192.168.x.x:5173
```

### 3️⃣ 访问知识仓库

1. 打开浏览器访问: `http://localhost:5173`
2. 登录账户 (如果未登录)
3. 在左侧导航栏找到 **"知识仓库"** (图标: 📖)
4. 点击进入

---

## 🧪 测试 CRUD 功能

### 创建文档

1. 点击页面右上角 **"新建文档"** 按钮
2. 填写表单:
   ```
   标题: 我的第一篇文档
   文件夹路径: /personal
   内容: # Hello World
   
   这是我的第一篇测试文档！
   标签: test, demo
   ```
3. 点击 **"保存"**
4. ✅ 查看文档卡片出现在列表中

### 查看文档

- 文档卡片显示:
  - 标题: "我的第一篇文档"
  - 摘要: "# Hello World 这是我的第一篇测试文档！"
  - 文件夹: "/personal"
  - 标签: "test", "demo"
  - 状态: "草稿" (DRAFT)

### 编辑文档

1. 点击文档卡片上的 **"编辑"** 按钮
2. 修改标题或内容
3. 点击 **"保存"**
4. ✅ 查看修改已生效

### 删除文档

1. 点击文档卡片上的 **"删除"** 按钮
2. 在确认对话框中点击 **"确认"**
3. ✅ 文档从列表中移除

---

## 🗂️ 文件夹管理

### 创建文件夹结构

知识仓库支持类似文件系统的层级结构:

```
/personal          # 个人笔记
/personal/notes    # 个人笔记子目录
/work              # 工作文档
/work/projects     # 项目文档
/archive           # 归档文档
```

**示例**: 创建多个文档测试文件夹筛选

1. 创建文档 A: 路径 `/personal`
2. 创建文档 B: 路径 `/work`
3. 创建文档 C: 路径 `/personal/notes`
4. 使用顶部文件夹筛选器查看不同文件夹的文档

---

## 🏷️ 标签管理

### 标签用法

- 输入标签时按 **Enter** 或 **Tab** 添加
- 标签支持多选 (数组形式)
- 标签显示为彩色 Chip
- 可用于分类和过滤 (未来版本)

**示例标签**:
- `meeting`, `note`, `todo`
- `project-a`, `project-b`
- `important`, `urgent`
- `draft`, `review`, `published`

---

## 📝 Markdown 编辑

### 支持的 Markdown 语法

知识仓库内容支持完整 Markdown 语法:

```markdown
# 标题 1
## 标题 2
### 标题 3

**粗体** *斜体* ~~删除线~~

- 列表项 1
- 列表项 2

1. 有序列表 1
2. 有序列表 2

[链接](https://example.com)

`代码`

\`\`\`javascript
console.log('Hello World');
\`\`\`
```

**注意**: 当前版本仅支持编辑模式，预览模式将在 Epic 8 (Editor Module) 实现。

---

## 🔍 API 端点测试

### 使用 curl 测试 API

**1. 创建文档**:
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Document",
    "content": "# Test\nThis is a test",
    "folderPath": "/test",
    "tags": ["test"]
  }'
```

**2. 获取文档列表**:
```bash
curl http://localhost:3000/api/documents?page=1&pageSize=20 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**3. 获取单个文档**:
```bash
curl http://localhost:3000/api/documents/{uuid} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**4. 更新文档**:
```bash
curl -X PUT http://localhost:3000/api/documents/{uuid} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Updated Title"
  }'
```

**5. 删除文档** (软删除):
```bash
curl -X DELETE http://localhost:3000/api/documents/{uuid} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 常见问题

### ❌ 问题: "Cannot find module '@/modules/document/views/RepositoryPage.vue'"

**原因**: 前端服务未正确加载模块

**解决方案**:
```bash
# 重启前端服务
# Ctrl+C 停止服务
npm run dev:web
```

### ❌ 问题: "Network Error" 或 API 调用失败

**原因**: 后端服务未启动或 CORS 配置问题

**解决方案**:
```bash
# 1. 确保后端服务在运行
lsof -i :3000

# 2. 如果未运行，启动后端
npm run dev:api

# 3. 检查 CORS 配置 (apps/api/src/main.ts)
```

### ❌ 问题: "Unauthorized" (401/403)

**原因**: JWT Token 无效或过期

**解决方案**:
1. 退出登录
2. 重新登录获取新 Token
3. 检查 localStorage 中的 `accessToken`
4. 验证 Token 有效期

### ❌ 问题: 文档列表为空但数据库有数据

**原因**: 数据隔离 - 只显示当前用户的文档

**验证**:
```sql
-- 连接数据库查看文档
SELECT uuid, title, "account_uuid" 
FROM documents 
WHERE deleted_at IS NULL;

-- 确认 account_uuid 与当前登录用户一致
```

---

## 📊 数据库检查

### 查看文档表

```bash
# 进入数据库客户端
npx prisma studio

# 或使用 SQL
psql -U postgres -d dailyuse
```

**SQL 查询**:
```sql
-- 查看所有文档
SELECT * FROM documents WHERE deleted_at IS NULL;

-- 按用户查看
SELECT * FROM documents WHERE account_uuid = 'USER_UUID';

-- 按文件夹查看
SELECT * FROM documents WHERE folder_path = '/personal';

-- 统计文档数量
SELECT COUNT(*) FROM documents WHERE deleted_at IS NULL;
```

---

## ✅ 验证清单

完成以下检查确保集成成功:

- [ ] 后端服务启动成功 (http://localhost:3000)
- [ ] 前端服务启动成功 (http://localhost:5173)
- [ ] 导航菜单显示 "知识仓库" 链接
- [ ] 点击链接跳转到 `/repository` 路由
- [ ] 页面加载 `RepositoryPage` 组件
- [ ] 能够创建新文档
- [ ] 文档列表显示创建的文档
- [ ] 能够编辑已有文档
- [ ] 能够删除文档
- [ ] 表单验证正常工作
- [ ] Toast 通知显示成功/错误消息
- [ ] 分页功能正常 (如果有 >20 条文档)
- [ ] 文件夹筛选正常工作

---

## 🚀 下一步

### 立即行动
1. ✅ 完成上述快速启动
2. ✅ 测试所有 CRUD 操作
3. ✅ 创建至少 5 个测试文档
4. ✅ 测试不同文件夹路径
5. ✅ 测试标签功能

### 未来增强 (Story 7-2+)
- [ ] Git 风格版本管理
- [ ] Diff 可视化
- [ ] 文档搜索功能
- [ ] Markdown 预览模式
- [ ] 富文本编辑器 (Monaco Editor)
- [ ] 文档导出 (PDF/HTML)

---

**🎉 祝您使用愉快！**

**问题反馈**: 请在项目 Issue 中提交

**文档更新**: 2025-10-31
