#!/usr/bin/env python3
"""
数据库初始化脚本
创建所有表和初始数据
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.database import Base
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.models.query import Query
from app.models.knowledge_graph import KnowledgeGraph
from app.core.security import get_password_hash
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database():
    """创建数据库（如果不存在）"""
    try:
        # 创建数据库引擎（不指定数据库名）
        db_url_without_db = settings.DATABASE_URL.rsplit('/', 1)[0]
        engine = create_engine(db_url_without_db)
        
        # 提取数据库名
        db_name = settings.DATABASE_URL.split('/')[-1]
        
        with engine.connect() as conn:
            # 检查数据库是否存在
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
            if not result.fetchone():
                # 创建数据库
                conn.execute(text("COMMIT"))  # 结束当前事务
                conn.execute(text(f"CREATE DATABASE {db_name}"))
                logger.info(f"数据库 {db_name} 创建成功")
            else:
                logger.info(f"数据库 {db_name} 已存在")
                
    except Exception as e:
        logger.error(f"创建数据库失败: {e}")
        # 如果是SQLite，忽略此错误
        if "sqlite" not in settings.DATABASE_URL.lower():
            raise

def create_tables():
    """创建所有表"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        logger.info("所有表创建成功")
        
        return engine
    except Exception as e:
        logger.error(f"创建表失败: {e}")
        raise

def create_admin_user(engine):
    """创建管理员用户"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # 检查是否已存在管理员用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            logger.info("管理员用户已存在")
            db.close()
            return
        
        # 创建管理员用户
        admin_user = User(
            username="admin",
            email="admin@example.com",
            full_name="系统管理员",
            hashed_password=get_password_hash("admin123"),
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        logger.info("管理员用户创建成功")
        logger.info("用户名: admin")
        logger.info("密码: admin123")
        
        db.close()
        
    except Exception as e:
        logger.error(f"创建管理员用户失败: {e}")
        raise

def create_sample_data(engine):
    """创建示例数据"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # 获取管理员用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            logger.warning("未找到管理员用户，跳过创建示例数据")
            db.close()
            return
        
        # 检查是否已有示例文档
        existing_doc = db.query(Document).first()
        if existing_doc:
            logger.info("示例数据已存在")
            db.close()
            return
        
        # 创建示例文档
        sample_doc = Document(
            title="AI知识库使用指南",
            filename="ai_kb_guide.txt",
            file_type="text/plain",
            file_size=1024,
            summary="这是一个关于如何使用AI知识库的指南文档",
            tags=["指南", "AI", "知识库"],
            user_id=admin_user.id
        )
        
        db.add(sample_doc)
        db.commit()
        db.refresh(sample_doc)
        
        # 创建示例文档块
        sample_chunk = DocumentChunk(
            document_id=sample_doc.id,
            content="AI知识库是一个智能的文档管理和问答系统。它可以帮助您管理文档、进行语义搜索和智能问答。",
            chunk_index=0,
            metadata={"section": "introduction"}
        )
        
        db.add(sample_chunk)
        db.commit()
        
        logger.info("示例数据创建成功")
        
        db.close()
        
    except Exception as e:
        logger.error(f"创建示例数据失败: {e}")
        raise

def main():
    """主函数"""
    logger.info("开始初始化数据库...")
    
    try:
        # 1. 创建数据库
        create_database()
        
        # 2. 创建表
        engine = create_tables()
        
        # 3. 创建管理员用户
        create_admin_user(engine)
        
        # 4. 创建示例数据
        create_sample_data(engine)
        
        logger.info("数据库初始化完成！")
        logger.info("您现在可以使用以下凭据登录:")
        logger.info("用户名: admin")
        logger.info("密码: admin123")
        
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()