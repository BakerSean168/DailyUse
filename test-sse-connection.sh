#!/bin/bash

# SSE 连接测试脚本
# 用于验证 SSE 端点是否正常工作

set -e

echo "=========================================="
echo "SSE 连接测试"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
API_URL="http://localhost:3888"
SSE_ENDPOINT="/api/v1/sse/notifications/events"

# 步骤 1: 检查 API 服务器是否运行
echo -e "\n${YELLOW}[1/4]${NC} 检查 API 服务器状态..."
if curl -s -f "${API_URL}/api/v1/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API 服务器运行正常"
else
    echo -e "${RED}✗${NC} API 服务器未运行，请先启动: pnpm exec nx run api:dev"
    exit 1
fi

# 步骤 2: 获取认证 token
echo -e "\n${YELLOW}[2/4]${NC} 获取认证 token..."
echo "请提供你的 access_token (从浏览器 localStorage 或登录后获取):"
read -r TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗${NC} Token 不能为空"
    exit 1
fi

echo -e "${GREEN}✓${NC} Token 已获取"

# 步骤 3: 测试 SSE 连接
echo -e "\n${YELLOW}[3/4]${NC} 测试 SSE 连接..."
echo "连接到: ${API_URL}${SSE_ENDPOINT}?token=***"
echo "按 Ctrl+C 停止监听"
echo ""

# 使用 curl 测试 SSE 连接 (10秒超时用于演示)
timeout 10 curl -N -H "Accept: text/event-stream" \
    "${API_URL}${SSE_ENDPOINT}?token=${TOKEN}" 2>&1 || true

# 步骤 4: 总结
echo -e "\n\n${YELLOW}[4/4]${NC} 测试总结"
echo "如果你看到了事件流 (data: {...})，说明 SSE 连接正常"
echo ""
echo "预期输出示例:"
echo "  event: heartbeat"
echo "  data: {\"timestamp\":...}"
echo ""
echo "如果看到 401 错误，说明 token 无效或已过期"
echo "如果连接立即断开，检查后端日志查看详细错误"
echo ""
echo "=========================================="
echo "下一步:"
echo "1. 打开浏览器 DevTools (F12)"
echo "2. 访问 http://localhost:5173/sse-monitor"
echo "3. 在 Network 面板查找 'events?token=' 请求"
echo "4. 查看 EventStream 标签页的实时事件"
echo "=========================================="
