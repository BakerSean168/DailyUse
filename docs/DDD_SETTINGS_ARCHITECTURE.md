# DDD 架构下的高级设置系统设计文档

## 1. 概述

本文档旨在设计一个强大、可扩展且易于维护的设置系统。该系统将遵循领域驱动设计（DDD）原则，为 DailyUse 应用提供集中化的配置管理，并支持统一的导入/导出功能，以提升用户体验。

**核心理念：**
- **集中管理，分散影响**：设置模块作为统一的配置入口，但其变更会通过领域事件影响其他独立的业务模块。
- **用户体验至上**：提供无缝的配置导入/导出功能，允许用户轻松备份和迁移个人偏好。
- **灵活性与可扩展性**：架构设计必须能够轻松应对未来新增或修改的设置项，而无需进行大规模重构。

---

## 2. DDD 概念应用

我们将 **Setting** 视为一个独立的 **支撑型有界上下文 (Supporting Bounded Context)**。

- **聚合根 (Aggregate Root)**：`UserSetting` 是此上下文的核心聚合根。它代表单个用户的所有设置，封装了配置数据和相关的业务规则，确保数据的一致性和完整性。

- **值对象 (Value Objects)**：每个模块的配置被建模为值对象，例如 `AppearanceSettings`, `EditorSettings`, `TaskSettings`。它们是不可变的，任何修改都会创建一个新的值对象实例。

- **仓储 (Repository)**：`IUserSettingRepository` 接口定义了持久化 `UserSetting` 聚合的契约，将领域模型与具体的数据存储技术解耦。

- **领域事件 (Domain Events)**：当设置发生变更时，`UserSetting` 聚合会发布领域事件（如 `ThemeChangedEvent`）。其他有界上下文可以订阅这些事件来响应变化，从而实现模块间的松耦合通信。

---

## 3. 后端架构 (DDD 四层架构)

### 3.1. 领域层 (`packages/domain-server`)

这是业务核心，不依赖任何其他层。

- **`UserSetting` 聚合根 (`setting/aggregates/UserSetting.ts`)**:
  - 包含所有设置值对象。
  - 提供业务方法，如 `updateEditorSettings(newSettings)`，这些方法会执行验证逻辑。
  - 内部管理领域事件的发布。

- **值对象 (`setting/value-objects/`)**:
  - `AppearanceSettings.ts`
  - `EditorSettings.ts`
  - `TaskSettings.ts` (示例)
  - ... 其他模块的设置

- **仓储接口 (`setting/repositories/IUserSettingRepository.ts`)**:
  - `findByUserId(userId: string): Promise<UserSetting | null>`
  - `save(userSetting: UserSetting): Promise<void>`

### 3.2. 基础设施层 (`apps/api`)

负责技术实现细节。

- **持久化 (`schema.prisma`)**:
  - 在 `User` 模型中添加一个 `settings` 字段，类型为 `Json`。这是最佳实践，将整个 `UserSetting` 聚合序列化为 JSON 对象后存储。
  ```prisma
  model User {
    // ... 其他字段
    settings Json? @default("{}")
  }
  ```

- **仓储实现 (`modules/setting/infrastructure/repositories/PrismaUserSettingRepository.ts`)**:
  - 实现 `IUserSettingRepository` 接口，负责将 `UserSetting` 对象与 Prisma 的 JSON 字段进行序列化和反序列化。

### 3.3. 应用层 (`apps/api`)

协调领域对象完成业务流程。

- **`SettingService.ts`**:
  - `getSettings(userId)`: 获取用户设置。
  - `updateSettings(userId, dto)`: 更新用户设置。
  - `exportSettings(userId)`: 准备用于导出的设置数据。
  - `importSettings(userId, data)`: 验证并导入设置数据。

### 3.4. 接口层 (`apps/api`)

向外部暴露 API。

- **`SettingController.ts`**:
  - `GET /api/settings`: 获取当前用户的所有设置。
  - `PUT /api/settings`: 更新设置项（部分更新）。
  - `GET /api/settings/export`: 导出 JSON 格式的设置文件。
  - `POST /api/settings/import`: 上传并应用设置文件。

---

## 4. 前端架构

### 4.1. 状态管理 (Pinia)

- **`settingStore.ts` (`apps/web/src/modules/setting/stores/`)**:
  - **单一数据源**：作为应用中所有设置的唯一可信来源。
  - **State**: `settings: Ref<UserSetting | null>`, `isLoading: Ref<boolean>`。
  - **Actions**:
    - `fetchSettings()`: 从后端加载设置。
    - `updateSettings(partialSettings)`: 乐观更新本地状态，并调用 API 持久化（带防抖）。
    - `exportSettings()`: 调用 `useSettingImportExport` 中的导出逻辑。
    - `importSettings(file)`: 调用 `useSettingImportExport` 中的导入逻辑，成功后重新 `fetchSettings`。

### 42. 组合式函数 (Composables)

- **`useSettingImportExport.ts` (`apps/web/src/modules/setting/composables/`)**:
  - 封装文件处理逻辑，保持组件清洁。
  - `exportToFile(settings)`: 将设置对象转换为 JSON 字符串并触发浏览器下载。
  - `importFromFile(file)`: 读取上传的 JSON 文件，解析并返回设置对象。

### 4.3. UI 组件

- **`SettingAdvancedActions.vue` (`apps/web/src/modules/setting/presentation/components/`)**:
  - 一个新的、独立的组件，包含“导入设置”、“导出设置”和“恢复默认”按钮。
  - 处理按钮的加载状态和用户交互。

- **`UserSettingsView.vue`**:
  - 在页面底部或合适位置集成 `SettingAdvancedActions` 组件。

---

## 5. 实现计划

1.  **后端 - 数据库**：修改 `schema.prisma`，添加 `settings` JSON 字段，并执行数据库迁移。
2.  **后端 - 领域层**：在 `packages/domain-server` 中定义 `UserSetting` 聚合、值对象和仓储接口。
3.  **后端 - 基础设施层**：实现 `PrismaUserSettingRepository`。
4.  **后端 - 应用与接口层**：创建 `SettingService` 和 `SettingController`，并实现所有 API 端点。
5.  **前端 - 状态管理**：创建 `settingStore.ts`。
6.  **前端 - 业务逻辑**：创建 `useSettingImportExport.ts`。
7.  **前端 - UI**：创建 `SettingAdvancedActions.vue` 组件，并将其集成到主设置页面中。
8.  **联调与测试**：确保前后端功能正常，UI 交互流畅。

这份设计文档为我们接下来的工作提供了清晰的指引。我现在就开始实施第一步。