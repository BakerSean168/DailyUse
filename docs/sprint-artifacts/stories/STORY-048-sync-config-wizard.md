# STORY-048: 云同步配置向导 UI

## 📋 Story 概述

**Story ID**: STORY-048  
**Epic**: EPIC-009 (Cloud Sync Integration)  
**优先级**: P1 (用户功能)  
**预估工时**: 4 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-043, STORY-044, STORY-045, STORY-046, STORY-047

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 有一个简单的向导来配置云同步  
**以便于** 我能快速选择云平台并设置同步，而不需要了解技术细节

---

## 📋 验收标准

### 向导 UI 验收

- [ ] 分步向导 (Step 1-4)
- [ ] 支持返回上一步
- [ ] 支持跳过步骤
- [ ] 支持保存进度
- [ ] 完成后显示总结

### Step 1: 选择云平台验收

- [ ] 显示所有可用平台 (GitHub, Nutstore, Dropbox, Self-hosted)
- [ ] 每个平台显示标志和描述
- [ ] 显示平台特性和限制
- [ ] 显示价格信息 (Free/Paid)
- [ ] 支持点击了解更多

### Step 2: 认证验收

- [ ] 根据平台显示相应的认证表单
- [ ] GitHub: Token 输入框
- [ ] Nutstore: 用户名/密码
- [ ] Dropbox: OAuth2 按钮
- [ ] Self-hosted: 服务器地址输入
- [ ] 验证认证信息
- [ ] 显示认证进度
- [ ] 错误提示

### Step 3: 加密密钥设置验收

- [ ] 密码输入框 (显示强度指示)
- [ ] 确认密码
- [ ] 密码强度提示
- [ ] 显示熵值和评分
- [ ] 支持生成随机密码
- [ ] 密码要求说明

### Step 4: 数据同步选项验收

- [ ] 选择同步方向 (首次同步)
  - [ ] 上传本地数据到云
  - [ ] 下载云数据到本地
  - [ ] 手动选择
- [ ] 预览要同步的数据
- [ ] 显示同步统计 (目标数、任务数等)
- [ ] 支持选择要同步的实体类型
- [ ] 显示预计时间

### 完成总结验收

- [ ] 显示配置信息
- [ ] 显示同步状态
- [ ] 显示建议的后续步骤
- [ ] 支持立即开始同步或稍后
- [ ] 支持编辑配置

### 可用性验收

- [ ] 响应式设计 (桌面、平板、手机)
- [ ] 键盘导航支持
- [ ] 无障碍友好 (ARIA 标签)
- [ ] 暗色主题支持
- [ ] 错误消息清晰

### 安全验收

- [ ] 密钥不显示在屏幕上
- [ ] 不在日志中记录敏感信息
- [ ] HTTPS 认证
- [ ] Token 字段掩盖

---

## 🔧 技术方案

### 组件结构

