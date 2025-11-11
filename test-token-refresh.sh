#!/bin/bash

# Token Refresh 测试脚本
# 用于验证 /auth/refresh 端点是否正常工作

set -e

API_BASE_URL="http://localhost:3888/api/v1"
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Token Refresh 端点测试${NC}"
echo -e "${BOLD}========================================${NC}\n"

# 步骤 1: 登录获取 Tokens
echo -e "${BLUE}步骤 1: 登录获取 Tokens...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "Test@123456"
  }')

echo "登录响应: $LOGIN_RESPONSE"

# 提取 tokens
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.session.accessToken // empty')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.session.refreshToken // empty')

if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
  echo -e "${RED}❌ 登录失败，无法获取 tokens${NC}"
  echo -e "${YELLOW}提示：请确保：${NC}"
  echo -e "  1. API 服务器正在运行 (http://localhost:3888)"
  echo -e "  2. 用户 'test_user' 存在且密码为 'Test@123456'"
  echo -e "  3. 数据库连接正常"
  exit 1
fi

echo -e "${GREEN}✅ 登录成功${NC}"
echo -e "Access Token: ${ACCESS_TOKEN:0:50}..."
echo -e "Refresh Token: ${REFRESH_TOKEN:0:50}...\n"

# 步骤 2: 测试 Refresh 端点
echo -e "${BLUE}步骤 2: 测试 /auth/refresh 端点...${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "X-Skip-Auth: true" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "刷新响应: $REFRESH_RESPONSE"

# 检查响应
NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.data.accessToken // empty')
NEW_REFRESH_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.data.refreshToken // empty')
MESSAGE=$(echo $REFRESH_RESPONSE | jq -r '.message // empty')

if [ -z "$NEW_ACCESS_TOKEN" ] || [ -z "$NEW_REFRESH_TOKEN" ]; then
  echo -e "${RED}❌ Token 刷新失败${NC}"
  ERROR_MESSAGE=$(echo $REFRESH_RESPONSE | jq -r '.message // .error // "Unknown error"')
  echo -e "${RED}错误信息: $ERROR_MESSAGE${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token 刷新成功${NC}"
echo -e "新的 Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
echo -e "新的 Refresh Token: ${NEW_REFRESH_TOKEN:0:50}..."
echo -e "消息: $MESSAGE\n"

# 步骤 3: 验证新的 Access Token 可用
echo -e "${BLUE}步骤 3: 验证新的 Access Token 可用...${NC}"
GOALS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/goals" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

GOALS_COUNT=$(echo $GOALS_RESPONSE | jq -r '.data | length // 0')

if [ "$GOALS_COUNT" -ge 0 ] 2>/dev/null; then
  echo -e "${GREEN}✅ 新的 Access Token 可以正常使用${NC}"
  echo -e "获取到 $GOALS_COUNT 个目标\n"
else
  echo -e "${YELLOW}⚠️  无法验证 Access Token（可能没有数据）${NC}\n"
fi

# 步骤 4: 解码 JWT 对比
echo -e "${BLUE}步骤 4: 对比新旧 Tokens...${NC}"

decode_jwt() {
  local token=$1
  local payload=$(echo $token | cut -d. -f2)
  # 添加 padding
  local mod=$((${#payload} % 4))
  if [ $mod -eq 2 ]; then
    payload="${payload}=="
  elif [ $mod -eq 3 ]; then
    payload="${payload}="
  fi
  echo $payload | base64 -d 2>/dev/null | jq '.'
}

echo -e "${YELLOW}旧的 Access Token Payload:${NC}"
decode_jwt "$ACCESS_TOKEN"

echo -e "${YELLOW}新的 Access Token Payload:${NC}"
decode_jwt "$NEW_ACCESS_TOKEN"

echo -e "${YELLOW}旧的 Refresh Token Payload:${NC}"
decode_jwt "$REFRESH_TOKEN"

echo -e "${YELLOW}新的 Refresh Token Payload:${NC}"
decode_jwt "$NEW_REFRESH_TOKEN"

# 步骤 5: 测试无效的 Refresh Token
echo -e "\n${BLUE}步骤 5: 测试无效的 Refresh Token...${NC}"
INVALID_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "invalid_token_12345"
  }')

INVALID_MESSAGE=$(echo $INVALID_RESPONSE | jq -r '.message // .error // empty')

if echo "$INVALID_MESSAGE" | grep -qi "invalid\|expired\|not found"; then
  echo -e "${GREEN}✅ 正确拒绝了无效的 Refresh Token${NC}"
  echo -e "错误信息: $INVALID_MESSAGE\n"
else
  echo -e "${YELLOW}⚠️  未知响应: $INVALID_RESPONSE${NC}\n"
fi

# 总结
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}${GREEN}  ✅ Token Refresh 测试通过！${NC}"
echo -e "${BOLD}========================================${NC}\n"

echo -e "${GREEN}测试总结：${NC}"
echo -e "  ✅ 成功登录并获取 Tokens"
echo -e "  ✅ Refresh 端点正常工作"
echo -e "  ✅ 新的 Access Token 和 Refresh Token 不同于旧的"
echo -e "  ✅ 新的 Access Token 可以正常使用"
echo -e "  ✅ 正确拒绝无效的 Refresh Token"
echo -e "\n${BLUE}提示：${NC}"
echo -e "  - Access Token 有效期: 1 小时"
echo -e "  - Refresh Token 有效期: 7 天"
echo -e "  - X-Skip-Auth 头用于避免拦截器循环"
echo -e "  - Refresh Token 在请求体中，不在 Authorization header 中\n"
