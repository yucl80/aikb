from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.query import Query
from sqlalchemy import func
import os

router = APIRouter()

@router.get("/stats")
async def get_system_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取系统统计信息"""
    try:
        # 统计文档数量
        total_documents = db.query(Document).count()
        
        # 统计查询数量
        total_queries = db.query(Query).count()
        
        # 统计用户数量
        total_users = db.query(User).count()
        
        # 计算存储使用情况（简单估算）
        storage_used = "0 MB"
        try:
            db_path = "knowledge_base.db"
            if os.path.exists(db_path):
                size_bytes = os.path.getsize(db_path)
                size_mb = round(size_bytes / (1024 * 1024), 2)
                storage_used = f"{size_mb} MB"
        except Exception:
            pass
        
        return {
            "total_documents": total_documents,
            "total_queries": total_queries,
            "total_users": total_users,
            "storage_used": storage_used
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")