```typescript
// apps/desktop/src/renderer/components/sync/SyncConfigWizard.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAsync } from '@hooks';
import { useSyncStore } from '@stores/sync';
import {
  StepProvider,
  StepContent,
  StepIndicator,
} from '@components/ui/stepper';

/**
 * 云同步配置向导
 * 
 * 分 4 步引导用户配置云同步:
 * 1. 选择云平台
 * 2. 认证信息
 * 3. 加密密钥
 * 4. 数据同步选项
 */
export const SyncConfigWizard: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<SyncConfig>({
    provider: undefined,
    credentials: {},
    encryptionKey: '',
    syncOptions: {},
  });
  
  const { status, execute: testConnection } = useAsync(
    async (creds) => {
      // 测试连接
    }
  );
  
  const handleNext = async () => {
    if (currentStep === 2) {
      // 测试连接
      await testConnection(config.credentials);
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleComplete = async () => {
    // 保存配置并开始同步
    await saveSyncConfig(config);
    onComplete();
  };
  
  return (
    <div className="sync-config-wizard">
      {/* 步骤指示 */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={4}
        labels={[
          '选择平台',
          '认证',
          '加密密钥',
          '同步选项',
        ]}
      />
      
      {/* 步骤内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="step-content"
        >
          {currentStep === 1 && (
            <Step1SelectProvider
              selected={config.provider}
              onChange={(provider) =>
                setConfig(prev => ({ ...prev, provider }))
              }
            />
          )}
          
          {currentStep === 2 && (
            <Step2Authentication
              provider={config.provider!}
              credentials={config.credentials}
              onChange={(credentials) =>
                setConfig(prev => ({ ...prev, credentials }))
              }
              isLoading={status === 'pending'}
            />
          )}
          
          {currentStep === 3 && (
            <Step3EncryptionKey
              password={config.encryptionKey}
              onChange={(encryptionKey) =>
                setConfig(prev => ({ ...prev, encryptionKey }))
              }
            />
          )}
          
          {currentStep === 4 && (
            <Step4SyncOptions
              provider={config.provider!}
              syncOptions={config.syncOptions}
              onChange={(syncOptions) =>
                setConfig(prev => ({ ...prev, syncOptions }))
              }
            />
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* 导航按钮 */}
      <div className="wizard-navigation">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="btn-secondary"
        >
          ← 上一步
        </button>
        
        {currentStep < 4 && (
          <button
            onClick={handleNext}
            disabled={!isStepValid(currentStep, config)}
            className="btn-primary"
          >
            下一步 →
          </button>
        )}
        
        {currentStep === 4 && (
          <button
            onClick={handleComplete}
            className="btn-primary"
          >
            完成配置
          </button>
        )}
      </div>
    </div>
  );
};
```

### Step 1: 选择云平台

```typescript
// apps/desktop/src/renderer/components/sync/Step1SelectProvider.tsx

interface ProviderInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  limitations: string[];
  pricing: 'free' | 'paid';
}

const PROVIDERS: Record<string, ProviderInfo> = {
  github: {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: '使用 GitHub 私有仓库作为云存储',
    features: [
      '完全免费',
      '版本控制',
      '无限存储空间',
      '全球 CDN',
    ],
    limitations: [
      '需要 GitHub 账户',
      'API 限流 (5000/小时)',
    ],
    pricing: 'free',
  },
  nutstore: {
    id: 'nutstore',
    name: '坚果云',
    icon: '🥜',
    description: '国内用户推荐，WebDAV 支持',
    features: [
      '免费 3GB 存储',
      '速度快 (国内服务)',
      'WebDAV 支持',
      '网页版访问',
    ],
    limitations: [
      '免费版容量有限',
      '上传速度限制',
    ],
    pricing: 'free',
  },
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    icon: '📦',
    description: '跨平台云存储解决方案',
    features: [
      '免费 2GB 存储',
      '多设备同步',
      '文件版本历史',
      '网页版访问',
    ],
    limitations: [
      '免费版容量有限',
      '需要国际账户',
    ],
    pricing: 'free',
  },
  self_hosted: {
    id: 'self_hosted',
    name: '自有服务器',
    icon: '🖥️',
    description: '完全控制，部署自己的同步服务器',
    features: [
      '无限存储空间',
      '完全隐私',
      '完全控制',
      '可自定义',
    ],
    limitations: [
      '需要部署服务器',
      '需要维护',
      '需要购买服务器',
    ],
    pricing: 'paid',
  },
};

export const Step1SelectProvider: React.FC<{
  selected?: string;
  onChange: (provider: string) => void;
}> = ({ selected, onChange }) => {
  return (
    <div className="provider-grid">
      <h2>选择您的云平台</h2>
      <p className="subtitle">选择一个提供商来存储您的加密数据</p>
      
      <div className="providers">
        {Object.values(PROVIDERS).map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            selected={selected === provider.id}
            onSelect={() => onChange(provider.id)}
          />
        ))}
      </div>
      
      <div className="info-box">
        <h4>💡 如何选择？</h4>
        <ul>
          <li><strong>国际用户</strong>: 推荐 GitHub (最稳定) 或 Dropbox</li>
          <li><strong>国内用户</strong>: 推荐坚果云 (速度最快)</li>
          <li><strong>隐私优先</strong>: 推荐自有服务器</li>
          <li><strong>开始体验</strong>: 选择任何免费选项</li>
        </ul>
      </div>
    </div>
  );
};

interface ProviderCardProps {
  provider: ProviderInfo;
  selected: boolean;
  onSelect: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  selected,
  onSelect,
}) => (
  <div
    className={`provider-card ${selected ? 'selected' : ''}`}
    onClick={onSelect}
  >
    <div className="icon">{provider.icon}</div>
    <h3>{provider.name}</h3>
    <p>{provider.description}</p>
    
    <div className="features">
      <h4>特性</h4>
      <ul>
        {provider.features.map(f => <li key={f}>✓ {f}</li>)}
      </ul>
    </div>
    
    <div className="limitations">
      <h4>限制</h4>
      <ul>
        {provider.limitations.map(l => <li key={l}>⚠ {l}</li>)}
      </ul>
    </div>
    
    <div className="pricing">
      {provider.pricing === 'free' ? (
        <span className="badge-free">免费</span>
      ) : (
        <span className="badge-paid">付费</span>
      )}
    </div>
  </div>
);
```

