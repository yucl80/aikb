import openai
from typing import List, Dict, Any, Optional
import time
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.query import Query
from .vector_service import VectorService
from .document_service import DocumentService

class AIService:
    def __init__(self):
        if settings.openai_api_key:
            openai.api_key = settings.openai_api_key
        self.vector_service = VectorService()
        self.document_service = DocumentService()
    
    async def answer_question(self, question: str, user_id: int, db: Session) -> Dict[str, Any]:
        """基于知识库回答问题"""
        start_time = time.time()
        
        # 1. 在向量数据库中搜索相关内容
        search_results = self.vector_service.search(
            query=question,
            n_results=5,
            where={"owner_id": user_id} if user_id else None
        )
        
        # 2. 构建上下文
        context_chunks = search_results.get("documents", [])
        context_metadata = search_results.get("metadatas", [])
        
        if not context_chunks:
            # 即使没有找到相关信息，也要记录查询历史
            response_time = time.time() - start_time
            answer = "抱歉，我在知识库中没有找到相关信息来回答您的问题。"
            query_record = Query(
                question=question,
                answer=answer,
                context=[],
                confidence_score=0.0,
                response_time=response_time,
                user_id=user_id
            )
            
            db.add(query_record)
            db.commit()
            
            return {
                "answer": answer,
                "confidence": 0.0,
                "context": [],
                "response_time": response_time,
                "query_id": query_record.id
            }
        
        # 3. 使用AI生成回答
        answer, confidence = await self._generate_answer_with_context(question, context_chunks)
        
        # 4. 记录查询历史
        response_time = time.time() - start_time
        query_record = Query(
            question=question,
            answer=answer,
            context=context_metadata,
            confidence_score=confidence,
            response_time=response_time,
            user_id=user_id
        )
        
        db.add(query_record)
        db.commit()
        
        return {
            "answer": answer,
            "confidence": confidence,
            "context": context_metadata,
            "response_time": response_time,
            "query_id": query_record.id
        }
    
    async def _generate_answer_with_context(self, question: str, context_chunks: List[str]) -> tuple[str, float]:
        """使用上下文生成回答"""
        if not settings.openai_api_key:
            # 如果没有配置OpenAI API，返回简单的基于关键词的回答
            return self._simple_keyword_answer(question, context_chunks)
        
        try:
            # 构建提示词
            context_text = "\n\n".join(context_chunks[:3])  # 使用前3个最相关的块
            
            prompt = f"""基于以下上下文信息，请回答用户的问题。如果上下文中没有足够的信息来回答问题，请诚实地说明。

上下文信息：
{context_text}

用户问题：{question}

请提供准确、有用的回答："""

            response = await openai.ChatCompletion.acreate(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "你是一个专业的知识库助手，能够基于提供的上下文信息准确回答用户问题。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            answer = response.choices[0].message.content.strip()
            confidence = 0.8  # 基于AI回答的置信度
            
            return answer, confidence
            
        except Exception as e:
            print(f"Error generating AI answer: {e}")
            return self._simple_keyword_answer(question, context_chunks)
    
    def _simple_keyword_answer(self, question: str, context_chunks: List[str]) -> tuple[str, float]:
        """简单的基于关键词的回答（备用方案）"""
        if not context_chunks:
            return "抱歉，我没有找到相关信息。", 0.0
        
        # 简单的关键词匹配和摘要
        question_lower = question.lower()
        best_chunk = ""
        best_score = 0
        
        # 提取关键词（支持中文）
        keywords = []
        # 简单的中文关键词提取
        if '人工智能' in question_lower or 'ai' in question_lower:
            keywords.extend(['人工智能', 'ai', 'artificial', 'intelligence'])
        if '深度学习' in question_lower:
            keywords.extend(['深度学习', '深度', '学习', 'deep', 'learning', '神经网络'])
        if '机器学习' in question_lower:
            keywords.extend(['机器学习', '机器', '学习', 'machine', 'learning'])
        if '知识库' in question_lower:
            keywords.extend(['知识库', '知识', '系统'])
        if '功能' in question_lower:
            keywords.extend(['功能', '特性', '系统功能', '文档上传', '搜索', '问答'])
        if '什么' in question_lower or '介绍' in question_lower:
            keywords.extend(['介绍', '定义', '概念'])
        
        # 如果没有特定关键词，提取所有中文词汇
        if not keywords:
            import re
            # 提取中文词汇和英文单词
            chinese_words = re.findall(r'[\u4e00-\u9fff]+', question_lower)
            english_words = re.findall(r'[a-zA-Z]+', question_lower)
            keywords.extend(chinese_words)
            keywords.extend(english_words)
        
        for chunk in context_chunks:
            chunk_lower = chunk.lower()
            # 计算关键词匹配分数
            score = sum(1 for keyword in keywords if keyword in chunk_lower)
            if score > best_score:
                best_score = score
                best_chunk = chunk
        
        if best_chunk and best_score > 0:
            # 返回最相关的文档片段
            answer = f"根据知识库内容，我找到了以下相关信息：\n\n{best_chunk[:500]}"
            confidence = min(best_score / max(len(keywords), 1) * 0.5, 0.7)
        else:
            answer = "抱歉，我没有找到直接相关的信息。"
            confidence = 0.1
        
        return answer, confidence
    
    async def generate_summary(self, text: str) -> str:
        """生成文本摘要"""
        if not settings.openai_api_key:
            # 简单摘要
            return text[:200] + "..." if len(text) > 200 else text
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "你是一个专业的文档摘要助手，能够生成简洁准确的摘要。"},
                    {"role": "user", "content": f"请为以下文本生成一个简洁的摘要（不超过150字）：\n\n{text[:2000]}"}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating summary: {e}")
            return text[:200] + "..." if len(text) > 200 else text
    
    async def extract_keywords(self, text: str) -> List[str]:
        """提取关键词"""
        if not settings.openai_api_key:
            # 简单的关键词提取
            words = text.split()
            # 过滤常见停用词
            stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}
            keywords = [word for word in words if len(word) > 1 and word not in stop_words]
            return list(set(keywords))[:10]
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "你是一个关键词提取助手，能够从文本中提取最重要的关键词。"},
                    {"role": "user", "content": f"请从以下文本中提取5-10个最重要的关键词，用逗号分隔：\n\n{text[:1000]}"}
                ],
                max_tokens=100,
                temperature=0.3
            )
            
            keywords_text = response.choices[0].message.content.strip()
            keywords = [kw.strip() for kw in keywords_text.split(',')]
            return keywords[:10]
            
        except Exception as e:
            print(f"Error extracting keywords: {e}")
            return []
    
    def get_query_history(self, user_id: int, db: Session, limit: int = 20) -> List[Dict[str, Any]]:
        """获取用户查询历史"""
        queries = db.query(Query).filter(Query.user_id == user_id).order_by(Query.created_at.desc()).limit(limit).all()
        
        result = []
        for query in queries:
            result.append({
                "id": query.id,
                "question": query.question,
                "answer": query.answer or "",
                "confidence_score": query.confidence_score,
                "response_time": query.response_time,
                "created_at": query.created_at.strftime("%Y-%m-%d %H:%M:%S") if query.created_at else ""
            })
        
        return result
    
    def get_popular_queries(self, db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        """获取热门查询"""
        # 这里可以实现更复杂的统计逻辑
        queries = db.query(Query).order_by(Query.created_at.desc()).limit(limit * 2).all()
        
        # 简单的频率统计
        query_counts = {}
        for query in queries:
            question = query.question.lower().strip()
            query_counts[question] = query_counts.get(question, 0) + 1
        
        # 排序并返回
        popular = sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        return [{"question": q, "count": c} for q, c in popular]