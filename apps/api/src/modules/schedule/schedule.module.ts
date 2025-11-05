/**
 * Schedule Module - NestJS 模块定义
 * 
 * 职责：
 * - 注册 Schedule 模块的所有 providers
 * - 导出公开的服务供其他模块使用
 * - 管理模块依赖关系
 */

import { Module } from '@nestjs/common';
import { ScheduleExecutionService } from './application/services/ScheduleExecutionService';
import { ScheduleTaskController } from './interface/http/controllers/ScheduleTaskController';
import { ScheduleStatisticsController } from './interface/http/controllers/ScheduleStatisticsController';

@Module({
  controllers: [
    ScheduleTaskController,
    ScheduleStatisticsController,
  ],
  providers: [
    ScheduleExecutionService, // 执行引擎服务
  ],
  exports: [
    ScheduleExecutionService, // 导出供其他模块使用
  ],
})
export class ScheduleModule {}
