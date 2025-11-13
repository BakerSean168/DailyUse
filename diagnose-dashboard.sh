#!/bin/bash

echo "🔍 Dashboard 性能诊断工具"
echo "================================"

# 检查 API 服务器状态
echo ""
echo "1️⃣ 检查 API 服务器状态..."
API_STATUS=$(ps aux | grep -E 'node.*api' | grep -v grep | wc -l)
if [ "$API_STATUS" -gt 0 ]; then
    echo "  ✅ API 服务器正在运行"
    ps aux | grep -E 'node.*api' | grep -v grep | head -2
else
    echo "  ❌ API 服务器未运行！"
    echo "  💡 请运行: pnpm dev:api"
fi

# 检查数据库状态
echo ""
echo "2️⃣ 检查数据库状态..."
DB_STATUS=$(docker ps | grep dailyuse-dev-db | wc -l)
if [ "$DB_STATUS" -gt 0 ]; then
    echo "  ✅ 数据库容器正在运行"
    docker ps | grep dailyuse-dev-db
else
    echo "  ❌ 数据库容器未运行！"
    echo "  💡 请运行: docker-compose up -d"
fi

# 检查 Web 服务器状态
echo ""
echo "3️⃣ 检查 Web 服务器状态..."
WEB_STATUS=$(ps aux | grep -E 'vite|webpack-dev-server' | grep -v grep | wc -l)
if [ "$WEB_STATUS" -gt 0 ]; then
    echo "  ✅ Web 服务器正在运行"
    ps aux | grep -E 'vite|webpack-dev-server' | grep -v grep | head -2
else
    echo "  ❌ Web 服务器未运行！"
    echo "  💡 请运行: pnpm dev:web"
fi

# 检查 dashboard_configs 表
echo ""
echo "4️⃣ 检查 dashboard_configs 表..."
TABLE_CHECK=$(docker exec dailyuse-dev-db psql -U dailyuse -d dailyuse_dev -t -c "SELECT COUNT(*) FROM dashboard_configs;" 2>/dev/null)
if [ $? -eq 0 ]; then
    COUNT=$(echo "$TABLE_CHECK" | tr -d ' ')
    echo "  ✅ 表存在，记录数: $COUNT"
    
    if [ "$COUNT" -eq "0" ]; then
        echo "  ℹ️ 表为空，首次访问将自动创建默认配置"
    else
        echo "  📊 现有配置:"
        docker exec dailyuse-dev-db psql -U dailyuse -d dailyuse_dev -c "SELECT account_uuid, jsonb_object_keys(widget_config) as widget_id FROM dashboard_configs LIMIT 5;"
    fi
else
    echo "  ❌ 无法连接到数据库"
fi

# 测试 API 响应时间（无认证）
echo ""
echo "5️⃣ 测试 API 基础响应时间..."
if [ "$API_STATUS" -gt 0 ]; then
    RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" http://localhost:3888/api/v1/health 2>&1 | tail -2)
    echo "  Health Check 响应:"
    echo "  $RESPONSE"
    
    # 提取响应时间
    TIME=$(echo "$RESPONSE" | grep "Time:" | cut -d' ' -f2 | tr -d 's')
    if [ -n "$TIME" ]; then
        # 检查是否超过 100ms
        if (( $(echo "$TIME > 0.1" | bc -l) )); then
            echo "  ⚠️ 响应时间较慢: ${TIME}s"
        else
            echo "  ✅ 响应时间正常: ${TIME}s"
        fi
    fi
else
    echo "  ⏭️ API 服务器未运行，跳过测试"
fi

# 检查网络端口
echo ""
echo "6️⃣ 检查端口占用..."
echo "  API 端口 (3888):"
netstat -an | grep 3888 | head -2
echo "  Web 端口 (5173):"
netstat -an | grep 5173 | head -2

# 建议
echo ""
echo "================================"
echo "💡 性能优化建议:"
echo ""
echo "1. 如果 API 响应时间 > 100ms："
echo "   - 检查数据库查询性能"
echo "   - 检查网络连接"
echo "   - 查看 API 日志: docker logs -f <api-container>"
echo ""
echo "2. 如果数据库连接慢："
echo "   - 重启数据库: docker-compose restart"
echo "   - 检查连接池配置"
echo ""
echo "3. 如果前端加载慢："
echo "   - 清除浏览器缓存"
echo "   - 检查浏览器控制台网络面板"
echo "   - 检查 API 请求是否被阻塞"
echo ""
echo "4. 查看详细日志："
echo "   - API: tail -f apps/api/logs/*.log"
echo "   - 浏览器: 打开 DevTools > Console > Network"
echo ""
