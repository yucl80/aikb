#!/bin/bash

# AI知识库开发环境启动脚本

echo "🧠 AI知识库开发环境启动"
echo "========================"

# 检查环境变量
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  警告: OPENAI_API_KEY环境变量未设置"
    echo "   AI功能将无法正常工作"
    echo "   请设置: export OPENAI_API_KEY=your-api-key"
fi

# 创建必要的目录
mkdir -p /workspace/backend/uploads
mkdir -p /workspace/backend/chroma_db

# 设置环境变量
export DATABASE_URL="sqlite:///./ai_knowledge_base.db"
export SECRET_KEY="dev-secret-key-change-in-production"
export ENVIRONMENT="development"
export DEBUG="true"

echo "📦 启动后端服务..."
cd /workspace/backend

# 启动后端服务（后台运行）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ 等待后端服务启动..."
sleep 5

# 检查后端是否启动成功
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败，查看日志: cat /workspace/backend/backend.log"
fi

echo "🌐 启动前端服务..."
cd /workspace/frontend

# 启动前端服务（后台运行）
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "⏳ 等待前端服务启动..."
sleep 10

echo ""
echo "✅ 启动完成！"
echo ""
echo "🌐 访问地址:"
echo "   前端: https://work-1-zsawycuobkhjwhux.prod-runtime.all-hands.dev"
echo "   后端API: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "📝 查看日志:"
echo "   后端: tail -f /workspace/backend/backend.log"
echo "   前端: tail -f /workspace/frontend/frontend.log"
echo ""
echo "🛑 停止服务:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "进程ID:"
echo "   后端: $BACKEND_PID"
echo "   前端: $FRONTEND_PID"

# 保存进程ID到文件
echo "$BACKEND_PID" > /workspace/backend.pid
echo "$FRONTEND_PID" > /workspace/frontend.pid

echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait