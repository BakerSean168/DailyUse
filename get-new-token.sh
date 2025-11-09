#!/bin/bash

# 获取新的访问令牌
# 用法: ./get-new-token.sh

echo "=========================================="
echo "获取新的访问令牌"
echo "=========================================="

# 提示用户输入账号密码
read -p "请输入账号: " username
read -sp "请输入密码: " password
echo ""

# 登录获取 token
response=$(curl -s -X POST http://localhost:3888/api/v1/accounts/login \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$username\",\"password\":\"$password\"}")

# 提取 accessToken
accessToken=$(echo $response | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$accessToken" ]; then
    echo "❌ 登录失败"
    echo "响应: $response"
    exit 1
fi

echo ""
echo "✅ 登录成功！"
echo ""
echo "📋 Access Token:"
echo "$accessToken"
echo ""
echo "💾 Token 已复制到剪贴板（如果支持）"
echo "$accessToken" | xclip -selection clipboard 2>/dev/null || echo "$accessToken" | pbcopy 2>/dev/null || true

echo ""
echo "🔧 使用方法:"
echo "1. 在浏览器控制台运行:"
echo "   localStorage.setItem('access_token', '$accessToken')"
echo ""
echo "2. 或者直接测试 SSE:"
echo "   curl -N \"http://localhost:3888/api/v1/sse/notifications/events?token=$accessToken\""
echo ""
echo "=========================================="
