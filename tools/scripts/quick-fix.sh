#!/bin/bash
# 快速修复常见错误

set -e

MODULE=$1

if [ -z "$MODULE" ]; then
    echo "用法: ./quick-fix.sh <模块名>"
    echo "示例: ./quick-fix.sh task"
    exit 1
fi

echo "🔧 快速修复: $MODULE"
echo ""

# 1. 运行测试找出错误
echo "📋 [1/5] 运行测试..."
pnpm test:run --filter="*$MODULE*" --reporter=verbose || echo "发现测试错误"

# 2. 类型检查
echo ""
echo "🔍 [2/5] 类型检查..."
pnpm typecheck --filter="@dailyuse/*$MODULE*" || echo "发现类型错误"

# 3. 自动修复Lint错误
echo ""
echo "🔧 [3/5] 修复Lint错误..."
pnpm lint:fix --filter="@dailyuse/*$MODULE*" || true

# 4. 格式化代码
echo ""
echo "✨ [4/5] 格式化代码..."
pnpm format

# 5. 重新运行测试
echo ""
echo "✅ [5/5] 重新运行测试..."
if pnpm test:run --filter="*$MODULE*"; then
    echo ""
    echo "🎉 所有测试通过！"
else
    echo ""
    echo "⚠️  仍有测试失败，请手动检查"
    exit 1
fi

echo ""
echo "✅ 快速修复完成！"
