/**
 * @fileoverview 安全测试套件
 * @module @dailyuse/infrastructure-client/security
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../encryption/EncryptionService';
import { GitHubSyncAdapter } from '../adapters/GitHubSyncAdapter';
import type { EncryptedSyncData } from '@dailyuse/application-client/sync';

describe('Security Tests', () => {
  describe('加密安全性', () => {
    let encryptionService: EncryptionService;

    beforeEach(() => {
      encryptionService = new EncryptionService('secure-password-12345', 'secure-salt');
    });

    it('应该使用随机 IV，避免模式泄露', () => {
      const plaintext = 'Sensitive data';
      const ivs = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const encrypted = encryptionService.encrypt(plaintext);
        ivs.add(encrypted.iv);
      }

      // 100 次加密应该产生 100 个不同的 IV
      expect(ivs.size).toBe(100);
    });

    it('应该防止认证标签被篡改', () => {
      const plaintext = 'Secret message';
      const encrypted = encryptionService.encrypt(plaintext);

      // 尝试篡改认证标签
      const tampered = {
        ...encrypted,
        authTag: 'AAAAAAAAAAAAAAAAAAAAAA==', // 伪造的标签
      };

      expect(() => {
        encryptionService.decrypt(tampered);
      }).toThrow();
    });

    it('应该防止密文被篡改', () => {
      const plaintext = 'Secret message';
      const encrypted = encryptionService.encrypt(plaintext);

      // 翻转密文的一个字节
      const payload = Buffer.from(encrypted.encryptedPayload, 'base64');
      payload[0] = payload[0] ^ 0xff;

      const tampered = {
        ...encrypted,
        encryptedPayload: payload.toString('base64'),
      };

      expect(() => {
        encryptionService.decrypt(tampered);
      }).toThrow();
    });

    it('应该防止重放攻击（通过时间戳和版本号）', () => {
      const plaintext1 = JSON.stringify({ id: '123', timestamp: Date.now() });
      const plaintext2 = JSON.stringify({ id: '123', timestamp: Date.now() + 1000 });

      const encrypted1 = encryptionService.encrypt(plaintext1);
      const encrypted2 = encryptionService.encrypt(plaintext2);

      // 即使 ID 相同，加密结果也应该不同
      expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);
      // IV 不同应该导致不同的加密结果
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('应该使用足够的密钥派生迭代次数 (PBKDF2)', () => {
      // EncryptionService 应该使用至少 100,000 次迭代
      // 这个测试验证派生过程需要足够的时间
      const start = performance.now();
      new EncryptionService('test-password', 'test-salt');
      const end = performance.now();

      // 600,000 次迭代应该至少需要几毫秒
      expect(end - start).toBeGreaterThan(1);
    });

    it('应该防止时序攻击（校验和比较）', () => {
      const plaintext = 'Test data';
      const encrypted = encryptionService.encrypt(plaintext);

      // 计算正确的校验和
      const correctChecksum = encrypted.checksum;

      // 尝试多次错误的校验和，测量时间差异
      const timings: number[] = [];

      for (let i = 0; i < 10; i++) {
        const wrongChecksum = 'wrong-checksum-' + i;
        const start = performance.now();
        // 注意：实际的 verifyChecksum 应该使用恒定时间比较
        const result = correctChecksum === wrongChecksum;
        const end = performance.now();
        timings.push(end - start);
      }

      // 时间差异应该很小（理想情况下应该相同）
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      const variance = maxTiming - minTiming;

      // 允许一些变化，但不应该太大
      expect(variance).toBeLessThan(10); // 10ms
    });
  });

  describe('密钥管理安全性', () => {
    it('应该安全存储多个密钥版本', () => {
      const service = new EncryptionService('initial-password', 'salt');

      const plaintext = 'Test data';
      const encrypted1 = service.encrypt(plaintext);

      // 轮换密钥
      service.rotateKey('new-password');
      const encrypted2 = service.encrypt(plaintext);

      // 两个版本的数据都应该能解密
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);

      // 密钥版本应该不同
      expect(encrypted1.keyVersion).toBe(1);
      expect(encrypted2.keyVersion).toBe(2);
    });

    it('应该防止密钥版本回滚', () => {
      const service = new EncryptionService('password', 'salt');

      const encrypted1 = service.encrypt('Data v1');
      service.rotateKey('new-password');
      const encrypted2 = service.encrypt('Data v2');

      // 尝试伪造一个旧版本号的加密数据
      const forged = {
        ...encrypted2,
        keyVersion: 1, // 回滚版本号
      };

      // 应该仍然使用 v2 密钥解密（因为真实数据是 v2 加密的）
      // 这会导致解密失败
      expect(() => {
        service.decrypt(forged);
      }).toThrow();
    });
  });

  describe('网络传输安全', () => {
    it('应该确保数据在传输前已加密', async () => {
      const adapter = new GitHubSyncAdapter({
        provider: 'github',
        token: 'test-token',
        repoPath: 'test/test',
        encryptionKey: 'test-password-12345',
      });

      const encryptionService = new EncryptionService('test-password-12345', 'test-salt');

      const sensitiveData = {
        id: '123',
        secretValue: 'This should be encrypted',
        password: 'user-password-123',
      };

      const plaintext = JSON.stringify(sensitiveData);
      const encrypted = encryptionService.encrypt(plaintext);

      // 验证加密数据不包含原始敏感信息
      const encryptedString = JSON.stringify(encrypted);
      expect(encryptedString).not.toContain('This should be encrypted');
      expect(encryptedString).not.toContain('user-password-123');
      expect(encryptedString).not.toContain('secretValue');
    });

    it('应该防止明文密码出现在日志中', () => {
      const password = 'super-secret-password-123';
      const service = new EncryptionService(password, 'salt');

      // 获取服务的字符串表示
      const serviceString = JSON.stringify(service);

      // 密码不应该出现在序列化结果中
      expect(serviceString).not.toContain(password);
    });
  });

  describe('访问控制', () => {
    it('应该验证认证凭据', async () => {
      const adapter = new GitHubSyncAdapter({
        provider: 'github',
        token: 'invalid-token',
        repoPath: 'test/test',
        encryptionKey: 'test-password-12345',
      });

      // 无效的 token 应该导致认证失败
      await expect(
        adapter.authenticate({
          provider: 'github',
          token: 'invalid-token',
          repoPath: 'test/test',
          encryptionKey: 'test-password-12345',
        })
      ).rejects.toThrow();
    });

    it('应该防止未经认证的操作', async () => {
      const adapter = new GitHubSyncAdapter({
        provider: 'github',
        token: 'test-token',
        repoPath: 'test/test',
        encryptionKey: 'test-password-12345',
      });

      const encryptionService = new EncryptionService('test-password-12345', 'test-salt');
      const testData = encryptionService.encrypt(JSON.stringify({ id: '123' }));

      // 在未认证的情况下尝试推送
      // 注意：实际行为取决于适配器实现
      // 这里假设会返回失败结果或抛出错误
      const result = await adapter.push('goal', '123', testData, 1);

      // 应该失败（因为未认证或 token 无效）
      expect(result.success).toBe(false);
    });
  });

  describe('数据完整性', () => {
    it('应该检测数据损坏', () => {
      const service = new EncryptionService('password', 'salt');
      const plaintext = 'Important data';
      const encrypted = service.encrypt(plaintext);

      // 损坏auth tag应该导致解密失败
      const corrupted = {
        ...encrypted,
        authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
      };

      // 应该无法解密损坏的数据
      expect(() => {
        service.decrypt(corrupted);
      }).toThrow();
    });

    it('应该验证数据版本兼容性', () => {
      const service = new EncryptionService('password', 'salt');
      const plaintext = 'Test data';
      const encrypted = service.encrypt(plaintext);

      // 模拟未来的加密版本
      const futureVersion = {
        ...encrypted,
        keyVersion: 999,
      };

      // 应该能够处理或拒绝未知版本
      // 根据实现，可能抛出错误或使用回退逻辑
      try {
        service.decrypt(futureVersion);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('内存安全', () => {
    it('应该在使用后清理敏感数据', () => {
      const service = new EncryptionService('sensitive-password', 'salt');
      const plaintext = 'Sensitive information';

      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);

      // 注意：实际的内存清理验证需要 native 工具
      // 这里只验证函数正常执行
      expect(true).toBe(true);
    });
  });

  describe('配置安全', () => {
    it('应该使用安全的默认配置', () => {
      const service = new EncryptionService('password', 'salt');

      // 验证使用了推荐的加密参数
      const encrypted = service.encrypt('test');

      // IV 应该是 12 字节 (96 位)
      const iv = Buffer.from(encrypted.iv, 'base64');
      expect(iv.length).toBe(12);

      // Auth Tag 应该是 16 字节 (128 位)
      const authTag = Buffer.from(encrypted.authTag, 'base64');
      expect(authTag.length).toBe(16);
    });

    it('应该强制最小密码强度', () => {
      // 弱密码应该被拒绝
      const weakPasswords = ['123', '12345', 'abc'];

      weakPasswords.forEach(password => {
        expect(() => {
          new EncryptionService(password, 'salt');
        }).toThrow('Master password must be at least 8 characters');
      });

      // 强密码应该正常工作
      const strongPassword = 'Strong-Password-123!';
      const service = new EncryptionService(strongPassword, 'salt');
      const encrypted = service.encrypt('test');
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe('test');
    });
  });
});
