# STORY-044: 加密服务模块实现

## 📋 Story 概述

**Story ID**: STORY-044  
**Epic**: EPIC-009 (Cloud Sync Integration)  
**优先级**: P0 (核心安全)  
**预估工时**: 3 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-043

---

## 🎯 用户故事

**作为** DailyUse 安全架构设计者  
**我希望** 有一个完整的端到端加密服务  
**以便于** 用户数据在上传到任何云平台之前都被加密，确保隐私安全

---

## 📋 验收标准

### 加密功能验收

- [ ] 实现 AES-256-GCM 加密/解密
- [ ] 支持 PBKDF2 密钥派生
- [ ] 支持随机 IV 生成
- [ ] 支持认证标签验证
- [ ] 密钥长度验证 (256-bit)
- [ ] 支持密钥轮换

### 密钥管理验收

- [ ] 从密码派生密钥 (PBKDF2)
- [ ] 从生物识别派生密钥
- [ ] 支持多密钥版本
- [ ] 密钥更新不丢失数据
- [ ] 老密钥可用于解密历史数据

### 性能验收

- [ ] 加密 1MB 数据 < 100ms
- [ ] 解密 1MB 数据 < 100ms
- [ ] 密钥派生 < 500ms
- [ ] 支持流式加密 (大文件)

### 安全验收

- [ ] 使用 TweetNaCl.js 或 libsodium.js 或 Node 原生 crypto
- [ ] 随机 IV 确保相同数据加密后不同
- [ ] 认证标签防止数据篡改
- [ ] 密钥不存储在日志中
- [ ] 支持密钥过期和销毁

### 集成验收

- [ ] 与 ISyncAdapter 无缝集成
- [ ] 支持所有实体类型的加密
- [ ] 支持批量操作
- [ ] 错误处理一致

---

## 🔧 技术方案

### 核心加密服务

