# 前端开发最佳实践

## 🎯 核心原则

### 1. **明确失败优于隐式默认值（Fail Explicitly, Not Silently）**

**反面案例 ❌：使用默认值掩盖数据缺失**

```typescript
// 不好的做法：编辑模式下使用硬编码默认值
const loadTemplateData = (template: ReminderTemplate) => {
  formData.triggerType = template.trigger?.type || 'FIXED_TIME'; // ❌ 掩盖了数据缺失
  formData.fixedTime = template.trigger?.fixedTime?.time || '09:00'; // ❌ 用户看不出有问题
  formData.color = template.color || '#2196F3'; // ❌ 隐藏了空值
};

// 问题：
// 1. 用户看到的是 "固定时间 09:00"，但实际服务器数据可能是 "间隔 60分钟"
// 2. 开发者无法快速定位是数据传递问题还是渲染问题
// 3. 用户可能误以为功能正常，导致错误的操作
```

**正确案例 ✅：让数据问题显而易见**

```typescript
// 好的做法：区分创建模式和编辑模式，不使用误导性默认值
const loadTemplateData = (template: ReminderTemplate) => {
  if (template.trigger) {
    formData.triggerType = template.trigger.type;
    
    if (template.trigger.type === 'FIXED_TIME') {
      if (template.trigger.fixedTime?.time) {
        formData.fixedTime = template.trigger.fixedTime.time;
      } else {
        console.warn('⚠️ 固定时间触发器缺少 time 配置', template.uuid);
        formData.fixedTime = ''; // ✅ 空值会让 UI 显示为空，用户能立即发现
      }
    } else if (template.trigger.type === 'INTERVAL') {
      if (template.trigger.interval?.minutes) {
        formData.intervalMinutes = template.trigger.interval.minutes;
      } else {
        console.warn('⚠️ 间隔触发器缺少 minutes 配置', template.uuid);
        formData.intervalMinutes = 0; // ✅ 0 会触发表单验证失败
      }
    }
  } else {
    console.error('❌ 提醒模板缺少触发器配置！', template.uuid);
    // ✅ 不设置任何值，让问题暴露在控制台和 UI 上
  }
  
  formData.color = template.color || ''; // ✅ 空字符串而不是默认颜色
  formData.icon = template.icon || ''; // ✅ 空字符串而不是默认图标
};

// 优势：
// 1. 控制台会输出警告/错误，开发者能立即定位问题
// 2. UI 显示空值或验证失败，用户能发现异常
// 3. 调试时间从 "找半天为什么显示不对" 缩短到 "一眼看出数据传递有问题"
```

---

### 2. **创建模式 vs 编辑模式：明确区分默认值用途**

```typescript
// ✅ 创建模式：使用合理的默认值帮助用户快速开始
const resetForm = () => {
  formData.triggerType = 'FIXED_TIME'; // ✅ 合理，帮助新用户
  formData.fixedTime = '09:00'; // ✅ 合理，常用时间
  formData.color = '#2196F3'; // ✅ 合理，视觉友好
  formData.icon = 'mdi-bell'; // ✅ 合理，语义明确
};

// ✅ 编辑模式：直接使用服务器数据，不填充默认值
const loadTemplateData = (template: ReminderTemplate) => {
  formData.color = template.color || ''; // ✅ 空值而不是默认值
  formData.icon = template.icon || ''; // ✅ 如果服务器没有，就不显示
  
  // ❌ 不要这样做：
  // formData.color = template.color || '#2196F3'; // 错误：掩盖了服务器数据缺失
};
```

---

### 3. **完善的日志输出：让调试变得简单**

```typescript
// ✅ 使用分级日志明确问题严重程度
if (!template.trigger) {
  console.error('❌ 提醒模板缺少触发器配置！', template.uuid);
  // 使用 error 表示这是严重问题
}

if (!template.trigger.fixedTime?.time) {
  console.warn('⚠️ 固定时间触发器缺少 time 配置', template.uuid);
  // 使用 warn 表示这是潜在问题
}

console.info('✅ 模板数据加载成功', { uuid: template.uuid, type: template.type });
// 使用 info 表示正常流程
```

---

### 4. **类型安全：使用共享类型定义**

```typescript
// ❌ 不好：内联类型定义
interface UpdateRequest {
  title?: string;
  color?: string;
  // ... 前后端可能不一致
}

// ✅ 好：使用 contracts 中的共享类型
import { ReminderContracts } from '@dailyuse/contracts';

const updateRequest: ReminderContracts.UpdateReminderTemplateRequestDTO = {
  title: formData.title,
  trigger: buildTriggerConfig(),
  // TypeScript 会确保字段名和类型完全一致
};
```