### Step 2: 认证

```typescript
// apps/desktop/src/renderer/components/sync/Step2Authentication.tsx

export const Step2Authentication: React.FC<AuthProps> = ({
  provider,
  credentials,
  onChange,
  isLoading,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string>();
  
  const handleGitHubAuth = async () => {
    // 打开浏览器进行 OAuth 认证
    const token = await getGitHubToken();
    onChange({ token });
  };
  
  return (
    <div className="authentication-form">
      <h2>连接到 {getProviderName(provider)}</h2>
      
      {provider === 'github' && (
        <GitHubAuthForm
          credentials={credentials}
          onChange={onChange}
          isLoading={isLoading}
          showToken={showToken}
          onToggleShow={() => setShowToken(!showToken)}
        />
      )}
      
      {provider === 'nutstore' && (
        <NutstoreAuthForm
          credentials={credentials}
          onChange={onChange}
          isLoading={isLoading}
        />
      )}
      
      {provider === 'dropbox' && (
        <DropboxAuthForm
          onClick={handleGitHubAuth}
          isLoading={isLoading}
        />
      )}
      
      {provider === 'self_hosted' && (
        <SelfHostedAuthForm
          credentials={credentials}
          onChange={onChange}
          isLoading={isLoading}
        />
      )}
      
      {error && (
        <div className="error-alert">
          <strong>❌ 认证失败</strong>
          <p>{error}</p>
        </div>
      )}
      
      <div className="info-box">
        <h4>🔒 您的凭证安全吗？</h4>
        <ul>
          <li>✓ 凭证不会离开您的计算机</li>
          <li>✓ 不会上传到任何服务器</li>
          <li>✓ 仅用于连接到所选云平台</li>
          <li>✓ Token 被加密存储</li>
        </ul>
      </div>
    </div>
  );
};

// GitHub 认证表单
const GitHubAuthForm: React.FC<GitHubAuthFormProps> = ({
  credentials,
  onChange,
  showToken,
  onToggleShow,
}) => (
  <div className="auth-form">
    <label>
      Personal Access Token
      <a href="https://github.com/settings/tokens" target="_blank">
        生成 Token
      </a>
    </label>
    
    <div className="token-input-group">
      <input
        type={showToken ? 'text' : 'password'}
        value={credentials.token || ''}
        onChange={e => onChange({ ...credentials, token: e.target.value })}
        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
      />
      <button
        onClick={onToggleShow}
        className="btn-icon"
        title={showToken ? '隐藏' : '显示'}
      >
        {showToken ? '👁️' : '🙈'}
      </button>
    </div>
    
    <label>
      仓库路径
      <input
        type="text"
        value={credentials.repoPath || ''}
        onChange={e => onChange({ ...credentials, repoPath: e.target.value })}
        placeholder="owner/repo"
      />
    </label>
    
    <details className="token-help">
      <summary>📖 如何生成 Token？</summary>
      <ol>
        <li>访问 <a href="https://github.com/settings/tokens">GitHub 设置</a></li>
        <li>点击 "Generate new token"</li>
        <li>选择 "repo" 权限范围</li>
        <li>设置有效期为 "No expiration" 或 90 天</li>
        <li>点击 "Generate token" 并复制</li>
        <li>粘贴到上面的输入框</li>
      </ol>
    </details>
  </div>
);
```

