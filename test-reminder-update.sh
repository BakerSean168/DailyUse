#!/bin/bash

# 测试更新 reminder template
# 获取一个已存在的 reminder template UUID

TEMPLATE_UUID="8a83907b-514b-4e6f-a7aa-98eaf7835dd0"
API_BASE="http://localhost:4200/api"

echo "===== 测试更新 Reminder Template ====="
echo ""

# 1. 获取当前模板
echo "1. 获取当前模板..."
curl -s "${API_BASE}/reminders/templates/${TEMPLATE_UUID}" | jq '.'
echo ""

# 2. 更新模板 - 修改 trigger 为每分钟
echo "2. 更新模板 - 设置为每分钟触发..."
curl -s -X PATCH "${API_BASE}/reminders/templates/${TEMPLATE_UUID}" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": {
      "type": "INTERVAL",
      "interval": 60000,
      "specificTime": null,
      "daysOfWeek": null,
      "daysOfMonth": null
    },
    "title": "测试每分钟提醒"
  }' | jq '.'
echo ""

# 3. 再次获取模板确认更新
echo "3. 确认更新后的模板..."
curl -s "${API_BASE}/reminders/templates/${TEMPLATE_UUID}" | jq '.'
echo ""

echo "===== 测试完成 ====="
