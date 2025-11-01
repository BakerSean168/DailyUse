/**
 * 测试用户数据库初始化脚本
 * 用于在测试数据库中插入固定的测试用户
 * 
 * 运行方式:
 *   pnpm tsx tools/test/seed-test-user.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * 测试用户配置
 */
const TEST_USERS = [
  {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'Test123456!',
    displayName: 'Test User',
    role: 'USER' as const,
  },
  {
    username: 'testuser2',
    email: 'testuser2@example.com',
    password: 'Test123456!',
    displayName: 'Test User 2',
    role: 'USER' as const,
  },
  {
    username: 'admintest',
    email: 'admintest@example.com',
    password: 'Admin123456!',
    displayName: 'Admin Test User',
    role: 'ADMIN' as const,
  },
];

/**
 * 创建或更新测试用户
 */
async function seedTestUser(userData: typeof TEST_USERS[0]) {
  console.log(`\n📝 处理测试用户: ${userData.username}`);

  // 检查用户是否已存在
  const existingAccount = await prisma.account.findFirst({
    where: {
      OR: [
        { username: userData.username },
        { email: userData.email },
      ],
    },
  });

  if (existingAccount) {
    console.log(`  ✅ 用户已存在: ${userData.username} (UUID: ${existingAccount.uuid})`);
    
    // 更新密码（如果需要）
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const now = Date.now();
    const passwordCredentialUuid = randomUUID();
    
    // 查找并更新认证凭证
    const credential = await prisma.authCredential.findFirst({
      where: { accountUuid: existingAccount.uuid },
    });

    if (credential) {
      // 构造新的 PasswordCredential 数据结构
      const passwordCredentialDTO = {
        uuid: passwordCredentialUuid,
        credential_uuid: credential.uuid,
        hashed_password: hashedPassword,
        salt: '', // bcrypt 自带 salt
        algorithm: 'BCRYPT',
        iterations: null,
        status: 'ACTIVE',
        failedAttempts: 0,
        last_changed_at: now,
        createdAt: now,
        updatedAt: now,
      };

      // 解析现有的 data 字段
      const existingData = JSON.parse(credential.data);
      
      // 更新 password_credential
      existingData.password_credential = passwordCredentialDTO;
      
      // 保存更新
      await prisma.authCredential.update({
        where: { uuid: credential.uuid },
        data: {
          data: JSON.stringify(existingData),
          updatedAt: new Date(now),
        },
      });
      
      console.log(`  🔄 密码已更新`);
    }

    return existingAccount;
  }

  // 创建新用户
  console.log(`  ➕ 创建新用户: ${userData.username}`);

  // 1. 生成密码哈希
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const now = Date.now();
  
  const accountUuid = randomUUID();
  const credentialUuid = randomUUID();
  const passwordCredentialUuid = randomUUID();

  // 2. 构造 PasswordCredential PersistenceDTO
  const passwordCredentialDTO = {
    uuid: passwordCredentialUuid,
    credential_uuid: credentialUuid,
    hashed_password: hashedPassword,
    salt: '', // bcrypt 自带 salt
    algorithm: 'BCRYPT',
    iterations: null,
    status: 'ACTIVE',
    failedAttempts: 0,
    last_changed_at: now,
    createdAt: now,
    updatedAt: now,
  };

  // 3. 使用事务创建 Account 和 AuthCredential
  const result = await prisma.$transaction(async (tx) => {
    // 创建 Account
    const account = await tx.account.create({
      data: {
        uuid: accountUuid,
        username: userData.username,
        email: userData.email,
        emailVerified: true, // 测试用户默认验证
        status: 'ACTIVE',
        profile: JSON.stringify({
          displayName: userData.displayName,
          firstName: userData.displayName.split(' ')[0] || userData.displayName,
          lastName: userData.displayName.split(' ')[1] || '',
          avatar: null,
          bio: null,
          dateOfBirth: null,
        }),
        preferences: JSON.stringify({
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
          },
        }),
        subscription: null,
        storage: JSON.stringify({
          used: 0,
          limit: 1073741824, // 1GB
          files: 0,
        }),
        security: JSON.stringify({
          twoFactorEnabled: false,
          lastPasswordChange: now,
          passwordExpiresAt: null,
          loginAttempts: 0,
        }),
        history: '[]',
        stats: JSON.stringify({
          loginCount: 0,
          lastLoginAt: null,
          activeMinutes: 0,
        }),
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    });

    // 创建 AuthCredential（使用 JSON 字段）
    await tx.authCredential.create({
      data: {
        uuid: credentialUuid,
        accountUuid: accountUuid,
        type: 'PASSWORD',
        data: JSON.stringify({
          password_credential: passwordCredentialDTO,
          api_key_credentials: [],
          remember_me_tokens: [],
          two_factor: null,
          biometric: null,
        }),
        metadata: JSON.stringify({
          status: 'ACTIVE',
          security: {
            requirePasswordChange: false,
            passwordExpiresAt: null,
            maxFailedAttempts: 5,
          },
        }),
        history: '[]',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    });

    return account;
  });

  console.log(`  ✅ 创建成功: ${userData.username} (UUID: ${result.uuid})`);
  return result;
}

/**
 * 主函数
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           测试用户数据库初始化脚本                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 创建所有测试用户
    for (const user of TEST_USERS) {
      await seedTestUser(user);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ 所有测试用户已就绪                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\n📋 可用的测试用户:');
    for (const user of TEST_USERS) {
      console.log(`  - Username: ${user.username}`);
      console.log(`    Password: ${user.password}`);
      console.log(`    Email:    ${user.email}\n`);
    }

  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行脚本
main();