### Step 3: 加密密钥

```typescript
// apps/desktop/src/renderer/components/sync/Step3EncryptionKey.tsx

export const Step3EncryptionKey: React.FC<{
  password: string;
  onChange: (password: string) => void;
}> = ({ password, onChange }) => {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const strength = calculatePasswordStrength(password);
  
  return (
    <div className="encryption-key-form">
      <h2>设置加密密钥</h2>
      <p className="subtitle">
        这个密钥将加密您的所有数据。请选择一个强密码。
      </p>
      
      <label>
        加密密钥
        <div className="password-input-group">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => onChange(e.target.value)}
            placeholder="输入强密码"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="btn-icon"
          >
            {showPassword ? '👁️' : '🙈'}
          </button>
        </div>
      </label>
      
      {/* 密码强度指示 */}
      <PasswordStrengthIndicator strength={strength} password={password} />
      
      {/* 生成随机密码 */}
      <button
        onClick={() => onChange(generateSecurePassword())}
        className="btn-secondary"
      >
        🔀 生成强密码
      </button>
      
      <label>
        确认密钥
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="再次输入密钥"
        />
      </label>
      
      {password !== confirmPassword && password && confirmPassword && (
        <div className="error-alert">
          ❌ 密钥不匹配
        </div>
      )}
      
      {/* 密码要求 */}
      <div className="requirements">
        <h4>密钥要求</h4>
        <ul>
          <li className={password.length >= 12 ? 'met' : ''}>
            ✓ 至少 12 个字符
          </li>
          <li className={/[A-Z]/.test(password) ? 'met' : ''}>
            ✓ 包含大写字母
          </li>
          <li className={/[a-z]/.test(password) ? 'met' : ''}>
            ✓ 包含小写字母
          </li>
          <li className={/\d/.test(password) ? 'met' : ''}>
            ✓ 包含数字
          </li>
          <li className={/[!@#$%^&*]/.test(password) ? 'met' : ''}>
            ✓ 包含特殊字符
          </li>
        </ul>
      </div>
      
      <div className="warning-box">
        <strong>⚠️ 重要提示</strong>
        <ul>
          <li>不要忘记这个密钥！丢失后无法恢复数据。</li>
          <li>考虑将密钥存储在密码管理器中。</li>
          <li>密钥不会发送到任何服务器。</li>
          <li>只有您拥有解密数据的能力。</li>
        </ul>
      </div>
    </div>
  );
};

// 密码强度指示器
const PasswordStrengthIndicator: React.FC<{
  strength: StrengthLevel;
  password: string;
}> = ({ strength, password }) => {
  const bars = 5;
  const filledBars = strength.score;
  
  return (
    <div className="strength-indicator">
      <div className="strength-bars">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`bar ${i < filledBars ? 'filled' : ''} ${strength.level}`}
          />
        ))}
      </div>
      
      <div className="strength-text">
        <span className={`level ${strength.level}`}>
          {strength.label}
        </span>
        <span className="entropy">
          熵值: {strength.entropy?.toFixed(1)} bits
        </span>
      </div>
      
      {strength.suggestions.length > 0 && (
        <div className="suggestions">
          {strength.suggestions.map(s => (
            <p key={s}>💡 {s}</p>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Step 4: 同步选项

```typescript
// apps/desktop/src/renderer/components/sync/Step4SyncOptions.tsx

