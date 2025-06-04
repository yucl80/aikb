#!/bin/bash

# AI知识库启动脚本

echo "🧠 AI知识库启动脚本"
echo "===================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  警告: OPENAI_API_KEY环境变量未设置"
    echo "   AI功能将无法正常工作"
    echo "   请设置: export OPENAI_API_KEY=your-api-key"
fi

echo "📦 构建和启动服务..."

# 停止现有服务
docker-compose down

# 构建并启动服务
docker-compose up --build -d

echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 初始化数据库
echo "🗄️  初始化数据库..."
docker-compose exec backend python migrations/init_db.py

echo ""
echo "✅ 启动完成！"
echo ""
echo "🌐 访问地址:"
echo "   前端: https://work-1-zsawycuobkhjwhux.prod-runtime.all-hands.dev"
echo "   后端API: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "👤 默认登录信息:"
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "📝 查看日志:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 停止服务:"
echo "   docker-compose down"