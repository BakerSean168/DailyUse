#!/bin/bash

# 修复所有E2E测试文件中的Unicode问题
find e2e -name "*.spec.ts" -type f | while read file; do
  # 移除或替换特殊Unicode字符
  LC_ALL=C sed -i \
    -e 's/║/|/g' \
    -e 's/╔/+/g' \
    -e 's/╗/+/g' \
    -e 's/╠/+/g' \
    -e 's/╣/+/g' \
    -e 's/╚/+/g' \
    -e 's/╝/+/g' \
    -e 's/═/=/g' \
    -e 's/→/->/g' \
    "$file"
  echo "Fixed: $file"
done

echo "编码清理完成"