```typescript
// packages/infrastructure-client/src/encryption/EncryptionService.ts

import crypto from 'crypto';

/**
 * 加密服务 - 处理所有端到端加密操作
 * 
 * 设计原则:
 * - 使用 AES-256-GCM (认证加密)
 * - 使用 PBKDF2 进行密钥派生
 * - 每次加密使用随机 IV
 * - 支持多密钥版本
 * - 密钥不持久化存储
 */
export class EncryptionService {
  private currentKey: Buffer;
  private keyVersion: number = 1;
  private keyHistory: Map<number, Buffer> = new Map();
  private keyDerivationParams: KeyDerivationParams;
  
  // 常量定义
  private static readonly KEY_SIZE = 32; // 256-bit
  private static readonly IV_SIZE = 12; // 96-bit for GCM
  private static readonly AUTH_TAG_SIZE = 16; // 128-bit
  private static readonly ALGORITHM = 'aes-256-gcm';
  
  // PBKDF2 参数
  private static readonly PBKDF2_ITERATIONS = 600000; // OWASP 2023 建议
  private static readonly PBKDF2_HASH = 'sha256';
  
  constructor(masterPassword: string, salt?: string) {
    // 初始化密钥派生参数
    this.keyDerivationParams = {
      iterations: EncryptionService.PBKDF2_ITERATIONS,
      hash: EncryptionService.PBKDF2_HASH,
      salt: salt || this.generateSalt(),
    };
    
    // 从主密码派生密钥
    this.currentKey = this.deriveKey(masterPassword);
    this.keyHistory.set(this.keyVersion, this.currentKey);
  }
  
  // ========== 密钥派生 ==========
  
  /**
   * 从密码派生加密密钥
   * 
   * 使用 PBKDF2 确保密钥导出的安全性
   * 
   * @param password - 用户密码或生物识别匹配结果
   * @returns 派生的 256-bit 密钥
   */
  private deriveKey(password: string): Buffer {
    return crypto.pbkdf2Sync(
      password,
      this.keyDerivationParams.salt,
      this.keyDerivationParams.iterations,
      EncryptionService.KEY_SIZE,
      EncryptionService.PBKDF2_HASH
    );
  }
  
  /**
   * 为特定用户生成盐值
   * 
   * 盐值应该是随机的，并与用户帐户关联
   * 
   * @returns Base64 编码的盐值
   */
  private generateSalt(): string {
    return crypto.randomBytes(32).toString('base64');
  }
  
  /**
   * 生成新的加密密钥 (用于密钥轮换)
   * 
   * @param newPassword - 新密码
   */
  rotateKey(newPassword: string): void {
    const newVersion = this.keyVersion + 1;
    const newKey = this.deriveKey(newPassword);
    
    // 保存旧密钥以兼容历史数据
    this.keyHistory.set(newVersion, newKey);
    this.currentKey = newKey;
    this.keyVersion = newVersion;
  }
  
  /**
   * 获取密钥派生参数
   * 
   * 用于保存盐值，以便后续恢复
   */
  getKeyDerivationParams(): KeyDerivationParams {
    return { ...this.keyDerivationParams };
  }
  
  // ========== 加密操作 ==========
  
  /**
   * 加密数据
   * 
   * @param plaintext - 待加密的数据
   * @returns 包含加密数据、IV、认证标签等的加密对象
   * 
   * @example
   * const encrypted = encryptionService.encrypt(JSON.stringify(goal));
   * // encrypted = {
   * //   encryptedPayload: "abc123...",
   * //   iv: "def456...",
   * //   authTag: "ghi789...",
   * //   algorithm: "AES-256-GCM",
   * //   keyVersion: 1,
   * //   metadata: { ... }
   * // }
   */
  encrypt(plaintext: string | Buffer): EncryptedData {
    // 转换为 Buffer
    const data = typeof plaintext === 'string' 
      ? Buffer.from(plaintext, 'utf-8')
      : plaintext;
    
    // 生成随机 IV
    const iv = crypto.randomBytes(EncryptionService.IV_SIZE);
    
    // 创建加密器
    const cipher = crypto.createCipheriv(
      EncryptionService.ALGORITHM,
      this.currentKey,
      iv
    );
    
    // 加密数据
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);
    
    // 获取认证标签
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedPayload: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: 'AES-256-GCM',
      keyVersion: this.keyVersion,
      metadata: {
        originalSize: data.length,
        timestamp: Date.now(),
        checksum: this.calculateChecksum(data),
      },
    };
  }
  
  /**
   * 解密数据
   * 
   * 支持多版本密钥自动检测
   * 
   * @param encrypted - 加密对象
   * @returns 解密后的原始数据
   * @throws 解密失败 (错误的密钥或数据被篡改) 时抛出
   * 
   * @example
   * try {
   *   const plaintext = encryptionService.decrypt(encrypted);
   *   const goal = JSON.parse(plaintext);
   * } catch (error) {
   *   console.error('Decryption failed:', error);
   * }
   */
  decrypt(encrypted: EncryptedData): string {
    // 获取正确的密钥版本
    const key = this.keyHistory.get(encrypted.keyVersion);
    if (!key) {
      throw new Error(
        `Key version ${encrypted.keyVersion} not found. ` +
        `Available versions: ${Array.from(this.keyHistory.keys()).join(', ')}`
      );
    }
    
    // 转换为 Buffer
    const encryptedPayload = Buffer.from(encrypted.encryptedPayload, 'base64');
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');
    
    // 创建解密器
    const decipher = crypto.createDecipheriv(
      EncryptionService.ALGORITHM,
      key,
      iv
    );
    
    // 设置认证标签
    decipher.setAuthTag(authTag);
    
    try {
      // 解密数据
      const decrypted = Buffer.concat([
        decipher.update(encryptedPayload),
        decipher.final(),
      ]);
      
      return decrypted.toString('utf-8');
    } catch (error) {
      throw new Error(
        'Decryption failed: ' + 
        (error instanceof Error ? error.message : String(error))
      );
    }
  }
  
  /**
   * 校验数据完整性
   * 
   * @param plaintext - 原始数据
   * @param encrypted - 加密对象
   * @returns 是否匹配
   */
  verifyChecksum(plaintext: string, encrypted: EncryptedData): boolean {
    const expected = this.calculateChecksum(Buffer.from(plaintext, 'utf-8'));
    return expected === encrypted.metadata?.checksum;
  }
  
  /**
   * 计算数据校验和 (SHA-256)
   */
  private calculateChecksum(data: Buffer): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  // ========== 流式加密 (大文件) ==========
  
  /**
   * 创建加密流
   * 
   * 用于加密大文件，避免一次性加载整个文件到内存
   * 
   * @returns 加密流转换
   * 
   * @example
   * fs.createReadStream('large-file.json')
   *   .pipe(encryptionService.createEncryptStream())
   *   .pipe(fs.createWriteStream('large-file.encrypted'))
   */
  createEncryptStream(): {
    transform: NodeJS.Transform;
    getMetadata: () => EncryptedData;
  } {
    const iv = crypto.randomBytes(EncryptionService.IV_SIZE);
    const cipher = crypto.createCipheriv(
      EncryptionService.ALGORITHM,
      this.currentKey,
      iv
    );
    
    let totalSize = 0;
    let checksum = crypto.createHash('sha256');
    
    const transform = crypto.createTransform({
      transform(chunk: Buffer, encoding: string, callback: Function) {
        totalSize += chunk.length;
        checksum.update(chunk);
        callback(null, cipher.update(chunk));
      },
      flush(callback: Function) {
        callback(null, cipher.final());
      },
    });
    
    return {
      transform,
      getMetadata: () => ({
        encryptedPayload: '', // 流式加密，负载由流提供
        iv: iv.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
        algorithm: 'AES-256-GCM',
        keyVersion: this.keyVersion,
        metadata: {
          originalSize: totalSize,
          timestamp: Date.now(),
          checksum: checksum.digest('hex'),
        },
      }),
    };
  }
  
  /**
   * 创建解密流
   * 
   * @param encrypted - 加密元数据
   */
  createDecryptStream(encrypted: EncryptedData): NodeJS.Transform {
    const key = this.keyHistory.get(encrypted.keyVersion);
    if (!key) {
      throw new Error(`Key version ${encrypted.keyVersion} not found`);
    }
    
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');
    
    const decipher = crypto.createDecipheriv(
      EncryptionService.ALGORITHM,
      key,
      iv
    );
    decipher.setAuthTag(authTag);
    
    return decipher;
  }
  
  // ========== 清理 ==========
  
  /**
   * 清理所有密钥 (应用关闭时调用)
   * 
   * 防止内存中残留密钥信息
   */
  destroy(): void {
    // 清理缓冲区
    this.currentKey.fill(0);
    
    for (const [, key] of this.keyHistory) {
      key.fill(0);
    }
    
    this.keyHistory.clear();
  }
}

// ========== 类型定义 ==========

export interface KeyDerivationParams {
  /** PBKDF2 迭代次数 */
  iterations: number;
  
  /** 哈希函数 */
  hash: string;
  
  /** Base64 编码的盐值 */
  salt: string;
}

export interface EncryptedData {
  /** Base64 编码的加密内容 */
  encryptedPayload: string;
  
  /** Base64 编码的初始向量 */
  iv: string;
  
  /** Base64 编码的认证标签 */
  authTag: string;
  
  /** 加密算法 */
  algorithm: 'AES-256-GCM';
  
  /** 密钥版本 */
  keyVersion: number;
  
  /** 元数据 */
  metadata?: {
    /** 原始数据大小 */
    originalSize: number;
    
    /** 加密时间戳 */
    timestamp: number;
    
    /** SHA-256 校验和 */
    checksum?: string;
  };
}
```

