# Story 11.6: 辅助模块迁移（Account、Auth、AI、Notification、Repository、Setting）

Status: ready-for-dev

## Story

作为一名**用户**，
我想要**在 Desktop 应用中使用完整的账户、认证、AI、通知、仓库和设置功能**，
以便**管理个人账户、登录认证、使用 AI 助手、查看通知、管理知识仓库和配置应用设置**。

## 业务背景

这些辅助模块虽然不是核心业务模块，但对完整的用户体验至关重要。需要迁移：
- Account: 账户管理
- Auth: 登录/注册
- AI: AI 对话和生成
- Notification: 通知中心
- Repository: 知识仓库
- Setting: 应用设置

## Acceptance Criteria

### AC 11.6.1: Account 模块
```gherkin
Given 用户需要管理账户信息
When 访问账户页面
Then AccountProfileCard.tsx 显示用户资料
And AccountSettingsDialog.tsx 支持编辑账户设置
And useAccount.ts 提供账户数据和操作
```

### AC 11.6.2: Authentication 模块
```gherkin
Given 用户需要登录或注册
When 访问认证页面
Then LoginView.tsx 支持用户登录
And RegisterView.tsx 支持用户注册
And useAuth.ts 提供认证状态和操作
```

### AC 11.6.3: AI 模块
```gherkin
Given 用户需要使用 AI 功能
When 访问 AI 页面
Then AIConversationView.tsx 支持 AI 对话
And AIGenerationDialog.tsx 支持内容生成
And useAI.ts 提供 AI 操作
```

### AC 11.6.4: Notification 模块
```gherkin
Given 用户需要查看通知
When 打开通知中心
Then NotificationCenter.tsx 显示通知列表
And NotificationItem.tsx 显示单个通知
And useNotification.ts 提供通知操作
```

### AC 11.6.5: Repository 模块
```gherkin
Given 用户需要管理知识仓库
When 访问仓库页面
Then RepositoryExplorer.tsx 显示仓库浏览器
And FolderTree.tsx 显示文件夹树
And ResourceCard.tsx 显示资源卡片
And useRepository.ts 提供仓库操作
```

### AC 11.6.6: Setting 模块
```gherkin
Given 用户需要配置应用设置
When 访问设置页面
Then SettingsView.tsx 显示设置页面
And ThemeSettings.tsx 支持主题设置
And GeneralSettings.tsx 支持通用设置
And useSetting.ts 提供设置操作
```

## Tasks / Subtasks

### Task 1: Account 模块 (AC: 11.6.1)
- [ ] T6.1.1: 创建 AccountProfileCard.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/account/presentation/components/AccountProfileCard.tsx`
- [ ] T6.1.2: 创建 AccountSettingsDialog.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/account/presentation/components/AccountSettingsDialog.tsx`
- [ ] T6.1.3: 创建 useAccount.ts (1h)
  - 路径: `apps/desktop/src/renderer/modules/account/presentation/hooks/useAccount.ts`

### Task 2: Authentication 模块 (AC: 11.6.2)
- [ ] T6.2.1: 完善 LoginView.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/authentication/presentation/views/LoginView.tsx`
- [ ] T6.2.2: 创建 RegisterView.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/authentication/presentation/views/RegisterView.tsx`
- [ ] T6.2.3: 创建 useAuth.ts (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/authentication/presentation/hooks/useAuth.ts`

### Task 3: AI 模块 (AC: 11.6.3)
- [ ] T6.3.1: 创建 AIConversationView.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/ai/presentation/views/AIConversationView.tsx`
  - 功能: 聊天界面、消息列表、输入框
- [ ] T6.3.2: 创建 AIGenerationDialog.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/ai/presentation/components/AIGenerationDialog.tsx`
- [ ] T6.3.3: 创建 useAI.ts (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/ai/presentation/hooks/useAI.ts`

### Task 4: Notification 模块 (AC: 11.6.4)
- [ ] T6.4.1: 创建 NotificationCenter.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/notification/presentation/components/NotificationCenter.tsx`
- [ ] T6.4.2: 创建 NotificationItem.tsx (1h)
  - 路径: `apps/desktop/src/renderer/modules/notification/presentation/components/NotificationItem.tsx`
- [ ] T6.4.3: 创建 useNotification.ts (1h)
  - 路径: `apps/desktop/src/renderer/modules/notification/presentation/hooks/useNotification.ts`

### Task 5: Repository 模块 (AC: 11.6.5)
- [ ] T6.5.1: 创建 RepositoryExplorer.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/repository/presentation/views/RepositoryExplorer.tsx`
- [ ] T6.5.2: 创建 FolderTree.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/repository/presentation/components/FolderTree.tsx`
- [ ] T6.5.3: 创建 ResourceCard.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/repository/presentation/components/ResourceCard.tsx`
- [ ] T6.5.4: 创建 useRepository.ts (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/repository/presentation/hooks/useRepository.ts`

### Task 6: Setting 模块 (AC: 11.6.6)
- [ ] T6.6.1: 创建 SettingsView.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/setting/presentation/views/SettingsView.tsx`
- [ ] T6.6.2: 创建 ThemeSettings.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/setting/presentation/components/ThemeSettings.tsx`
- [ ] T6.6.3: 创建 GeneralSettings.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/setting/presentation/components/GeneralSettings.tsx`
- [ ] T6.6.4: 创建 useSetting.ts (1h)
  - 路径: `apps/desktop/src/renderer/modules/setting/presentation/hooks/useSetting.ts`

## Dev Notes

### AI 对话界面实现

```tsx
// AIConversationView.tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function AIConversationView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useAI();

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { id: uuid(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    const response = await sendMessage(input);
    const assistantMessage = { id: uuid(), role: 'assistant', content: response, timestamp: new Date() };
    setMessages(prev => [...prev, assistantMessage]);
  };

  return (
    <PageContainer title="AI 助手">
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </ScrollArea>
        <div className="flex gap-2 p-4 border-t">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入消息..."
          />
          <Button onClick={handleSend} disabled={isLoading}>
            发送
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
```

### 设置页面实现

```tsx
// SettingsView.tsx
function SettingsView() {
  return (
    <PageContainer title="设置">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">通用</TabsTrigger>
          <TabsTrigger value="theme">主题</TabsTrigger>
          <TabsTrigger value="account">账户</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="theme">
          <ThemeSettings />
        </TabsContent>
        <TabsContent value="account">
          <AccountProfileCard />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
```

### 依赖关系

- **前置依赖**: Story 11.0 (基础设施)
- **可并行**: 这些模块之间相对独立，可以并行开发

### References

- [EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- Web 各模块参考代码

## Estimated Effort

| Task | 预估工时 |
|------|---------|
| Account 模块 | 4.5h |
| Authentication 模块 | 5.5h |
| AI 模块 | 6.5h |
| Notification 模块 | 4h |
| Repository 模块 | 8h |
| Setting 模块 | 6h |
| **总计** | **34.5h** |

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

