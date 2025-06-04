# AI驱动的知识库

一个现代化的智能知识库管理系统，集成了AI问答、语义搜索和知识图谱功能。

## 功能特性

- 📚 **智能文档管理** - 支持PDF、Word、Markdown等多种格式
- 🔍 **语义搜索** - 基于向量数据库的智能搜索
- 🤖 **AI问答** - 基于知识库内容的智能问答
- 🕸️ **知识图谱** - 可视化知识关系和实体
- 👥 **多用户支持** - 用户管理和权限控制
- 📊 **数据分析** - 知识库使用统计和分析

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design / Material-UI
- D3.js (知识图谱可视化)
- Axios (HTTP客户端)

### 后端
- Python FastAPI
- SQLAlchemy (ORM)
- ChromaDB (向量数据库)
- OpenAI API / Hugging Face

### 数据库
- PostgreSQL (主数据库)
- ChromaDB (向量存储)
- Redis (缓存)

## 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+
- PostgreSQL 13+

### 安装和运行

1. 克隆项目
```bash
git clone <repository-url>
cd ai-knowledge-base
```

2. 安装依赖
```bash
# 后端依赖
cd backend
pip install -r requirements.txt

# 前端依赖
cd ../frontend
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和API密钥
```

4. 启动服务
```bash
# 启动后端
cd backend
uvicorn main:app --host 0.0.0.0 --port 12000 --reload

# 启动前端
cd ../frontend
npm start
```

## 项目结构

```
ai-knowledge-base/
├── backend/                 # 后端API服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── requirements.txt
│   └── main.py
├── frontend/               # 前端React应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── services/       # API服务
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript类型
│   ├── package.json
│   └── public/
├── docs/                   # 文档
└── README.md
```

## API文档

启动后端服务后，访问 `http://localhost:12000/docs` 查看自动生成的API文档。

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

MIT License