### 与 SyncAdapter 的集成

```typescript
// packages/infrastructure-client/src/adapters/BaseAdapter.ts

import { ISyncAdapter, AdapterCredentials, EncryptedSyncData } from '@packages/application-client';
import { EncryptionService } from '../encryption/EncryptionService';

/**
 * 基础适配器 - 提供加密集成
 * 
 * 所有具体适配器都应继承此类
 */
export abstract class BaseAdapter implements ISyncAdapter {
  protected encryptionService: EncryptionService;
  protected credentials: AdapterCredentials;
  
  constructor(credentials: AdapterCredentials) {
    this.credentials = credentials;
    
    // 初始化加密服务
    // 密钥派生使用用户密码作为主密钥
    this.encryptionService = new EncryptionService(credentials.encryptionKey);
  }
  
  /**
   * 使用加密服务对数据进行加密
   */
  protected async encryptData(plaintext: string | Buffer): Promise<EncryptedSyncData> {
    const encrypted = this.encryptionService.encrypt(plaintext);
    
    return {
      encryptedPayload: encrypted.encryptedPayload,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      algorithm: encrypted.algorithm,
      metadata: encrypted.metadata,
    };
  }
  
  /**
   * 使用加密服务对数据进行解密
   */
  protected async decryptData(encryptedData: EncryptedSyncData): Promise<string> {
    return this.encryptionService.decrypt(encryptedData as any);
  }
  
  /**
   * 销毁加密服务 (清理密钥)
   */
  async disconnect(): Promise<void> {
    this.encryptionService.destroy();
    await this.cleanup();
  }
  
  protected abstract cleanup(): Promise<void>;
}
```

---

## 📁 文件变更清单

### 新增文件

```
packages/infrastructure-client/src/encryption/
├── EncryptionService.ts
├── index.ts
└── types.ts

packages/infrastructure-client/src/adapters/
└── BaseAdapter.ts
```

### 修改文件

```
packages/infrastructure-client/package.json
  └── 添加依赖: crypto (Node.js 内置)
  └── 添加开发依赖: @types/node

packages/infrastructure-client/src/index.ts
  └── 导出 EncryptionService
```

---

## 🧪 测试要点

### 单元测试

- [ ] AES-256-GCM 加密/解密
- [ ] PBKDF2 密钥派生
- [ ] IV 随机性 (相同数据加密后不同)
- [ ] 认证标签验证 (篡改检测)
- [ ] 密钥轮换
- [ ] 错误处理 (错误的密钥、数据篡改等)

### 性能测试

- [ ] 加密 100KB 数据 < 50ms
- [ ] 加密 1MB 数据 < 100ms
- [ ] 解密性能
- [ ] 密钥派生性能 (PBKDF2 应该相对较慢，但可接受)

### 安全测试

- [ ] 随机 IV 确保相同明文产生不同密文
- [ ] 修改加密数据导致解密失败
- [ ] 修改 IV 或认证标签导致解密失败
- [ ] 密钥清理 (destroy 后无法访问)

### 集成测试

- [ ] 与 BaseAdapter 集成
- [ ] 支持流式加密
- [ ] 支持多密钥版本

---

## 🔐 安全建议

1. **密钥存储**:
   - 密钥仅在内存中存储
   - 应用关闭时调用 `destroy()` 清理
   - 不应持久化到磁盘 (除非使用系统密钥环)

2. **密码强度**:
   - 至少 12 个字符
   - 包含大小写字母、数字、特殊字符
   - 使用密码管理器

3. **盐值**:
   - 每个用户使用不同的盐值
   - 盐值可以安全存储 (不是密钥)
   - 最小 32 字节

4. **PBKDF2 参数**:
   - 迭代次数: 600,000 (OWASP 2023)
   - 哈希函数: SHA-256
   - 可根据设备性能调整

---

## 🚀 下一步

1. 实现 EncryptionService 单元测试
2. 实现 GitHubSyncAdapter (STORY-045) - 继承 BaseAdapter
3. 集成加密测试 (STORY-055)
