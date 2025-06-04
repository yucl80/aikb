from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, field_validator

from ..core.database import get_db
from ..models.user import User
from ..models.document import Document
from ..services.document_service import DocumentService
from .auth import get_current_active_user

router = APIRouter(prefix="/documents", tags=["documents"])

# Pydantic模型
class DocumentResponse(BaseModel):
    id: int
    title: str
    file_name: str
    file_type: str
    file_size: int
    summary: Optional[str] = None
    tags: Optional[List[str]] = []
    status: str
    created_at: str
    updated_at: Optional[str] = None
    
    @field_validator('tags', mode='before')
    @classmethod
    def validate_tags(cls, v):
        if v is None:
            return []
        return v
    
    @field_validator('created_at', mode='before')
    @classmethod
    def validate_created_at(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    @field_validator('updated_at', mode='before')
    @classmethod
    def validate_updated_at(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    class Config:
        from_attributes = True

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

class SearchResult(BaseModel):
    documents: List[str]
    metadatas: List[dict]
    distances: List[float]
    ids: List[str]

# 初始化服务
document_service = DocumentService()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """上传文档"""
    try:
        document = await document_service.upload_document(file, current_user.id, db)
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[DocumentResponse])
def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户的文档列表"""
    documents = document_service.get_user_documents(current_user.id, db, skip, limit)
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取特定文档"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除文档"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        document_service.delete_document(document_id, db)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=SearchResult)
def search_documents(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_active_user)
):
    """搜索文档"""
    try:
        results = document_service.search_documents(
            query=search_request.query,
            user_id=current_user.id,
            limit=search_request.limit
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{document_id}/content")
def get_document_content(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取文档内容"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": document.id,
        "title": document.title,
        "content": document.content,
        "summary": document.summary
    }

@router.put("/{document_id}/tags")
def update_document_tags(
    document_id: int,
    tags: List[str],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新文档标签"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.tags = tags
    db.commit()
    
    return {"message": "Tags updated successfully", "tags": tags}