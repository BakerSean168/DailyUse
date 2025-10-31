#!/bin/bash

# Epic 7 Repository Module MVP 测试脚本
# 测试核心流程：创建仓库 → 创建资源 → 更新内容 → 查询

BASE_URL="http://localhost:3888/api/v1"
ACCOUNT_UUID="test-account-uuid-123"  # 测试用 account UUID

echo "=========================================="
echo "Epic 7 Repository Module MVP 测试"
echo "=========================================="
echo ""

# 测试 1: 创建仓库
echo "📦 测试 1: 创建仓库"
echo "------------------------------------------"
REPO_RESPONSE=$(curl -s -X POST "$BASE_URL/repository-new" \
  -H "Content-Type: application/json" \
  -H "X-Account-UUID: $ACCOUNT_UUID" \
  -d '{
    "name": "My Knowledge Base",
    "type": "LOCAL",
    "path": "/knowledge",
    "description": "Personal knowledge management system"
  }')

echo "Response: $REPO_RESPONSE"
REPO_UUID=$(echo $REPO_RESPONSE | jq -r '.uuid')
echo "Repository UUID: $REPO_UUID"
echo ""

# 测试 2: 查询所有仓库
echo "📋 测试 2: 查询所有仓库"
echo "------------------------------------------"
curl -s -X GET "$BASE_URL/repository-new" \
  -H "X-Account-UUID: $ACCOUNT_UUID" | jq '.'
echo ""

# 测试 3: 创建 Markdown 资源
echo "📝 测试 3: 创建 Markdown 资源"
echo "------------------------------------------"
RESOURCE_RESPONSE=$(curl -s -X POST "$BASE_URL/resources" \
  -H "Content-Type: application/json" \
  -H "X-Account-UUID: $ACCOUNT_UUID" \
  -d "{
    \"repositoryUuid\": \"$REPO_UUID\",
    \"name\": \"Getting Started\",
    \"path\": \"/docs/getting-started.md\",
    \"content\": \"# Getting Started\n\nThis is my first note in the new repository system!\n\n## Features\n- Repository management\n- Resource organization\n- Markdown support\"
  }")

echo "Response: $RESOURCE_RESPONSE"
RESOURCE_UUID=$(echo $RESOURCE_RESPONSE | jq -r '.uuid')
echo "Resource UUID: $RESOURCE_UUID"
echo ""

# 测试 4: 更新 Markdown 内容
echo "✏️  测试 4: 更新 Markdown 内容"
echo "------------------------------------------"
curl -s -X PUT "$BASE_URL/resources/$RESOURCE_UUID/content" \
  -H "Content-Type: application/json" \
  -H "X-Account-UUID: $ACCOUNT_UUID" \
  -d '{
    "content": "# Getting Started\n\n## Updated Content\n\nThis content has been updated!\n\n### New Features\n- Auto-generated summary\n- Auto-calculated file size\n- Repository stats tracking\n\n**This is awesome! 🚀**"
  }' | jq '.'
echo ""

# 测试 5: 获取 Markdown 内容
echo "�� 测试 5: 获取 Markdown 内容"
echo "------------------------------------------"
curl -s -X GET "$BASE_URL/resources/$RESOURCE_UUID/content" \
  -H "X-Account-UUID: $ACCOUNT_UUID" | jq '.'
echo ""

# 测试 6: 查询仓库中的所有资源
echo "🔍 测试 6: 查询仓库中的资源"
echo "------------------------------------------"
curl -s -X GET "$BASE_URL/repository-new/$REPO_UUID/resources?page=1&pageSize=10" \
  -H "X-Account-UUID: $ACCOUNT_UUID" | jq '.'
echo ""

echo "=========================================="
echo "✅ MVP 测试完成！"
echo "=========================================="
