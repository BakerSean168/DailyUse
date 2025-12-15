# Story 13.42: AI 模块 UI 组件和页面实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.42 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 8h |
| 前置依赖 | Story 13.41 (AI Store) |
| 关联模块 | AI |

## 目标

实现 AI 模块的 UI 组件和完整页面，包括聊天界面、Prompt 管理、Provider 配置等。

## 任务列表

### 1. 创建 Chat 组件 (3h)
- [ ] ChatMessage 组件
- [ ] ChatInput 组件
- [ ] ChatView 组件
- [ ] MessageList 组件

### 2. 创建 Conversation 组件 (1.5h)
- [ ] ConversationList
- [ ] ConversationItem
- [ ] ConversationSidebar

### 3. 创建 Provider 配置组件 (2h)
- [ ] ProviderSettings
- [ ] ProviderForm
- [ ] ModelSelector

### 4. 创建 AI 页面和路由 (1.5h)
- [ ] AIPage 主页面
- [ ] PromptLibrary 页面
- [ ] 路由配置

## 技术规范

### Chat Message Component
```typescript
// renderer/modules/ai/presentation/components/ChatMessage.tsx
import React, { memo } from 'react';
import { cn } from '@dailyuse/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@dailyuse/ui';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage as ChatMessageType } from '../../infrastructure/ipc';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

const CodeBlock: React.FC<{
  language?: string;
  value: string;
}> = ({ language, value }) => {
  const { isCopied, copy } = useCopyToClipboard();

  return (
    <div className="relative group">
      <button
        className="absolute right-2 top-2 p-1 rounded bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copy(value)}
      >
        {isCopied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '8px',
          padding: '1rem',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = memo(
  ({ message, isStreaming }) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
      <div
        className={cn(
          'flex gap-3 p-4',
          isUser && 'bg-muted/30'
        )}
      >
        {/* Avatar */}
        <Avatar className="w-8 h-8 shrink-0">
          {isUser ? (
            <>
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarFallback className="bg-secondary">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </>
          )}
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="font-medium text-sm">
            {isUser ? '你' : 'AI 助手'}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).replace(/\n$/, '')}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';
```

### Chat Input Component
```typescript
// renderer/modules/ai/presentation/components/ChatInput.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Textarea } from '@dailyuse/ui';
import { Send, Square, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  onAbort?: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onAbort,
  isLoading,
  isStreaming,
  placeholder = '输入消息...',
  disabled,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  }, [input, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="min-h-[44px] max-h-[200px] resize-none pr-12"
            rows={1}
          />
          {!isLoading && !isStreaming && input.length > 0 && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 bottom-2 h-8 w-8"
              onClick={handleSubmit}
              disabled={disabled}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isStreaming ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={onAbort}
            className="shrink-0"
          >
            <Square className="w-4 h-4" />
          </Button>
        ) : isLoading ? (
          <Button variant="secondary" size="icon" disabled className="shrink-0">
            <Loader2 className="w-4 h-4 animate-spin" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="shrink-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            发送
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        按 Enter 发送，Shift + Enter 换行
      </p>
    </div>
  );
};
```

### Chat View Component
```typescript
// renderer/modules/ai/presentation/components/ChatView.tsx
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAIChat, useAI } from '../../store';
import { ScrollArea } from '@dailyuse/ui';
import { Bot, MessageSquare } from 'lucide-react';

export const ChatView: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAvailable } = useAI();
  const {
    messages,
    isChatting,
    isStreaming,
    streamingResponse,
    error,
    send,
    abort,
  } = useAIChat();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingResponse]);

  if (!isAvailable) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Bot className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">AI 功能未配置</p>
        <p className="text-sm">请先在设置中配置 AI Provider</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">开始对话</p>
            <p className="text-sm">输入消息开始与 AI 助手交流</p>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isStreaming && streamingResponse && (
              <ChatMessage
                message={{ role: 'assistant', content: streamingResponse }}
                isStreaming
              />
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={(content) => send(content, true)}
        onAbort={abort}
        isLoading={isChatting}
        isStreaming={isStreaming}
      />
    </div>
  );
};
```

### Conversation Sidebar
```typescript
// renderer/modules/ai/presentation/components/ConversationSidebar.tsx
import React from 'react';
import { useConversations, useAIProviders } from '../../store';
import {
  Button,
  ScrollArea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@dailyuse/ui';
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit2,
  Settings,
} from 'lucide-react';
import { cn } from '@dailyuse/ui';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const ConversationSidebar: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
    deleteConversation,
  } = useConversations();
  const { activeProvider, models, selectedModel, setSelectedModel } = useAIProviders();

  return (
    <div className="w-64 border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button
          className="w-full"
          onClick={() => createConversation()}
        >
          <Plus className="w-4 h-4 mr-2" />
          新对话
        </Button>
      </div>

      {/* Model Selector */}
      {activeProvider && models.length > 0 && (
        <div className="px-4 py-2 border-b">
          <label className="text-xs text-muted-foreground">模型</label>
          <select
            value={selectedModel || ''}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full mt-1 text-sm bg-background border rounded p-1"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无对话
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                  conv.id === activeConversationId
                    ? 'bg-accent'
                    : 'hover:bg-muted'
                )}
                onClick={() => setActiveConversation(conv.id)}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.updatedAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Edit2 className="w-4 h-4 mr-2" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteConversation(conv.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          AI 设置
        </Button>
      </div>
    </div>
  );
};
```

### AI Page
```typescript
// renderer/modules/ai/presentation/views/AIPage.tsx
import React, { useEffect } from 'react';
import { useAI } from '../../store';
import { ChatView } from '../components/ChatView';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { Skeleton } from '@dailyuse/ui';

export const AIPage: React.FC = () => {
  const { isInitialized, isLoading, initialize, error } = useAI();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-64 border-r p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ConversationSidebar />
      <div className="flex-1">
        <ChatView />
      </div>
    </div>
  );
};
```