---

### 5. **表单验证：让无效状态无法提交**

```typescript
// ✅ 使用表单验证规则阻止无效数据
const rules = {
  required: (v: any) => !!v || '此字段为必填项',
  positiveNumber: (v: any) => (v && v > 0) || '请输入大于0的数字',
  timeFormat: (v: string) => {
    if (!v) return '时间不能为空'; // ✅ 明确提示
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(v) || '请输入正确的时间格式 (HH:MM)';
  },
};

// 应用验证规则
<v-text-field
  v-model="formData.fixedTime"
  :rules="[rules.required, rules.timeFormat]"
  label="固定时间 (HH:MM)"
/>

// 提交前验证
const handleSave = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) {
    console.warn('⚠️ 表单验证失败，无法提交');
    return; // ✅ 阻止无效数据提交
  }
  // 继续提交...
};
```

---

## 📋 实际案例：提醒模板编辑表单修复

### 问题描述
用户修改提醒模板，将触发器从 "固定时间 09:00" 改为 "间隔 60分钟"，提交后：
- ✅ 服务器响应正确：`{"trigger": {"type": "INTERVAL", "interval": {"minutes": 60}}}`
- ✅ Store 持久化正确：数据已更新
- ❌ **页面显示错误**：仍然显示 "固定时间 09:00"

### 根本原因
`loadTemplateData` 函数使用了硬编码默认值：

```typescript
// ❌ 问题代码
const loadTemplateData = (template: ReminderTemplate) => {
  formData.triggerType = ReminderContracts.TriggerType.FIXED_TIME; // 硬编码默认值
  formData.fixedTime = '09:00'; // 硬编码默认值
  // TODO: 从 template.trigger 解析触发配置 ← 从未实现
};
```

用户每次打开编辑对话框，都会被强制设置为 `FIXED_TIME` + `09:00`，无论服务器数据是什么。

### 修复方案

```typescript
// ✅ 修复后的代码
const loadTemplateData = (template: ReminderTemplate) => {
  // 正确解析触发器配置
  if (template.trigger) {
    formData.triggerType = template.trigger.type;
    
    if (template.trigger.type === 'FIXED_TIME') {
      if (template.trigger.fixedTime?.time) {
        formData.fixedTime = template.trigger.fixedTime.time;
      } else {
        console.warn('⚠️ 固定时间触发器缺少 time 配置', template.uuid);
        formData.fixedTime = ''; // 空值暴露问题
      }
    } else if (template.trigger.type === 'INTERVAL') {
      if (template.trigger.interval?.minutes) {
        formData.intervalMinutes = template.trigger.interval.minutes;
      } else {
        console.warn('⚠️ 间隔触发器缺少 minutes 配置', template.uuid);
        formData.intervalMinutes = 0; // 触发验证失败
      }
    }
  } else {
    console.error('❌ 提醒模板缺少触发器配置！', template.uuid);
  }
};
```

### 效果对比

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| **正常数据** | 显示默认值 `FIXED_TIME 09:00` | ✅ 正确显示 `INTERVAL 60分钟` |
| **数据缺失** | 显示默认值，掩盖问题 | ⚠️ 控制台警告 + UI 显示空值 |
| **调试时间** | 30分钟+ (怀疑后端、Store、组件传值) | 2分钟 (控制台直接指出问题) |
| **用户体验** | ❌ 困惑："我明明改了，怎么还是旧的？" | ✅ 清晰："显示空了，肯定是数据有问题" |

---

## 🎓 总结

### 核心思想
> **Make Invalid States Unrepresentable & Visible**
> （让无效状态无法表示，并且可见）

### 实践清单

- [ ] **编辑模式不使用默认值**：直接使用服务器数据，空值就是空值
- [ ] **完善的日志输出**：使用 `console.error/warn/info` 明确问题级别
- [ ] **表单验证规则**：阻止无效数据提交
- [ ] **类型安全**：使用 `@dailyuse/contracts` 共享类型
- [ ] **区分创建/编辑模式**：创建时可以有合理默认值，编辑时不要
- [ ] **TODO 必须解决**：不要让 TODO 注释永久存在，及时实现或删除

### 长期收益

1. **调试效率提升 10 倍**：问题一眼就能定位
2. **用户体验更好**：异常状态明确提示，而不是悄悄显示错误数据
3. **代码质量更高**：类型安全 + 完善验证 = 更少 bug
4. **团队协作更顺畅**：前后端使用共享类型，沟通成本降低

---

## 📚 相关资源

- [Make Impossible States Impossible (Richard Feldman)](https://www.youtube.com/watch?v=IcgmSRJHu_8)
- [Parse, don't validate (Alexis King)](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)

