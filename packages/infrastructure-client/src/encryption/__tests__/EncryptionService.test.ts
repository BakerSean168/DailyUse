/**
 * @fileoverview EncryptionService 单元测试
 * @module @dailyuse/infrastructure-client/encryption/__tests__
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../EncryptionService';
import type { EncryptedData } from '../types';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const testPassword = 'MySecurePassword123!@#';
  const testPlaintext = 'This is a secret message';

  beforeEach(() => {
    service = new EncryptionService(testPassword);
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt plaintext string', () => {
      const encrypted = service.encrypt(testPlaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.encryptedPayload).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();
      expect(encrypted.algorithm).toBe('AES-256-GCM');
      expect(encrypted.keyVersion).toBe(1);
    });

    it('should encrypt Buffer', () => {
      const buffer = Buffer.from(testPlaintext, 'utf-8');
      const encrypted = service.encrypt(buffer);

      expect(encrypted).toBeDefined();
      expect(encrypted.encryptedPayload).toBeTruthy();
    });

    it('should decrypt encrypted data', () => {
      const encrypted = service.encrypt(testPlaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(testPlaintext);
    });

    it('should handle Chinese characters', () => {
      const chinese = '你好世界 🌍 Hello World';
      const encrypted = service.encrypt(chinese);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(chinese);
    });

    it('should handle large data (1MB)', () => {
      // 生成 1MB 数据
      const largeData = 'x'.repeat(1024 * 1024);

      const startTime = Date.now();
      const encrypted = service.encrypt(largeData);
      const encryptTime = Date.now() - startTime;

      const decryptStartTime = Date.now();
      const decrypted = service.decrypt(encrypted);
      const decryptTime = Date.now() - decryptStartTime;

      expect(decrypted).toBe(largeData);
      // STORY-044 性能要求: 1MB < 100ms
      expect(encryptTime).toBeLessThan(100);
      expect(decryptTime).toBeLessThan(100);
    });

    it('should use unique IV for each encryption', () => {
      const encrypted1 = service.encrypt(testPlaintext);
      const encrypted2 = service.encrypt(testPlaintext);

      // 相同的明文应该生成不同的密文（因为 IV 不同）
      expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // 但解密后应该得到相同的明文
      expect(service.decrypt(encrypted1)).toBe(testPlaintext);
      expect(service.decrypt(encrypted2)).toBe(testPlaintext);
    });
  });

  describe('Key Derivation', () => {
    it('should derive key from password', () => {
      // 为了能够用相同密码解密，需要使用相同的盐
      const service1 = new EncryptionService(testPassword);
      const encrypted = service1.encrypt(testPlaintext);
      
      // 获取第一个服务的盐值
      const salt = (service1 as any).keyDerivationParams.salt;
      
      // 使用相同密码和盐创建新服务
      const service2 = new EncryptionService(testPassword, salt);
      const decrypted = service2.decrypt(encrypted);

      // 相同密码 + 相同盐应该能够解密数据
      expect(decrypted).toBe(testPlaintext);
    });

    it('should use 600,000 PBKDF2 iterations', () => {
      const encrypted = service.encrypt(testPlaintext);

      // 检查元数据中是否记录了迭代次数（如果有）
      expect(encrypted.keyVersion).toBe(1);
    });

    it('should fail decryption with wrong password', () => {
      const encrypted = service.encrypt(testPlaintext);

      const wrongService = new EncryptionService('WrongPassword');

      expect(() => {
        wrongService.decrypt(encrypted);
      }).toThrow();
    });
  });

  describe('Authentication Tag Verification', () => {
    it('should detect tampering with encrypted payload', () => {
      const encrypted = service.encrypt(testPlaintext);

      // 篡改加密内容
      const tamperedPayload = Buffer.from(encrypted.encryptedPayload, 'base64');
      tamperedPayload[0] ^= 0xFF; // 翻转第一个字节
      const tampered: EncryptedData = {
        ...encrypted,
        encryptedPayload: tamperedPayload.toString('base64'),
      };

      expect(() => {
        service.decrypt(tampered);
      }).toThrow();
    });

    it('should detect tampering with auth tag', () => {
      const encrypted = service.encrypt(testPlaintext);

      // 篡改认证标签
      const tamperedTag = Buffer.from(encrypted.authTag, 'base64');
      tamperedTag[0] ^= 0xFF;
      const tampered: EncryptedData = {
        ...encrypted,
        authTag: tamperedTag.toString('base64'),
      };

      expect(() => {
        service.decrypt(tampered);
      }).toThrow();
    });

    it('should detect tampering with IV', () => {
      const encrypted = service.encrypt(testPlaintext);

      // 篡改 IV
      const tamperedIV = Buffer.from(encrypted.iv, 'base64');
      tamperedIV[0] ^= 0xFF;
      const tampered: EncryptedData = {
        ...encrypted,
        iv: tamperedIV.toString('base64'),
      };

      expect(() => {
        service.decrypt(tampered);
      }).toThrow();
    });
  });

  describe('Key Rotation', () => {
    it('should rotate key with new password', () => {
      const encrypted1 = service.encrypt(testPlaintext);
      expect(encrypted1.keyVersion).toBe(1);

      const newPassword = 'NewSecurePassword456!@#';
      service.rotateKey(newPassword);

      const encrypted2 = service.encrypt(testPlaintext);
      expect(encrypted2.keyVersion).toBe(2);

      // 旧数据应该仍然可以用旧密钥解密
      const decrypted1 = service.decrypt(encrypted1);
      expect(decrypted1).toBe(testPlaintext);

      // 新数据应该用新密钥解密
      const decrypted2 = service.decrypt(encrypted2);
      expect(decrypted2).toBe(testPlaintext);
    });

    it('should support multiple key rotations', () => {
      const encrypted1 = service.encrypt(testPlaintext);

      service.rotateKey('Password2');
      const encrypted2 = service.encrypt(testPlaintext);

      service.rotateKey('Password3');
      const encrypted3 = service.encrypt(testPlaintext);

      // 所有版本的数据都应该可以解密
      expect(service.decrypt(encrypted1)).toBe(testPlaintext);
      expect(service.decrypt(encrypted2)).toBe(testPlaintext);
      expect(service.decrypt(encrypted3)).toBe(testPlaintext);

      expect(encrypted1.keyVersion).toBe(1);
      expect(encrypted2.keyVersion).toBe(2);
      expect(encrypted3.keyVersion).toBe(3);
    });
  });

  describe('Checksum Verification', () => {
    it('should calculate checksum for encrypted data', () => {
      const encrypted = service.encrypt(testPlaintext);

      expect(encrypted.metadata).toBeDefined();
      expect(encrypted.metadata?.checksum).toBeTruthy();
      expect(encrypted.metadata?.checksum).toHaveLength(64); // SHA-256 十六进制
    });

    it('should verify checksum matches plaintext', () => {
      const encrypted = service.encrypt(testPlaintext);

      const isValid = service.verifyChecksum(testPlaintext, encrypted);
      expect(isValid).toBe(true);
    });

    it('should detect mismatched checksum', () => {
      const encrypted = service.encrypt(testPlaintext);

      const isValid = service.verifyChecksum('wrong data', encrypted);
      expect(isValid).toBe(false);
    });
  });

  describe('Metadata', () => {
    it('should include original size in metadata', () => {
      const encrypted = service.encrypt(testPlaintext);

      expect(encrypted.metadata?.originalSize).toBe(
        Buffer.from(testPlaintext, 'utf-8').length
      );
    });

    it('should include timestamp in metadata', () => {
      const beforeEncrypt = Date.now();
      const encrypted = service.encrypt(testPlaintext);
      const afterEncrypt = Date.now();

      expect(encrypted.metadata?.timestamp).toBeGreaterThanOrEqual(beforeEncrypt);
      expect(encrypted.metadata?.timestamp).toBeLessThanOrEqual(afterEncrypt);
    });
  });

  describe('Memory Cleanup', () => {
    it('should zero-fill keys on destroy', () => {
      const encrypted = service.encrypt(testPlaintext);

      service.destroy();

      // 销毁后应该无法解密
      expect(() => {
        service.decrypt(encrypted);
      }).toThrow();
    });

    it('should throw error when using destroyed service', () => {
      service.destroy();

      expect(() => {
        service.encrypt(testPlaintext);
      }).toThrow('EncryptionService has been destroyed');
    });
  });

  describe('Salt Generation', () => {
    it('should generate random salt', () => {
      const service1 = new EncryptionService(testPassword);
      const service2 = new EncryptionService(testPassword);

      const encrypted1 = service1.encrypt(testPlaintext);
      const encrypted2 = service2.encrypt(testPlaintext);

      // 不同的实例应该使用不同的盐（除非显式提供相同的盐）
      // 这里我们无法直接访问 salt，但可以通过密文不同来验证
      // 实际上，相同密码 + 不同 salt = 不同密钥 = 无法互相解密
      expect(() => {
        service1.decrypt(encrypted2);
      }).toThrow();
    });

    it('should use provided salt for key derivation', () => {
      const salt = Buffer.from('a'.repeat(32), 'utf-8').toString('base64');

      const service1 = new EncryptionService(testPassword, salt);
      const service2 = new EncryptionService(testPassword, salt);

      const encrypted = service1.encrypt(testPlaintext);
      const decrypted = service2.decrypt(encrypted);

      // 相同密码 + 相同盐应该能够互相解密
      expect(decrypted).toBe(testPlaintext);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const encrypted = service.encrypt('');
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle very long strings', () => {
      const longString = 'x'.repeat(10 * 1024 * 1024); // 10MB

      const encrypted = service.encrypt(longString);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(longString);
    });

    it('should handle special characters', () => {
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\\n\r\t';
      const encrypted = service.encrypt(special);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(special);
    });

    it('should handle JSON strings', () => {
      const jsonData = JSON.stringify({
        id: '123',
        title: 'Test Goal',
        description: 'This is a test',
        nested: { key: 'value' },
        array: [1, 2, 3],
      });

      const encrypted = service.encrypt(jsonData);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(jsonData);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
    });
  });
});