### Provider Settings Component
```typescript
// renderer/modules/ai/presentation/components/ProviderSettings.tsx
import React, { useState } from 'react';
import { useAIProviders } from '../../store';
import { aiIPCClient } from '../../infrastructure/ipc';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Badge,
} from '@dailyuse/ui';
import { Plus, Trash2, Check, X, Loader2, Zap } from 'lucide-react';

export const ProviderSettings: React.FC = () => {
  const { providers, activeProvider, setActiveProvider, addProvider, removeProvider } = useAIProviders();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'openai' as const,
    name: '',
    apiKey: '',
    baseUrl: '',
  });
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; result?: { success: boolean; message: string } }>>({});

  const handleAdd = async () => {
    await addProvider({
      type: formData.type,
      name: formData.name || formData.type.toUpperCase(),
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl || undefined,
      enabled: true,
      isDefault: providers.length === 0,
    });
    setFormData({ type: 'openai', name: '', apiKey: '', baseUrl: '' });
    setShowAddForm(false);
  };

  const handleTest = async (providerId: string) => {
    setTestStatus((prev) => ({ ...prev, [providerId]: { loading: true } }));
    const result = await aiIPCClient.testProvider(providerId);
    setTestStatus((prev) => ({ ...prev, [providerId]: { loading: false, result } }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI Provider 配置
          </CardTitle>
          <CardDescription>
            配置 AI 服务提供商，支持 OpenAI、Claude、Ollama 等
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider List */}
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {provider.type.toUpperCase()}
                    {provider.baseUrl && ` • ${provider.baseUrl}`}
                  </p>
                </div>
                {provider.isDefault && (
                  <Badge variant="secondary">默认</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {testStatus[provider.id]?.loading ? (
                  <Button variant="outline" size="sm" disabled>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </Button>
                ) : testStatus[provider.id]?.result ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      testStatus[provider.id].result!.success
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {testStatus[provider.id].result!.success ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(provider.id)}
                  >
                    测试
                  </Button>
                )}
                {!provider.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveProvider(provider.id)}
                  >
                    设为默认
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProvider(provider.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add Form */}
          {showAddForm ? (
            <div className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData((d) => ({ ...d, type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="claude">Claude</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                      <SelectItem value="custom">自定义 (OpenAI 兼容)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>名称</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                    placeholder="可选"
                  />
                </div>
              </div>
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData((d) => ({ ...d, apiKey: e.target.value }))}
                  placeholder="sk-..."
                />
              </div>
              {(formData.type === 'custom' || formData.type === 'ollama') && (
                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={formData.baseUrl}
                    onChange={(e) => setFormData((d) => ({ ...d, baseUrl: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!formData.apiKey}>
                  添加
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加 Provider
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

### AI Routes
```typescript
// renderer/modules/ai/routes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { AIPage } from './presentation/views/AIPage';
import { PromptLibraryPage } from './presentation/views/PromptLibraryPage';
import { AuthGuard } from '@/modules/auth/presentation/components';

export const aiRoutes: RouteObject[] = [
  {
    path: '/ai',
    element: (
      <AuthGuard>
        <AIPage />
      </AuthGuard>
    ),
  },
  {
    path: '/ai/prompts',
    element: (
      <AuthGuard>
        <PromptLibraryPage />
      </AuthGuard>
    ),
  },
];
```

### Module Index
```typescript
// renderer/modules/ai/index.ts
/**
 * AI Module
 *
 * AI 模块提供智能助手功能：
 * - 多 Provider 支持 (OpenAI, Claude, Ollama)
 * - 流式对话
 * - Prompt 模板管理
 * - 对话历史管理
 */

// Infrastructure
export { aiIPCClient } from './infrastructure/ipc';
export type {
  ChatMessage,
  ChatOptions,
  AIProviderConfig,
  AICapabilities,
  ModelInfo,
  Prompt,
} from './infrastructure/ipc';

// Store
export { useAIStore, aiSelectors } from './store';
export type { AIState, AIActions, Conversation } from './store';

// Hooks
export {
  useAI,
  useAIChat,
  useConversations,
  useAIProviders,
  usePrompts,
} from './store';

// Components
export { ChatMessage } from './presentation/components/ChatMessage';
export { ChatInput } from './presentation/components/ChatInput';
export { ChatView } from './presentation/components/ChatView';
export { ConversationSidebar } from './presentation/components/ConversationSidebar';
export { ProviderSettings } from './presentation/components/ProviderSettings';

// Views
export { AIPage } from './presentation/views/AIPage';

// Routes
export { aiRoutes } from './routes';

// Module initialization
export const initializeAIModule = async (): Promise<void> => {
  const { useAIStore } = await import('./store');
  await useAIStore.getState().initialize();
};
```

## 验收标准

- [ ] Chat 组件正确渲染消息
- [ ] Markdown 和代码高亮正常
- [ ] 流式响应实时显示
- [ ] 对话列表管理正常
- [ ] Provider 配置功能完整
- [ ] 测试连接功能正常
- [ ] 路由配置正确
- [ ] 响应式布局正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/ai/presentation/components/ChatMessage.tsx`
- `renderer/modules/ai/presentation/components/ChatInput.tsx`
- `renderer/modules/ai/presentation/components/ChatView.tsx`
- `renderer/modules/ai/presentation/components/ConversationSidebar.tsx`
- `renderer/modules/ai/presentation/components/ProviderSettings.tsx`
- `renderer/modules/ai/presentation/views/AIPage.tsx`
- `renderer/modules/ai/routes.tsx`
- `renderer/modules/ai/index.ts`
