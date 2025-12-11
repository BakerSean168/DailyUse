/**
 * AI Assistant View
 *
 * AI助手视图 - 支持对话、任务分解、内容生成等功能
 */

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '👋 你好！我是你的 AI 助手。我可以帮助你:\n\n📝 **任务分解** - 将复杂目标分解成可行的步骤\n🤖 **内容生成** - 帮助生成任务描述、日志等\n💡 **建议** - 提供时间管理和目标设定的建议\n📊 **总结** - 生成周/月总结报告\n\n你想要什么帮助？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'features'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 模拟 AI 响应
    setTimeout(() => {
      const responses: Record<string, string> = {
        'hello|hi|你好|嗨': '你好！很高兴见到你。有什么我可以帮助的吗？',
        '分解|decompose|break down': '我可以帮你分解一个目标。请告诉我你想分解的目标是什么？',
        '生成|generate|create': '我可以帮你生成内容。请描述你需要生成什么？',
        '总结|summary|report': '我可以为你生成周/月总结。你想要哪个时期的总结？',
      };

      let response = '我理解你的想法。能否提供更多细节，让我更好地帮助你？';

      for (const [keyword, reply] of Object.entries(responses)) {
        const keywords = keyword.split('|');
        if (keywords.some((k) => input.toLowerCase().includes(k))) {
          response = reply;
          break;
        }
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🤖 AI 助手</h1>
          <p className="text-muted-foreground">由 AI 驱动的任务和目标管理助手</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          💬 对话
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'features'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          ✨ 功能
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto border rounded-lg bg-card p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-secondary text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {format(msg.timestamp, 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-foreground px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {[
                '💡 帮我分解这个目标',
                '📝 生成任务描述',
                '📊 生成周总结',
                '⏰ 给我提个建议',
              ].map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="text-sm px-3 py-1 border rounded-full hover:bg-secondary transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendMessage();
                  }
                }}
                placeholder="输入你的问题或请求..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '思考中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Features Tab
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              icon: '🎯',
              title: '智能任务分解',
              description: '将复杂目标自动分解成可操作的任务步骤，评估时间和难度',
              action: '开始分解',
            },
            {
              icon: '📝',
              title: '内容生成',
              description: '自动生成任务描述、日志、报告等内容',
              action: '生成内容',
            },
            {
              icon: '💡',
              title: '智能建议',
              description: '基于你的目标和任务，提供时间管理和优化建议',
              action: '获取建议',
            },
            {
              icon: '📊',
              title: '自动总结',
              description: '生成周/月总结报告，展示你的进度和成就',
              action: '生成总结',
            },
            {
              icon: '🔍',
              title: '内容分析',
              description: '分析你的笔记和记录，提取关键信息',
              action: '开始分析',
            },
            {
              icon: '🚀',
              title: '优化建议',
              description: '根据你的工作模式，提供工作流优化建议',
              action: '获取优化',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{feature.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {feature.description}
              </p>
              <button
                onClick={() => handleQuickAction(feature.action)}
                className="text-sm px-3 py-1 border rounded hover:bg-secondary transition-colors"
              >
                {feature.action}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
