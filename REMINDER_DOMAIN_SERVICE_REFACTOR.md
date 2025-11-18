# Reminder Domain Service 重构要求

## 核心原则

- **Domain Service 应该是纯函数** - 无副作用，不依赖仓储层，输入对象→计算→输出结果
- **移除所有 Repository 依赖** - Domain Service 构造函数不应注入任何 repository
- **Application Service 负责编排** - 查询、持久化、事件发布都在应用层完成
- **Domain Service 按业务拆分** - 不同业务领域的计算逻辑分到不同文件
- **Application Service 按用例拆分** - 每个用例有明确的业务流程编排

## Domain Service 层设计

### ReminderTemplateBusinessService（纯计算服务）
- 计算 effectiveEnabled 状态（输入 template + group，输出 boolean）
- 验证模板分组分配的合法性（输入 template + group，输出验证结果）
- 计算模板优先级排序（纯业务逻辑）
- 不包含任何数据查询或持久化逻辑

### ReminderGroupBusinessService（纯计算服务）
- 验证分组名称唯一性规则（输入现有分组列表 + 新名称，输出验证结果）
- 计算分组统计数据（输入模板列表，输出统计对象）
- 计算分组删除影响范围（输入分组 + 模板列表，输出影响分析）
- 不包含任何数据查询或持久化逻辑

### ReminderCrossAggregateService（跨聚合业务逻辑）
- 处理分组控制模式变更对模板的影响计算
- 批量计算多个模板的 effectiveEnabled 状态
- 分组删除的级联规则验证
- 纯计算，不涉及数据访问

## Application Service 层设计

### ReminderTemplateApplicationService
- **用例导向** - 每个方法对应一个明确的用例
- **编排模式** - 查询 → 验证 → 领域操作 → 计算 → 持久化 → 事件发布
- **典型用例**：
  - `createTemplate()` - 创建模板用例
  - `moveTemplateToGroup()` - 移动到分组用例
  - `toggleTemplateStatus()` - 切换启用状态用例
  - `deleteTemplate()` - 删除模板用例

### ReminderGroupApplicationService
- **用例导向** - 分组相关的所有用例
- **编排模式** - 同上
- **典型用例**：
  - `createGroup()` - 创建分组用例
  - `updateGroupControlMode()` - 更新控制模式用例（需要批量更新模板）
  - `toggleGroup()` - 切换分组启用状态用例
  - `deleteGroup()` - 删除分组用例

## 重构步骤

1. **创建新的 Domain Service 文件**
   - `ReminderTemplateBusinessService.ts` - 模板相关纯业务逻辑
   - `ReminderGroupBusinessService.ts` - 分组相关纯业务逻辑
   - `ReminderCrossAggregateService.ts` - 跨聚合业务逻辑

2. **提取纯计算逻辑**
   - 从现有 `ReminderDomainService` 中识别纯计算方法
   - 从 `ReminderTemplateControlService` 中移除 repository 依赖
   - 移动到对应的新 Business Service 中

3. **重构 Application Service**
   - 在 Application Service 开头进行所有查询
   - 调用 Domain Service 进行业务计算和验证
   - 在 Application Service 结尾进行持久化和事件发布

4. **删除旧的 ReminderDomainService**
   - 所有 CRUD 方法移动到 Application Service
   - 所有 repository 依赖移除
   - 保留纯业务逻辑的部分

5. **补充单元测试**
   - 为所有纯函数的 Domain Service 添加单元测试
   - 测试覆盖所有业务规则和边界情况
   - 不需要 mock repository，直接测试计算逻辑

## 预期收益

- ✅ **可测试性** - 纯函数易于单元测试，无需 mock 数据层
- ✅ **可复用性** - 业务逻辑可在任何环境复用（API/CLI/前端）
- ✅ **可理解性** - 职责清晰，代码意图明确
- ✅ **可扩展性** - 易于添加新的业务规则，不影响数据访问层
- ✅ **可移植性** - Domain Service 可独立部署到不同环境

## 重构风险评估

- **低风险** - 不改变业务逻辑，只是重新组织代码结构
- **向后兼容** - Application Service 的公开接口保持不变
- **渐进式** - 可以逐个用例重构，不需要一次性全部改完
- **易回滚** - 使用 Git 版本控制，随时可以回退
