#!/bin/bash

echo "🔍 开始类型检查..."
echo "================================"

# Web 端检查
echo ""
echo "📱 检查 Web 端类型..."
WEB_OUTPUT=$(npx tsc --noEmit --project apps/web/tsconfig.json 2>&1)
WEB_ERRORS=$(echo "$WEB_OUTPUT" | grep "error TS" | wc -l)
echo "Web 端错误数: $WEB_ERRORS"

# API 端检查
echo ""
echo "🔧 检查 API 端类型..."
API_OUTPUT=$(npx tsc --noEmit --project apps/api/tsconfig.json 2>&1)
API_ERRORS=$(echo "$API_OUTPUT" | grep "error TS" | wc -l)
echo "API 端错误数: $API_ERRORS"

# 总计
echo ""
echo "================================"
TOTAL=$((WEB_ERRORS + API_ERRORS))
echo "📊 总错误数: $TOTAL"

# 按模块分组 (Web)
if [ $WEB_ERRORS -gt 0 ]; then
    echo ""
    echo "📦 Web 端错误分布 (按模块):"
    echo "$WEB_OUTPUT" | grep "error TS" | grep -oE "apps/web/src/modules/[^/]+" | sort | uniq -c | sort -rn
fi

# 按模块分组 (API)
if [ $API_ERRORS -gt 0 ]; then
    echo ""
    echo "📦 API 端错误分布 (按模块):"
    echo "$API_OUTPUT" | grep "error TS" | grep -oE "apps/api/src/modules/[^/]+" | sort | uniq -c | sort -rn
fi

# 按错误类型分组
if [ $TOTAL -gt 0 ]; then
    echo ""
    echo "🔤 错误类型分布 (Top 10):"
    echo "$WEB_OUTPUT$API_OUTPUT" | grep "error TS" | grep -oE "TS[0-9]+" | sort | uniq -c | sort -rn | head -10
fi

echo ""
echo "================================"
if [ $TOTAL -eq 0 ]; then
    echo "✅ 恭喜！达到 0 错误！🎉"
    exit 0
else
    echo "❌ 还有 $TOTAL 个错误需要修复"
    exit 1
fi
