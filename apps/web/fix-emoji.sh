#!/bin/bash

# 移除E2E测试文件中的emoji字符
find e2e -name "*.spec.ts" -type f -exec sed -i \
  -e 's/✅/[PASS]/g' \
  -e 's/❌/[FAIL]/g' \
  -e 's/⚠️/[WARN]/g' \
  -e 's/🚀/[START]/g' \
  -e 's/📊/[DATA]/g' \
  -e 's/⭐/[STAR]/g' \
  {} \;

echo "Emoji替换完成"
