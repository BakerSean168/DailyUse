#!/bin/bash
# Docker 镜像快速构建和推送脚本（Linux/Mac）
# 用法: bash build-and-push.sh --registry docker.io --namespace yourname --tag v1.0.0 --push

set -e

# 默认值
REGISTRY="docker.io"
IMAGE_NAMESPACE="yourname"
TAG="v1.0.0"
PUSH=false
LATEST=false

# 颜色输出
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 帮助函数
show_help() {
    cat << EOF
Docker 镜像快速构建脚本

用法: bash build-and-push.sh [选项]

选项:
  --registry REGISTRY           镜像仓库 (默认: docker.io)
  --namespace NAMESPACE         命名空间 (默认: yourname)
  --tag TAG                     镜像标签 (默认: v1.0.0)
  --push                        构建后推送到仓库
  --latest                      同时创建 latest 标签
  -h, --help                    显示此帮助信息

示例:
  bash build-and-push.sh
  bash build-and-push.sh --registry ghcr.io --namespace myorg --tag v1.1.0 --push
  bash build-and-push.sh --push --latest

EOF
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --namespace)
            IMAGE_NAMESPACE="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --push)
            PUSH=true
            shift
            ;;
        --latest)
            LATEST=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 颜色输出函数
write_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

write_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

write_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

write_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查 Docker
write_info "检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    write_error "Docker 未安装"
    exit 1
fi

DOCKER_VERSION=$(docker --version)
write_success "Docker 已安装: $DOCKER_VERSION"

# 构建镜像名称
IMAGE_NAME_API="$REGISTRY/$IMAGE_NAMESPACE/dailyuse-api:$TAG"
IMAGE_NAME_WEB="$REGISTRY/$IMAGE_NAMESPACE/dailyuse-web:$TAG"

# 输出配置信息
echo ""
write_info "=========================================="
write_info "Docker 镜像构建配置"
write_info "=========================================="
write_info "仓库: $REGISTRY"
write_info "命名空间: $IMAGE_NAMESPACE"
write_info "标签: $TAG"
write_info "API 镜像: $IMAGE_NAME_API"
write_info "Web 镜像: $IMAGE_NAME_WEB"
write_info "=========================================="

# 构建 API 镜像
echo ""
write_info "构建 API 镜像..."
write_info "$ docker build -f Dockerfile.api -t $IMAGE_NAME_API ."

if docker build -f Dockerfile.api -t "$IMAGE_NAME_API" .; then
    write_success "API 镜像构建成功"
else
    write_error "API 镜像构建失败"
    exit 1
fi

# 构建 Web 镜像
echo ""
write_info "构建 Web 镜像..."
write_info "$ docker build -f Dockerfile.web -t $IMAGE_NAME_WEB ."

if docker build -f Dockerfile.web -t "$IMAGE_NAME_WEB" .; then
    write_success "Web 镜像构建成功"
else
    write_error "Web 镜像构建失败"
    exit 1
fi

# 显示镜像信息
echo ""
write_info "本地镜像列表:"
docker images | grep dailyuse || true

# 创建 latest 标签
if [ "$LATEST" = true ]; then
    echo ""
    write_info "创建 latest 标签..."
    
    IMAGE_NAME_API_LATEST="$REGISTRY/$IMAGE_NAMESPACE/dailyuse-api:latest"
    IMAGE_NAME_WEB_LATEST="$REGISTRY/$IMAGE_NAMESPACE/dailyuse-web:latest"
    
    docker tag "$IMAGE_NAME_API" "$IMAGE_NAME_API_LATEST"
    docker tag "$IMAGE_NAME_WEB" "$IMAGE_NAME_WEB_LATEST"
    
    write_success "已创建 latest 标签"
    write_info "API: $IMAGE_NAME_API_LATEST"
    write_info "Web: $IMAGE_NAME_WEB_LATEST"
fi

# 推送到仓库
if [ "$PUSH" = true ]; then
    echo ""
    write_warn "准备推送到仓库..."
    
    write_info ""
    write_info "推送 API 镜像..."
    write_info "$ docker push $IMAGE_NAME_API"
    if docker push "$IMAGE_NAME_API"; then
        write_success "API 镜像推送成功"
    else
        write_error "API 镜像推送失败"
        exit 1
    fi
    
    write_info ""
    write_info "推送 Web 镜像..."
    write_info "$ docker push $IMAGE_NAME_WEB"
    if docker push "$IMAGE_NAME_WEB"; then
        write_success "Web 镜像推送成功"
    else
        write_error "Web 镜像推送失败"
        exit 1
    fi
    
    # 推送 latest 标签
    if [ "$LATEST" = true ]; then
        echo ""
        write_info "推送 latest 标签..."
        docker push "$REGISTRY/$IMAGE_NAMESPACE/dailyuse-api:latest"
        docker push "$REGISTRY/$IMAGE_NAMESPACE/dailyuse-web:latest"
        write_success "latest 标签推送成功"
    fi
fi

# 总结
echo ""
write_info "=========================================="
write_success "构建完成！"
write_info "=========================================="

if [ "$PUSH" = false ]; then
    echo ""
    write_info "下一步："
    write_info "1. 推送镜像到仓库:"
    write_info "   docker push $IMAGE_NAME_API"
    write_info "   docker push $IMAGE_NAME_WEB"
    echo ""
    write_info "或者使用本脚本的 --push 标志:"
    write_info "   bash build-and-push.sh --push"
    echo ""
    write_info "2. 部署到生产环境:"
    write_info "   1. cp .env.prod.example .env.prod"
    write_info "   2. 编辑 .env.prod 设置镜像位置和密钥"
    write_info "   3. docker compose -f docker-compose.prod.yml --env-file .env.prod up -d"
else
    echo ""
    write_info "部署步骤:"
    write_info "1. cp .env.prod.example .env.prod"
    write_info "2. 编辑 .env.prod 设置镜像位置和密钥"
    write_info "3. docker compose -f docker-compose.prod.yml --env-file .env.prod up -d"
fi

write_info ""
write_info "更多信息请查看 DOCKER_DEPLOYMENT.md"
write_info "=========================================="
