/**
 * @fileoverview 加密服务类型定义
 * @module @dailyuse/infrastructure-client/encryption
 */

/**
 * 密钥派生参数
 */
export interface KeyDerivationParams {
  /** PBKDF2 迭代次数 */
  iterations: number;
  
  /** 哈希函数 (sha256, sha512) */
  hash: string;
  
  /** Base64 编码的盐值 */
  salt: string;
}

/**
 * 加密后的数据
 */
export interface EncryptedData {
  /** Base64 编码的加密内容 */
  encryptedPayload: string;
  
  /** Base64 编码的初始向量 (IV) */
  iv: string;
  
  /** Base64 编码的认证标签 (GCM mode) */
  authTag: string;
  
  /** 加密算法 */
  algorithm: 'AES-256-GCM';
  
  /** 密钥版本 (支持密钥轮换) */
  keyVersion: number;
  
  /** 可选的元数据 */
  metadata?: {
    /** 原始数据大小 (字节) */
    originalSize: number;
    
    /** 加密时间戳 (毫秒) */
    timestamp: number;
    
    /** SHA-256 校验和 (十六进制) */
    checksum?: string;
  };
}
