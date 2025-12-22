#!/bin/bash

# DailyUse 自动化部署脚本
# 功能：构建、推送和部署新镜像
# 用法：./deploy-prod.sh [version] [registry] [namespace]
# 示例：./deploy-prod.sh v1.0.3 crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com bakersean

set -e  # 遇到错误退出

# ============================================================
# 配置
# ============================================================

API_VERSION=${1:-v1.0.3}
REGISTRY=${2:-crpi-3po0rmvmxgu205ms.cn-hangzhou.personal.cr.aliyuncs.com}
NAMESPACE=${3:-bakersean}
IMAGE_NAME="dailyuse-api"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${API_VERSION}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================
# 函数
# ============================================================

log_info() {
  echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_step() {
  echo ""
  echo -e "${GREEN}=====================================================${NC}"
  echo -e "${GREEN}步骤：$1${NC}"
  echo -e "${GREEN}=====================================================${NC}"
}

# ============================================================
# 执行步骤
# ============================================================

log_step "1. 验证本地编译"
log_info "运行 TypeScript 类型检查..."
pnpm nx run api:typecheck > /dev/null 2>&1
if [ $? -eq 0 ]; then
  log_info "✅ TypeScript 编译通过"
else
  log_error "TypeScript 编译失败"
  exit 1
fi

log_step "2. 构建 API 镜像"
log_info "镜像信息：$FULL_IMAGE"
docker build -t "${FULL_IMAGE}" -f Dockerfile.api .

if [ $? -eq 0 ]; then
  log_info "✅ 镜像构建成功"
else
  log_error "镜像构建失败"
  exit 1
fi

log_step "3. 登录到镜像仓库"
log_warn "需要提供阿里云 ACR 的用户名和密码"
# 如果你有保存的凭证，可以跳过此步骤
# docker login -u your-username $REGISTRY

log_step "4. 推送镜像到仓库"
log_info "推送 $FULL_IMAGE..."
docker push "${FULL_IMAGE}"

if [ $? -eq 0 ]; then
  log_info "✅ 镜像推送成功"
else
  log_error "镜像推送失败"
  exit 1
fi

log_step "5. 总结"
echo ""
echo "新镜像信息："
echo "  仓库：$REGISTRY"
echo "  命名空间：$NAMESPACE"
echo "  镜像名：$IMAGE_NAME"
echo "  版本：$API_VERSION"
echo "  完整标签：$FULL_IMAGE"
echo ""
log_info "下一步：在生产服务器上执行以下命令部署"
echo ""
echo "  # 1. SSH 连接到服务器"
echo "  ssh user@your-server"
echo ""
echo "  # 2. 进入项目目录"
echo "  cd /path/to/dailyuse-production"
echo ""
echo "  # 3. 更新镜像版本并重新部署"
echo "  export API_TAG=${API_VERSION}"
echo "  docker-compose -f docker-compose.prod.yml --env-file .env.production.local down"
echo "  docker-compose -f docker-compose.prod.yml --env-file .env.production.local pull"
echo "  docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d"
echo ""
echo "  # 4. 验证部署"
echo "  curl http://localhost:3000/healthz"
echo ""
