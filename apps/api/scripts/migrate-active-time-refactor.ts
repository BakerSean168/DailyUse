/**
 * ActiveTime 重构数据迁移脚本
 * 
 * 将 { startDate, endDate } 转换为 { activatedAt }
 * - activatedAt = startDate（保持原有激活时间）
 * - 移除 endDate 字段
 * - status 字段已经存在，无需处理
 * 
 * 执行方式：
 * pnpm tsx apps/api/scripts/migrate-active-time-refactor.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OldActiveTime {
  startDate: number;
  endDate?: number | null;
}

interface NewActiveTime {
  activatedAt: number;
}

async function migrateActiveTime(dryRun = false) {
  console.log(`🚀 开始 ActiveTime 重构迁移 (${dryRun ? '预演模式' : '实际执行'})`);
  console.log('');

  try {
    // 1. 查询所有 reminder_templates
    const templates = await prisma.reminderTemplate.findMany({
      select: {
        uuid: true,
        title: true,
        activeTime: true,
      },
    });

    console.log(`📊 找到 ${templates.length} 个提醒模板`);
    console.log('');

    if (templates.length === 0) {
      console.log('✅ 没有数据需要迁移');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ uuid: string; title: string; error: string }> = [];

    // 2. 逐个转换
    for (const template of templates) {
      try {
        // 解析旧格式
        const oldActiveTime: OldActiveTime = JSON.parse(template.activeTime);

        // 验证数据结构
        if (typeof oldActiveTime.startDate !== 'number') {
          throw new Error(`无效的 startDate: ${oldActiveTime.startDate}`);
        }

        // 转换为新格式
        const newActiveTime: NewActiveTime = {
          activatedAt: oldActiveTime.startDate,
        };

        // 日志
        console.log(`🔄 [${template.uuid}] ${template.title}`);
        console.log(`   旧: { startDate: ${new Date(oldActiveTime.startDate).toLocaleString()}, endDate: ${oldActiveTime.endDate ? new Date(oldActiveTime.endDate).toLocaleString() : 'null'} }`);
        console.log(`   新: { activatedAt: ${new Date(newActiveTime.activatedAt).toLocaleString()} }`);

        if (!dryRun) {
          // 执行更新
          await prisma.reminderTemplate.update({
            where: { uuid: template.uuid },
            data: {
              activeTime: JSON.stringify(newActiveTime),
              updatedAt: new Date(),
            },
          });
        }

        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          uuid: template.uuid,
          title: template.title,
          error: errorMessage,
        });
        console.error(`❌ [${template.uuid}] 错误: ${errorMessage}`);
      }

      console.log('');
    }

    // 3. 统计结果
    console.log('═══════════════════════════════════════');
    console.log('📈 迁移结果统计');
    console.log('───────────────────────────────────────');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${errorCount}`);
    console.log(`📊 总计: ${templates.length}`);
    console.log('═══════════════════════════════════════');

    if (errors.length > 0) {
      console.log('');
      console.log('❌ 错误详情:');
      errors.forEach(({ uuid, title, error }) => {
        console.log(`   [${uuid}] ${title}`);
        console.log(`   错误: ${error}`);
        console.log('');
      });
    }

    if (dryRun) {
      console.log('');
      console.log('ℹ️  这是预演模式，未实际修改数据');
      console.log('ℹ️  移除 --dry-run 参数以执行实际迁移');
    } else {
      console.log('');
      console.log('✅ 迁移完成！');
    }
  } catch (error) {
    console.error('💥 迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  await migrateActiveTime(dryRun);
}

main().catch((error) => {
  console.error('💥 执行失败:', error);
  process.exit(1);
});
