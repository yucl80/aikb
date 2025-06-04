#!/usr/bin/env python3
"""
数据库初始化脚本
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.models.query import Query

def init_database():
    """初始化数据库"""
    print("正在创建数据库表...")
    
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    print("数据库初始化完成！")
    print(f"数据库文件位置: {engine.url}")

if __name__ == "__main__":
    init_database()