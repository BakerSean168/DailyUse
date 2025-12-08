/**
 * Sync Routes
 * 
 * EPIC-005: Backend Sync Service
 * 
 * HTTP 路由配置
 */

import { Router } from 'express';
import { SyncController } from './SyncController';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';

const router = Router();

// 所有同步 API 需要认证
router.use(authMiddleware);

// ========== Device Routes ==========
router.post('/device/register', SyncController.registerDevice);
router.get('/devices', SyncController.getDevices);
router.patch('/device/:deviceId', SyncController.updateDevice);
router.delete('/device/:deviceId', SyncController.deactivateDevice);

// ========== Sync Routes ==========
router.post('/push', SyncController.push);
router.post('/pull', SyncController.pull);

// ========== Conflict Routes ==========
router.get('/conflicts', SyncController.getConflicts);
router.post('/conflicts/:conflictId/resolve', SyncController.resolveConflict);

export default router;
