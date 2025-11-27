# DDD 基础类文档

> **模块**: @dailyuse/utils/domain  
> **版本**: 1.0  
> **类型**: 领域驱动设计基础库

---

## 📋 概述

提供领域驱动设计 (DDD) 的基础构建块，包括实体、值对象、聚合根和领域事件。

### 核心组件

- **Entity**: 具有唯一标识符的对象。
- **ValueObject**: 基于属性值定义相等性的不可变对象。
- **AggregateRoot**: 聚合的根实体，负责维护一致性边界和发布领域事件。
- **DomainEvent**: 领域事件接口。

---

## 💻 使用指南

### 定义实体

```typescript
import { Entity } from '@dailyuse/utils';

class User extends Entity<string> {
  constructor(id: string, public name: string) {
    super(id);
  }
}
```

### 定义值对象

```typescript
import { ValueObject } from '@dailyuse/utils';

class Address extends ValueObject<{ city: string; street: string }> {
  constructor(city: string, street: string) {
    super({ city, street });
  }
}
```

### 定义聚合根

```typescript
import { AggregateRoot } from '@dailyuse/utils';

class Order extends AggregateRoot<string> {
  addItem(item: OrderItem) {
    // 业务逻辑...
    this.addDomainEvent({
      type: 'OrderItemAdded',
      aggregateId: this.id,
      data: { item }
    });
  }
}
```

---

## 📝 最佳实践

1.  **不可变性**: 值对象应始终设计为不可变的。
2.  **唯一标识**: 实体必须有唯一标识符，且在生命周期内不变。
3.  **聚合边界**: 聚合根应保护内部状态，外部只能通过聚合根的方法修改内部实体。
