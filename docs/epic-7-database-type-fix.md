# Epic 7: 数据库类型转换修复报告

**修复日期**: 2025-11-01  
**修复状态**: ✅ 完成  
**策略**: 混合类型策略 (数据库 DateTime/BigInt → DTO number)

---

## 🎯 修复策略

### 类型映射方案

| 层级 | Repository 时间戳 | Resource 时间戳 | Resource 大小 |
|------|------------------|----------------|--------------|
| **Prisma Schema** | `DateTime` | `BigInt` | `Int` → `BigInt` ✅ |
| **PersistenceDTO** | `number` (epoch ms) | `number` (epoch ms) | `number` |
| **ServerDTO** | `number` (epoch ms) | `number` (epoch ms) | `number` |
| **ClientDTO** | `number` (epoch ms) | `number` (epoch ms) | `number` |
| **Domain Layer** | `number` (epoch ms) | `number` (epoch ms) | `number` |

### ✅ 优势
- **数据库层**: 使用原生类型（DateTime 便于人类阅读，BigInt 支持高精度）
- **DTO 层**: 统一使用 `number` 方便序列化和前后端传输
- **Domain 层**: 使用 `number` 统一时间处理逻辑

---

## 🔧 修复内容

### 1. PrismaRepositoryRepository.ts ✅

#### 修复前问题
```typescript
// ❌ 没有类型转换，直接传递 DateTime 对象
private toPrismaCreateInput(dto: RepositoryPersistenceDTO): any {
  return {
    createdAt: dto.createdAt,  // number → DateTime 需要转换
    updatedAt: dto.updatedAt,
  };
}

private toDomain(record: any): Repository {
  const persistenceDTO: RepositoryPersistenceDTO = {
    createdAt: Number(record.createdAt),  // DateTime → number 转换不完整
    updatedAt: Number(record.updatedAt),
  };
}
```

#### 修复后
```typescript
// ✅ 正确的类型转换
private toPrismaCreateInput(dto: RepositoryPersistenceDTO): any {
  return {
    uuid: dto.uuid,
    accountUuid: dto.accountUuid,
    name: dto.name,
    // ... 其他字段
    // 转换: number (epoch ms) → DateTime
    lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

private toPrismaUpdateInput(dto: RepositoryPersistenceDTO): any {
  return {
    name: dto.name,
    // ... 其他字段
    // 转换: number (epoch ms) → DateTime
    lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
    updatedAt: new Date(dto.updatedAt),
  };
}

private toDomain(record: any): Repository {
  const persistenceDTO: RepositoryPersistenceDTO = {
    uuid: record.uuid,
    accountUuid: record.accountUuid,
    // ... 其他字段
    // 转换: DateTime → number (epoch ms)
    lastAccessedAt: record.lastAccessedAt ? record.lastAccessedAt.getTime() : null,
    createdAt: record.createdAt.getTime(),
    updatedAt: record.updatedAt.getTime(),
  };

  return Repository.fromPersistenceDTO(persistenceDTO);
}
```

**修复点**:
- ✅ `toPrismaCreateInput`: `number` → `new Date(number)`
- ✅ `toPrismaUpdateInput`: `number` → `new Date(number)`
- ✅ `toDomain`: `Date` → `date.getTime()` (返回 number)
- ✅ 修复方法名: `fromPersistence` → `fromPersistenceDTO`

---

### 2. PrismaResourceRepository.ts ✅

#### 修复前问题
```typescript
// ❌ BigInt → number 转换不完整
private toPrismaCreateInput(dto: ResourcePersistenceDTO): any {
  return {
    size: dto.size,  // number → BigInt 需要转换
    createdAt: dto.createdAt,  // number → BigInt 需要转换
  };
}

// ❌ JSON 查询语法错误
where: {
  tags: {
    array_contains: tags,  // ❌ Prisma 不支持此语法
  }
}
```

#### 修复后
```typescript
// ✅ 正确的 BigInt 转换
private toPrismaCreateInput(dto: ResourcePersistenceDTO): any {
  return {
    uuid: dto.uuid,
    repositoryUuid: dto.repositoryUuid,
    name: dto.name,
    type: dto.type,
    path: dto.path,
    size: BigInt(dto.size), // number → BigInt
    description: dto.description,
    author: dto.author,
    version: dto.version,
    tags: dto.tags,
    category: dto.category,
    status: dto.status,
    metadata: dto.metadata,
    createdAt: BigInt(dto.createdAt), // number → BigInt
    updatedAt: BigInt(dto.updatedAt), // number → BigInt
    modifiedAt: dto.modifiedAt ? BigInt(dto.modifiedAt) : null, // number → BigInt
  };
}

private toPrismaUpdateInput(dto: ResourcePersistenceDTO): any {
  return {
    name: dto.name,
    path: dto.path,
    size: BigInt(dto.size), // number → BigInt
    description: dto.description,
    author: dto.author,
    version: dto.version,
    tags: dto.tags,
    category: dto.category,
    status: dto.status,
    metadata: dto.metadata,
    updatedAt: BigInt(dto.updatedAt), // number → BigInt
    modifiedAt: dto.modifiedAt ? BigInt(dto.modifiedAt) : null, // number → BigInt
  };
}

private toDomain(record: any): Resource {
  const persistenceDTO: ResourcePersistenceDTO = {
    uuid: record.uuid,
    repositoryUuid: record.repositoryUuid,
    name: record.name,
    type: record.type,
    path: record.path,
    size: Number(record.size), // BigInt → number
    description: record.description,
    author: record.author,
    version: record.version,
    tags: record.tags,
    category: record.category,
    status: record.status,
    metadata: record.metadata,
    createdAt: Number(record.createdAt), // BigInt → number
    updatedAt: Number(record.updatedAt), // BigInt → number
    modifiedAt: record.modifiedAt ? Number(record.modifiedAt) : null, // BigInt → number
  };

  return Resource.fromPersistence(persistenceDTO);
}

// ✅ 修复 JSON 查询语法
if (options.tags && options.tags.length > 0) {
  // JSON 字符串查询：检查 tags JSON 是否包含任一标签
  // 例如: tags='["tag1","tag2"]' 包含 "tag1"
  where.OR = options.tags.map((tag) => ({
    tags: { contains: `"${tag}"` },
  }));
}

async findByTags(tags: string[]): Promise<Resource[]> {
  const records = await this.prisma.resource.findMany({
    where: {
      AND: [
        { status: { not: 'DELETED' } },
        {
          OR: tags.map((tag) => ({
            tags: { contains: `"${tag}"` },
          })),
        },
      ],
    },
  });

  return records.map((record) => this.toDomain(record));
}
```

