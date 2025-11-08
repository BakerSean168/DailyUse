#!/bin/bash

# 测试 Schedule → Notification 完整流程
# 1. 创建一个 Reminder
# 2. 创建对应的 ScheduleTask
# 3. 触发任务执行
# 4. 验证 Notification 是否创建

set -e

API_BASE="http://localhost:3000/api/v1"
ACCOUNT_UUID="0ea868b2-d771-4c7c-b738-d061c9c52355"

echo "=========================================="
echo "测试 Schedule → Notification 流程"
echo "=========================================="

# 1. 创建 Reminder
echo ""
echo "1️⃣ 创建 Reminder..."
REMINDER_RESPONSE=$(curl -s -X POST "${API_BASE}/reminders" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountUuid\": \"${ACCOUNT_UUID}\",
    \"title\": \"测试通知流程\",
    \"content\": \"这是一个测试提醒，用于验证通知创建\",
    \"triggerTime\": $(date -d '+2 minutes' +%s)000,
    \"notificationChannels\": [\"in_app\", \"desktop\"],
    \"isRecurring\": false
  }")

REMINDER_UUID=$(echo $REMINDER_RESPONSE | jq -r '.uuid')
echo "✅ Reminder 创建成功: ${REMINDER_UUID}"

# 2. 等待几秒让 ScheduleTask 创建
echo ""
echo "2️⃣ 等待 ScheduleTask 创建..."
sleep 3

# 3. 查询 ScheduleTask
echo ""
echo "3️⃣ 查询对应的 ScheduleTask..."
TASK_RESPONSE=$(curl -s "${API_BASE}/schedule/tasks?accountUuid=${ACCOUNT_UUID}&sourceModule=reminder&sourceEntityId=${REMINDER_UUID}")
TASK_UUID=$(echo $TASK_RESPONSE | jq -r '.items[0].uuid')
echo "✅ ScheduleTask UUID: ${TASK_UUID}"

# 4. 手动触发任务执行
echo ""
echo "4️⃣ 手动触发任务执行..."
EXECUTE_RESPONSE=$(curl -s -X POST "${API_BASE}/schedule/tasks/${TASK_UUID}/execute")
echo "✅ 任务执行响应: ${EXECUTE_RESPONSE}"

# 5. 等待事件处理
echo ""
echo "5️⃣ 等待事件处理（3秒）..."
sleep 3

# 6. 查询 Notification
echo ""
echo "6️⃣ 查询创建的 Notification..."
NOTIFICATION_RESPONSE=$(curl -s "${API_BASE}/notifications?accountUuid=${ACCOUNT_UUID}&relatedEntityType=REMINDER&relatedEntityUuid=${REMINDER_UUID}")
NOTIFICATION_COUNT=$(echo $NOTIFICATION_RESPONSE | jq -r '.total')

echo ""
echo "=========================================="
echo "测试结果"
echo "=========================================="
echo "Reminder UUID:     ${REMINDER_UUID}"
echo "ScheduleTask UUID: ${TASK_UUID}"
echo "Notification 数量: ${NOTIFICATION_COUNT}"

if [ "$NOTIFICATION_COUNT" -gt "0" ]; then
  echo "✅ 测试成功！Notification 已创建"
  NOTIFICATION_DETAIL=$(echo $NOTIFICATION_RESPONSE | jq -r '.items[0]')
  echo ""
  echo "Notification 详情:"
  echo $NOTIFICATION_DETAIL | jq '.'
else
  echo "❌ 测试失败！未找到对应的 Notification"
  exit 1
fi

echo ""
echo "=========================================="
echo "请查看 API 日志确认以下内容："
echo "1. ScheduleTaskTriggeredHandler 接收到事件"
echo "2. metadata 内容正确（不再是字符数组）"
echo "3. Notification 成功创建"
echo "=========================================="
