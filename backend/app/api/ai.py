from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..core.database import get_db
from ..models.user import User
from ..models.query import Query
from ..services.ai_service import AIService
from .auth import get_current_active_user

router = APIRouter(prefix="/ai", tags=["ai"])

# Pydantic模型
class QuestionRequest(BaseModel):
    question: str

class AnswerResponse(BaseModel):
    answer: str
    confidence: float
    context: List[Dict[str, Any]]
    response_time: float
    query_id: int

class QueryHistoryResponse(BaseModel):
    id: int
    question: str
    answer: str
    confidence_score: float = None
    response_time: float = None
    created_at: str
    
    class Config:
        from_attributes = True

class PopularQuery(BaseModel):
    question: str
    count: int

class SummaryRequest(BaseModel):
    text: str

class KeywordsRequest(BaseModel):
    text: str

# 初始化服务
ai_service = AIService()

@router.post("/ask", response_model=AnswerResponse)
async def ask_question(
    request: QuestionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """AI问答"""
    try:
        result = await ai_service.answer_question(
            question=request.question,
            user_id=current_user.id,
            db=db
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_query_history(
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取查询历史"""
    try:
        queries = ai_service.get_query_history(current_user.id, db, limit)
        return queries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/popular", response_model=List[PopularQuery])
def get_popular_queries(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """获取热门查询"""
    try:
        popular_queries = ai_service.get_popular_queries(db, limit)
        return popular_queries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summary")
async def generate_summary(
    request: SummaryRequest,
    current_user: User = Depends(get_current_active_user)
):
    """生成文本摘要"""
    try:
        summary = await ai_service.generate_summary(request.text)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/keywords")
async def extract_keywords(
    request: KeywordsRequest,
    current_user: User = Depends(get_current_active_user)
):
    """提取关键词"""
    try:
        keywords = await ai_service.extract_keywords(request.text)
        return {"keywords": keywords}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_ai_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取AI使用统计"""
    try:
        # 用户查询统计
        total_queries = db.query(Query).filter(Query.user_id == current_user.id).count()
        
        # 平均响应时间
        avg_response_time = db.query(Query).filter(
            Query.user_id == current_user.id,
            Query.response_time.isnot(None)
        ).with_entities(Query.response_time).all()
        
        avg_time = 0
        if avg_response_time:
            avg_time = sum(t[0] for t in avg_response_time) / len(avg_response_time)
        
        # 平均置信度
        avg_confidence = db.query(Query).filter(
            Query.user_id == current_user.id,
            Query.confidence_score.isnot(None)
        ).with_entities(Query.confidence_score).all()
        
        avg_conf = 0
        if avg_confidence:
            avg_conf = sum(c[0] for c in avg_confidence) / len(avg_confidence)
        
        return {
            "total_queries": total_queries,
            "average_response_time": round(avg_time, 2),
            "average_confidence": round(avg_conf, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))