export const Step4SyncOptions: React.FC<SyncOptionsProps> = ({
  provider,
  syncOptions,
  onChange,
}) => {
  const [syncDirection, setSyncDirection] = useState<'upload' | 'download' | 'manual'>('upload');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([
    'goals',
    'tasks',
    'reminders',
  ]);
  
  const stats = calculateSyncStats(selectedEntities);
  
  return (
    <div className="sync-options-form">
      <h2>配置数据同步</h2>
      
      <label>
        <strong>首次同步方向</strong>
      </label>
      
      <div className="radio-group">
        <label>
          <input
            type="radio"
            value="upload"
            checked={syncDirection === 'upload'}
            onChange={e => setSyncDirection(e.target.value as any)}
          />
          📤 上传本地数据到云
          <small>推荐：保留本地数据，同时备份到云</small>
        </label>
        
        <label>
          <input
            type="radio"
            value="download"
            checked={syncDirection === 'download'}
            onChange={e => setSyncDirection(e.target.value as any)}
          />
          📥 下载云数据到本地
          <small>当您已在其他设备配置过云同步时选择</small>
        </label>
        
        <label>
          <input
            type="radio"
            value="manual"
            checked={syncDirection === 'manual'}
            onChange={e => setSyncDirection(e.target.value as any)}
          />
          🔄 手动选择
          <small>逐个选择每个实体类型的同步方向</small>
        </label>
      </div>
      
      {/* 实体选择 */}
      <label>
        <strong>同步数据类型</strong>
      </label>
      
      <div className="entity-checklist">
        {['goals', 'tasks', 'reminders', 'schedules'].map(entity => (
          <EntityCheckbox
            key={entity}
            entity={entity}
            checked={selectedEntities.includes(entity)}
            onChange={(checked) => {
              setSelectedEntities(checked
                ? [...selectedEntities, entity]
                : selectedEntities.filter(e => e !== entity)
              );
            }}
          />
        ))}
      </div>
      
      {/* 同步统计 */}
      <div className="sync-summary">
        <h4>同步统计</h4>
        <dl>
          <dt>目标数</dt>
          <dd>{stats.goals}</dd>
          
          <dt>任务数</dt>
          <dd>{stats.tasks}</dd>
          
          <dt>提醒数</dt>
          <dd>{stats.reminders}</dd>
          
          <dt>日程数</dt>
          <dd>{stats.schedules}</dd>
          
          <dt>总计</dt>
          <dd className="total">{stats.total} 项</dd>
          
          <dt>数据大小</dt>
          <dd>{formatBytes(stats.size)}</dd>
          
          <dt>预计时间</dt>
          <dd>{estimateSyncTime(stats.size, provider)} 秒</dd>
        </dl>
      </div>
      
      <div className="info-box">
        <h4>📌 同步注意事项</h4>
        <ul>
          <li>首次同步可能需要 1-5 分钟，请耐心等待</li>
          <li>同步过程中，请保持网络连接</li>
          <li>不要关闭应用程序</li>
          <li>之后的增量同步会快得多</li>
          <li>您可以随时在设置中修改同步配置</li>
        </ul>
      </div>
    </div>
  );
};
```

---

## 📁 文件变更清单

### 新增文件

```
apps/desktop/src/renderer/components/sync/
├── SyncConfigWizard.tsx
├── Step1SelectProvider.tsx
├── Step2Authentication.tsx
├── Step3EncryptionKey.tsx
├── Step4SyncOptions.tsx
├── SyncCompletionSummary.tsx
├── styles/
│   └── wizard.module.css
└── hooks/
    ├── usePasswordStrength.ts
    └── useSyncPreview.ts
```

### 修改文件

```
apps/desktop/src/renderer/pages/Settings.tsx
  └── 添加"配置云同步"导航项

apps/desktop/src/renderer/App.tsx
  └── 添加路由 /settings/sync-wizard

apps/desktop/src/renderer/stores/sync.ts
  └── 添加配置保存逻辑
```

---

## 🧪 测试要点

### 单元测试

- [ ] 密码强度计算
- [ ] 数据统计计算
- [ ] 验证逻辑

### 组件测试

- [ ] 步骤导航
- [ ] 表单验证
- [ ] 错误处理
- [ ] 动画

### E2E 测试

- [ ] 完整的向导流程
- [ ] 每个提供商的认证
- [ ] 配置保存
- [ ] 集成到主应用

---

## 🎨 UI 设计考虑

1. **响应式设计**：支持所有设备宽度
2. **暗色模式**：适配系统主题
3. **无障碍**：ARIA 标签、键盘导航
4. **国际化**：中英文支持
5. **加载状态**：清晰的进度反馈

---

## 🚀 下一步

1. 实现同步设置视图 (STORY-049)
2. 实现多提供商支持 (STORY-050)
3. 集成测试 (STORY-055)
