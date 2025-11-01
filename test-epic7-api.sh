#!/bin/bash

# Epic 7 Repository & Resource API 测试脚本
# 测试所有 18 个端点

API_URL="http://localhost:3888/api/v1"
ACCOUNT_UUID="test-account-$(date +%s)"
REPO_UUID=""
RESOURCE_UUID=""

echo "========================================="
echo "Epic 7 API 端点测试"
echo "========================================="
echo ""
echo "测试账户: $ACCOUNT_UUID"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_endpoint() {
  local test_name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -n "[$TOTAL_TESTS] 测试: $test_name ... "
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      "$API_URL$endpoint" \
      -H "x-account-uuid: $ACCOUNT_UUID" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      "$API_URL$endpoint" \
      -H "x-account-uuid: $ACCOUNT_UUID")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $http_code)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$body"
  fi
  echo ""
}

# ========================================
# Repository API 测试 (5 个端点)
# ========================================

echo "========================================="
echo "1. Repository CRUD 测试"
echo "========================================="
echo ""

# 1. 创建仓库
test_endpoint \
  "创建仓库" \
  "POST" \
  "/repository-new" \
  '{
    "name": "Test Repository",
    "type": "LOCAL",
    "path": "/test-repo",
    "description": "测试仓库",
    "config": {
      "enableGit": false,
      "autoSync": false,
      "supportedFileTypes": ["markdown", "image"],
      "maxFileSize": 104857600
    }
  }' \
  "201"

# 提取 Repository UUID
REPO_UUID=$(curl -s -X POST "$API_URL/repository-new" \
  -H "x-account-uuid: $ACCOUNT_UUID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Repo",
    "type": "LOCAL",
    "path": "/test"
  }' | jq -r '.uuid')

echo "创建的仓库 UUID: $REPO_UUID"
echo ""

# 2. 列出所有仓库
test_endpoint \
  "列出所有仓库" \
  "GET" \
  "/repository-new" \
  "" \
  "200"

# 3. 获取仓库详情
if [ -n "$REPO_UUID" ]; then
  test_endpoint \
    "获取仓库详情" \
    "GET" \
    "/repository-new/$REPO_UUID" \
    "" \
    "200"
fi

# 4. 更新仓库
if [ -n "$REPO_UUID" ]; then
  test_endpoint \
    "更新仓库" \
    "PUT" \
    "/repository-new/$REPO_UUID" \
    '{
      "name": "Updated Repository Name",
      "description": "更新后的描述"
    }' \
    "200"
fi

# ========================================
# Resource API 测试 (13 个端点)
# ========================================

echo "========================================="
echo "2. Resource CRUD 测试"
echo "========================================="
echo ""

# 5. 创建资源 (Markdown)
if [ -n "$REPO_UUID" ]; then
  test_endpoint \
    "创建 Markdown 资源" \
    "POST" \
    "/resources" \
    "{
      \"repositoryUuid\": \"$REPO_UUID\",
      \"name\": \"我的第一篇笔记\",
      \"type\": \"markdown\",
      \"path\": \"/notes\",
      \"content\": \"# Hello World\\n\\n这是测试内容。\"
    }" \
    "201"
  
  # 提取 Resource UUID
  RESOURCE_UUID=$(curl -s -X POST "$API_URL/resources" \
    -H "x-account-uuid: $ACCOUNT_UUID" \
    -H "Content-Type: application/json" \
    -d "{
      \"repositoryUuid\": \"$REPO_UUID\",
      \"name\": \"Test Note\",
      \"type\": \"markdown\",
      \"path\": \"/\",
      \"content\": \"# Test Content\"
    }" | jq -r '.uuid')
  
  echo "创建的资源 UUID: $RESOURCE_UUID"
  echo ""
fi

# 6. 列出资源（分页+筛选）
if [ -n "$REPO_UUID" ]; then
  test_endpoint \
    "列出资源（分页）" \
    "GET" \
    "/repository-new/$REPO_UUID/resources?page=1&pageSize=10&type=markdown" \
    "" \
    "200"
fi

# 7. 获取资源详情
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "获取资源详情" \
    "GET" \
    "/resources/$RESOURCE_UUID" \
    "" \
    "200"
fi

# 8. 更新资源（通用字段）
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "更新资源字段" \
    "PUT" \
    "/resources/$RESOURCE_UUID" \
    '{
      "name": "更新后的笔记名称",
      "description": "新的描述",
      "tags": ["测试", "API"]
    }' \
    "200"
fi

# ========================================
# Markdown 专用功能测试
# ========================================

echo "========================================="
echo "3. Markdown 专用功能测试"
echo "========================================="
echo ""

# 9. 更新 Markdown 内容
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "更新 Markdown 内容" \
    "PUT" \
    "/resources/$RESOURCE_UUID/content" \
    '{
      "content": "# 更新后的内容\n\n这是更新后的 Markdown 内容。\n\n## 子标题\n\n- 列表项 1\n- 列表项 2"
    }' \
    "200"
fi

# 10. 获取 Markdown 内容
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "获取 Markdown 内容" \
    "GET" \
    "/resources/$RESOURCE_UUID/content" \
    "" \
    "200"
fi

# ========================================
# 资源操作测试
# ========================================

echo "========================================="
echo "4. 资源操作测试"
echo "========================================="
echo ""

# 11. 移动资源
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "移动资源" \
    "POST" \
    "/resources/$RESOURCE_UUID/move" \
    '{
      "newPath": "/archives/old-notes"
    }' \
    "200"
fi

# 12. 收藏资源
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "收藏资源" \
    "POST" \
    "/resources/$RESOURCE_UUID/favorite" \
    "" \
    "200"
fi

# 13. 取消收藏（再次调用 toggle）
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "取消收藏资源" \
    "POST" \
    "/resources/$RESOURCE_UUID/favorite" \
    "" \
    "200"
fi

# 14. 发布资源
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "发布资源" \
    "POST" \
    "/resources/$RESOURCE_UUID/publish" \
    "" \
    "200"
fi

# 15. 归档资源
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "归档资源" \
    "POST" \
    "/resources/$RESOURCE_UUID/archive" \
    "" \
    "200"
fi

# ========================================
# 删除操作测试（最后执行）
# ========================================

echo "========================================="
echo "5. 删除操作测试"
echo "========================================="
echo ""

# 16. 删除资源（软删除）
if [ -n "$RESOURCE_UUID" ]; then
  test_endpoint \
    "删除资源" \
    "DELETE" \
    "/resources/$RESOURCE_UUID" \
    "" \
    "204"
fi

# 17. 删除仓库（级联删除）
if [ -n "$REPO_UUID" ]; then
  test_endpoint \
    "删除仓库" \
    "DELETE" \
    "/repository-new/$REPO_UUID" \
    "" \
    "204"
fi

# ========================================
# 测试总结
# ========================================

echo ""
echo "========================================="
echo "测试总结"
echo "========================================="
echo "总测试数: $TOTAL_TESTS"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}✗ 有 $FAILED_TESTS 个测试失败${NC}"
  exit 1
fi
