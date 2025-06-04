from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Query(Base):
    __tablename__ = "queries"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text)
    context = Column(JSON)  # 相关文档片段
    confidence_score = Column(Float)
    response_time = Column(Float)  # 响应时间（秒）
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    user = relationship("User", back_populates="queries")

class KnowledgeGraph(Base):
    __tablename__ = "knowledge_graph"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=False)
    properties = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KnowledgeRelation(Base):
    __tablename__ = "knowledge_relations"
    
    id = Column(Integer, primary_key=True, index=True)
    source_entity_id = Column(Integer, ForeignKey("knowledge_graph.id"))
    target_entity_id = Column(Integer, ForeignKey("knowledge_graph.id"))
    relation_type = Column(String(100), nullable=False)
    confidence = Column(Float, default=1.0)
    properties = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())