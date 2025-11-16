#!/bin/bash

# Task Instance 混合同步方案 - 测试脚本
# 用于验证完整的事件驱动流程

echo "🧪 =========================================="
echo "🧪 Task Instance 混合同步方案 - 集成测试"
echo "🧪 =========================================="
echo ""

# 检查服务是否运行
echo "📍 1. 检查服务状态..."
API_STATUS=$(curl -s http://localhost:3888/api/v1/health 2>/dev/null | grep -o '"status":"ok"')
WEB_STATUS=$(curl -s http://localhost:5173 2>/dev/null | grep -o "html")

if [ -z "$API_STATUS" ]; then
  echo "❌ API 服务未运行（http://localhost:3888）"
  echo "   请运行: pnpm --filter @dailyuse/api dev"
  exit 1
else
  echo "✅ API 服务运行中"
fi

if [ -z "$WEB_STATUS" ]; then
  echo "❌ Web 服务未运行（http://localhost:5173）"
  echo "   请运行: pnpm --filter @dailyuse/web dev"
  exit 1
else
  echo "✅ Web 服务运行中"
fi

echo ""
echo "📍 2. 测试流程说明"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔹 步骤 1：登录系统"
echo "🔹 步骤 2：创建循环任务（生成 100+ 实例）"
echo "🔹 步骤 3：观察后端日志"
echo "🔹 步骤 4：观察前端日志"
echo "🔹 步骤 5：验证 Dashboard 显示"
echo ""

echo "📍 3. 预期后端日志"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
✅ TaskEventHandler 已初始化
📦 [TaskInstanceGenerationService] 为模板 "xxx" 生成了 101 个实例
📤 [TaskInstanceGenerationService] 大数据量（101个），只推送摘要
📤 [CrossPlatformEventBus] 发送事件: task.instances.generated
🔔 [TaskEventHandler] Task instances generated
  strategy: summary
  instanceCount: 101
📤 [SSE推送] task:instances-generated 事件已发送
EOF

echo ""
echo "📍 4. 预期前端日志（浏览器控制台）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
✅ [Task] Task Instance 智能同步服务已启动
📦 [SSE Client] 任务实例生成事件: { strategy: 'summary', ... }
🔄 [TaskInstanceSyncService] 智能加载模式（摘要）
🚀 [P0] 立即加载今天的实例...
📥 [TaskInstanceSyncService] 加载实例: abc-123
✅ [TaskInstanceSyncService] 成功加载 1 个实例
📅 [P2] 其他日期将在用户切换时按需加载
🔄 [TaskInstanceSyncService] 开始处理预加载队列（1项）
📥 [TaskInstanceSyncService] 加载实例: abc-123
✅ [TaskInstanceSyncService] 成功加载 7 个实例
✅ [TaskInstanceSyncService] 预加载队列处理完成
EOF

echo ""
echo "📍 5. 验证步骤"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  打开浏览器：http://localhost:5173"
echo "2️⃣  打开开发者工具（F12）→ Console"
echo "3️⃣  登录系统"
echo "4️⃣  创建循环任务："
echo "    - 标题：测试任务"
echo "    - 类型：每日重复"
echo "    - 生成天数：100 天"
echo "5️⃣  观察控制台日志（应该看到上面的预期日志）"
echo "6️⃣  打开 Dashboard 页面（应该立即显示今天的任务）"
echo "7️⃣  打开 TaskInstanceManagement（切换日期应该无感）"
echo ""

echo "📍 6. 故障排查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❓ 如果前端没有收到 SSE 事件："
echo "   → 检查 SSE 连接：在控制台输入 window.eventBus"
echo "   → 检查后端日志是否有 '📤 [SSE推送]'"
echo ""
echo "❓ 如果 Dashboard 不显示任务："
echo "   → 检查 Network 面板是否有 API 调用"
echo "   → 检查 API 响应状态（应该是 200 OK）"
echo "   → 在控制台查看 taskStore.taskInstances"
echo ""
echo "❓ 如果 API 返回 401 Unauthorized："
echo "   → 检查 token 是否过期（重新登录）"
echo "   → 检查 API 客户端配置"
echo ""

echo "📍 7. 性能监控"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "在浏览器控制台输入以下命令："
echo ""
echo "// 查看 SSE 连接状态"
echo "window.eventBus"
echo ""
echo "// 查看 taskStore 数据"
echo "import { useTaskStore } from '@/modules/task/presentation/stores/taskStore';"
echo "const taskStore = useTaskStore();"
echo "console.log('Task Instances:', taskStore.taskInstances);"
echo ""

echo "🎉 =========================================="
echo "🎉 准备完成！现在可以开始测试了！"
echo "🎉 =========================================="
echo ""
echo "💡 提示：保持此终端窗口打开以查看后端日志"
echo ""
