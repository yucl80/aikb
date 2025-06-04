# 🤖 AI驱动的知识库系统

一个基于人工智能的智能知识库系统，支持文档管理和智能问答功能。**已完成完整的设置页面集成和AI聊天功能！**

## ✨ 主要功能

### 🎯 核心功能
- **AI智能问答**: 支持中文关键词匹配和语义搜索
- **文档管理**: 上传、存储和管理各种文档
- **用户认证**: 完整的JWT认证系统
- **设置管理**: 包含4个功能模块的完整设置页面

### 📊 设置页面功能
1. **个人信息**: 用户资料管理和编辑
2. **安全设置**: 密码修改和安全配置
3. **系统配置**: AI模型参数和系统设置
4. **使用统计**: 实时系统数据和使用情况

### 🔧 技术特性
- **前端**: React + TypeScript + Ant Design
- **后端**: FastAPI + SQLAlchemy + ChromaDB
- **数据库**: SQLite + 向量数据库
- **认证**: JWT Token认证
- **AI引擎**: 支持中文语义理解

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

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 安装和运行

1. **克隆项目**
```bash
git clone https://github.com/yucl80/aikb.git
cd aikb
```

2. **启动开发环境**
```bash
chmod +x start_dev.sh
./start_dev.sh
```

3. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:8000

### 默认登录信息
- 用户名: `admin`
- 密码: `admin123`

## 📱 功能演示

### AI问答功能
- 支持中文关键词: "深度学习", "机器学习", "人工智能"
- 智能语义匹配和相关度评分
- 实时查询历史记录

### 设置页面
- **个人信息**: 完整的用户资料管理
- **安全设置**: 密码修改功能
- **系统配置**: AI模型参数调整
- **使用统计**: 实时系统数据展示
  - 文档总数、查询次数、用户数量
  - 存储使用情况和系统状态

## 🏗️ 项目结构

```
aikb/
├── frontend/          # React前端应用
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── services/  # API服务
│   │   └── components/ # 通用组件
├── backend/           # FastAPI后端
│   ├── app/
│   │   ├── api/       # API路由
│   │   ├── models/    # 数据模型
│   │   ├── services/  # 业务逻辑
│   │   └── core/      # 核心配置
└── docker-compose.yml # Docker配置
```

## 🧪 测试状态

- ✅ 后端认证: `/api/v1/auth/token` 端点正常
- ✅ 后端系统统计: 返回真实数据
- ✅ 前端登录: admin/admin123 登录成功
- ✅ 设置页面: 所有4个标签页功能正常
- ✅ AI聊天功能: 支持置信度评分
- ✅ 使用统计: 实时系统数据显示

## 🔄 API文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档。

## 📝 更新日志

### v1.0.0 (2025-06-04)
- ✅ 完整的AI聊天功能实现
- ✅ 设置页面4个模块全部完成
- ✅ 前后端API集成完成
- ✅ 用户认证系统完善
- ✅ 实时统计数据展示
- ✅ 中文关键词支持优化

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License