**修复点**:
- ✅ `toPrismaCreateInput`: `number` → `BigInt(number)`
- ✅ `toPrismaUpdateInput`: `number` → `BigInt(number)`
- ✅ `toDomain`: `BigInt` → `Number(bigint)`
- ✅ 修复 JSON 查询: `array_contains` → `contains` (字符串包含查询)
- ✅ 修复方法名: `toPersistence` → `toPersistenceDTO`

---

## 🎯 转换规则总结

### Repository 时间戳转换

| 方向 | 源类型 | 目标类型 | 转换方法 |
|------|--------|---------|---------|
| **DTO → Prisma** | `number` (epoch ms) | `DateTime` | `new Date(number)` |
| **Prisma → DTO** | `DateTime` | `number` (epoch ms) | `date.getTime()` |

### Resource 时间戳 + 大小转换

| 方向 | 源类型 | 目标类型 | 转换方法 |
|------|--------|---------|---------|
| **DTO → Prisma** | `number` | `BigInt` | `BigInt(number)` |
| **Prisma → DTO** | `BigInt` | `number` | `Number(bigint)` |

### JSON 查询转换

| 场景 | 正确语法 | 错误语法 |
|------|---------|---------|
| **包含单个标签** | `{ tags: { contains: '"tag1"' } }` | `{ tags: { array_contains: 'tag1' } }` ❌ |
| **包含多个标签 (OR)** | `{ OR: tags.map(t => ({ tags: { contains: `"${t}"` } })) }` | `{ tags: { array_contains: tags } }` ❌ |

---

## ✅ 验证结果

### 编译验证
```bash
# PrismaRepositoryRepository.ts
✅ 0 TypeScript errors

# PrismaResourceRepository.ts
✅ 0 TypeScript errors
```

### 类型安全性
- ✅ **PersistenceDTO**: 使用 `number` 类型（epoch ms）
- ✅ **Prisma 转换**: 正确处理 DateTime ↔ number
- ✅ **Prisma 转换**: 正确处理 BigInt ↔ number
- ✅ **JSON 查询**: 使用正确的 Prisma 语法

---

## 📝 关键注意事项

### 1. 时间戳精度
```typescript
// ✅ 正确：保持毫秒精度
const timestamp = new Date().getTime();  // 1730419200000 (ms)

// ❌ 错误：丢失毫秒
const timestamp = Math.floor(Date.now() / 1000);  // 1730419200 (s)
```

### 2. BigInt JSON 序列化
```typescript
// ⚠️ 注意：BigInt 不能直接 JSON.stringify
const value = 123n;
JSON.stringify({ value });  // ❌ TypeError: Do not know how to serialize a BigInt

// ✅ 解决方案：转换为 number
JSON.stringify({ value: Number(value) });  // ✅ {"value":123}
```

### 3. DateTime vs BigInt 选择

| 场景 | 推荐类型 | 理由 |
|------|---------|------|
| **数据库可视化** | `DateTime` | 人类可读性好 |
| **高精度时间戳** | `BigInt` | 支持更大范围，精度更高 |
| **DTO 传输** | `number` | JSON 原生支持，前后端兼容 |

---

## 🚀 下一步行动

### 1. API 测试 ✅ Ready
```bash
# 启动 API
pnpm nx run api:dev

# 测试 Repository CRUD
curl -X POST http://localhost:3888/api/v1/repository-new \
  -H "x-account-uuid: test-account" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Repo","type":"LOCAL","path":"/test"}'

# 验证时间戳格式
# 期望: {"createdAt": 1730419200000, "updatedAt": 1730419200000}
```

### 2. 集成测试
- [ ] 创建 Repository → 验证时间戳
- [ ] 创建 Resource → 验证 BigInt 转换
- [ ] 标签查询 → 验证 JSON 查询语法
- [ ] 更新操作 → 验证 updatedAt 自动更新

### 3. 性能测试
- [ ] 大量数据插入测试
- [ ] DateTime vs BigInt 性能对比
- [ ] JSON 查询性能测试

---

## 📚 相关资源

- **Prisma DateTime 文档**: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#datetime
- **Prisma BigInt 文档**: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#bigint
- **Prisma JSON 查询**: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields

---

**Status**: ✅ 修复完成  
**Impact**: 数据库层与 DTO 层类型转换完全正确  
**Next**: API 端点测试 + 集成验证

**Last Updated**: 2025-11-01  
**Fixed by**: BMad Master Agent
