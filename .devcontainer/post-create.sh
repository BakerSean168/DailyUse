#!/bin/bash
set -e

echo "🚀 DailyUse Dev Environment - Post Create Setup"
echo "================================================"

# 1. 安装 pnpm (如果未安装)
echo "📦 Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@10.18.3
fi

# 2. 安装项目依赖
echo "📦 Installing project dependencies..."
pnpm install --frozen-lockfile

# 3. 设置 Git 配置
echo "🔧 Configuring Git..."
git config --global core.autocrlf input
git config --global core.eol lf
git config --global pull.rebase false

# 4. 创建必要的目录
echo "📁 Creating necessary directories..."
mkdir -p apps/api/logs
mkdir -p apps/web/dist
mkdir -p apps/desktop/dist

# 5. 设置环境变量 (如果 .env 文件不存在)
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    fi
fi

# 6. Nx Cloud 连接（可选）
echo "☁️ Nx workspace ready"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Quick Start Commands:"
echo "  - pnpm exec nx run api:dev       # 启动 API 服务器"
echo "  - pnpm exec nx run web:dev       # 启动 Web 前端"
echo "  - pnpm exec nx graph              # 查看项目依赖图"
echo "  - pnpm exec nx affected:test      # 运行受影响的测试"
echo ""
