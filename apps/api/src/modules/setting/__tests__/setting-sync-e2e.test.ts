/**
 * Setting Module E2E 完整流程测试
 *
 * 测试完整的设置同步场景
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateUUID } from '@dailyuse/utils';
import { SettingCloudSyncService } from '../application/services/SettingCloudSyncService';

describe('🚀 E2E: Setting Sync Complete Flow', () => {
  let syncService: SettingCloudSyncService;
  let testAccountUuid: string;

  beforeAll(() => {
    syncService = new SettingCloudSyncService();
    testAccountUuid = generateUUID();
    console.log(`\n✅ 测试初始化，账户: ${testAccountUuid}\n`);
  });

  it('应该完成完整的设置同步流程', async () => {
    console.log('\n📝 第1步: 保存初始设置');
    
    const initialSettings = {
      theme: 'DARK',
      fontSize: 'MEDIUM',
      accentColor: '#5B5BFF',
    };

    const version1 = await syncService.saveSettingVersion(
      testAccountUuid,
      'phone',
      'My iPhone',
      initialSettings
    );
    expect(version1).toBeDefined();
    console.log(`  ✓ 初始版本已保存: v${version1.version}`);

    console.log('\n📝 第2步: 修改设置');
    const updatedSettings = { theme: 'LIGHT', fontSize: 'LARGE' };
    const version2 = await syncService.saveSettingVersion(
      testAccountUuid,
      'phone',
      'My iPhone',
      updatedSettings
    );
    expect(version2.version).toBeGreaterThan(version1.version);
    console.log(`  ✓ 修改版本已保存: v${version2.version}`);

    console.log('\n📝 第3步: 查询版本历史');
    const history = await syncService.getSettingHistory(testAccountUuid);
    expect(history.length).toBeGreaterThanOrEqual(2);
    console.log(`  ✓ 获取 ${history.length} 个版本`);

    console.log('\n📝 第4步: 恢复旧版本');
    const restored = await syncService.restoreSettingVersion(
      testAccountUuid,
      version1.uuid
    );
    expect(restored?.settingSnapshot).toEqual(initialSettings);
    console.log(`  ✓ 成功恢复到 v${restored?.version}`);

    console.log('\n📝 第5步: 冲突解决');
    const resolved = await syncService.resolveConflict(
      testAccountUuid,
      { theme: 'DARK' },
      { theme: 'LIGHT' },
      'merge'
    );
    expect(resolved).toBeDefined();
    console.log(`  ✓ 冲突已解决`);

    console.log('\n📝 第6步: 同步状态');
    const status = await syncService.getSyncStatus(testAccountUuid);
    expect(status.totalVersions).toBeGreaterThan(0);
    console.log(`  ✓ 版本总数: ${status.totalVersions}`);

    console.log('\n✅ E2E 流程完成\n');
  });
});
