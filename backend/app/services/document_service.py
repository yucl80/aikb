import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
import PyPDF2
import docx
import markdown
from bs4 import BeautifulSoup
import aiofiles
from sqlalchemy.orm import Session

from ..models.document import Document, DocumentChunk
from ..core.config import settings
from .vector_service import VectorService

class DocumentService:
    def __init__(self):
        self.vector_service = VectorService()
        self.supported_types = {
            'application/pdf': self._extract_pdf_text,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._extract_docx_text,
            'text/plain': self._extract_text,
            'text/markdown': self._extract_markdown_text,
            'text/html': self._extract_html_text
        }
    
    async def upload_document(self, file: UploadFile, user_id: int, db: Session) -> Document:
        """上传并处理文档"""
        # 验证文件类型
        if file.content_type not in self.supported_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )
        
        # 生成唯一文件名
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.upload_dir, unique_filename)
        
        # 保存文件
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # 提取文本内容
        text_content = await self._extract_text_content(file_path, file.content_type)
        
        # 生成摘要（这里可以集成AI生成摘要）
        summary = self._generate_summary(text_content)
        
        # 创建文档记录
        document = Document(
            title=file.filename,
            file_name=unique_filename,
            file_path=file_path,
            file_type=file.content_type,
            file_size=len(content),
            content=text_content,
            summary=summary,
            status="processing",
            owner_id=user_id,
            doc_metadata={
                "original_filename": file.filename,
                "upload_timestamp": str(uuid.uuid4())
            }
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # 分块并存储到向量数据库
        await self._process_document_chunks(document, db)
        
        return document
    
    async def _extract_text_content(self, file_path: str, content_type: str) -> str:
        """根据文件类型提取文本内容"""
        extractor = self.supported_types.get(content_type)
        if not extractor:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        return await extractor(file_path)
    
    async def _extract_pdf_text(self, file_path: str) -> str:
        """提取PDF文本"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting PDF text: {str(e)}")
        return text
    
    async def _extract_docx_text(self, file_path: str) -> str:
        """提取Word文档文本"""
        try:
            doc = docx.Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting DOCX text: {str(e)}")
        return text
    
    async def _extract_text(self, file_path: str) -> str:
        """提取纯文本"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as file:
                text = await file.read()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading text file: {str(e)}")
        return text
    
    async def _extract_markdown_text(self, file_path: str) -> str:
        """提取Markdown文本"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as file:
                md_content = await file.read()
                html = markdown.markdown(md_content)
                soup = BeautifulSoup(html, 'html.parser')
                text = soup.get_text()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting Markdown text: {str(e)}")
        return text
    
    async def _extract_html_text(self, file_path: str) -> str:
        """提取HTML文本"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as file:
                html_content = await file.read()
                soup = BeautifulSoup(html_content, 'html.parser')
                text = soup.get_text()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting HTML text: {str(e)}")
        return text
    
    def _generate_summary(self, text: str, max_length: int = 500) -> str:
        """生成文档摘要（简单版本，可以后续集成AI）"""
        if len(text) <= max_length:
            return text
        
        # 简单的摘要生成：取前几句话
        sentences = text.split('。')
        summary = ""
        for sentence in sentences:
            if len(summary + sentence) <= max_length:
                summary += sentence + "。"
            else:
                break
        
        return summary or text[:max_length] + "..."
    
    async def _process_document_chunks(self, document: Document, db: Session):
        """处理文档分块并存储到向量数据库"""
        # 简单的分块策略：按段落或固定长度分块
        chunks = self._split_text_into_chunks(document.content)
        
        chunk_metadatas = []
        chunk_contents = []
        
        for i, chunk_content in enumerate(chunks):
            metadata = {
                "document_id": document.id,
                "chunk_index": i,
                "document_title": document.title,
                "file_type": document.file_type,
                "owner_id": document.owner_id
            }
            chunk_metadatas.append(metadata)
            chunk_contents.append(chunk_content)
        
        # 存储到向量数据库
        chunk_ids = self.vector_service.add_chunks(chunk_contents, chunk_metadatas)
        
        # 存储块信息到数据库
        for i, (chunk_content, vector_id) in enumerate(zip(chunk_contents, chunk_ids)):
            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=i,
                content=chunk_content,
                vector_id=vector_id,
                chunk_metadata=chunk_metadatas[i]
            )
            db.add(chunk)
        
        db.commit()
    
    def _split_text_into_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """将文本分割成块"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # 尝试在句号处分割
            if end < len(text):
                last_period = text.rfind('。', start, end)
                if last_period != -1 and last_period > start + chunk_size // 2:
                    end = last_period + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks
    
    def search_documents(self, query: str, user_id: Optional[int] = None, limit: int = 5) -> Dict[str, Any]:
        """搜索文档"""
        where_filter = {}
        if user_id:
            where_filter["owner_id"] = user_id
        
        results = self.vector_service.search(
            query=query,
            n_results=limit,
            where=where_filter if where_filter else None
        )
        
        return results
    
    def delete_document(self, document_id: int, db: Session):
        """删除文档"""
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # 删除向量数据库中的数据
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
        chunk_ids = [chunk.vector_id for chunk in chunks if chunk.vector_id]
        
        if chunk_ids:
            self.vector_service.delete_chunks(chunk_ids)
        
        # 删除文件
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # 删除数据库记录
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        db.delete(document)
        db.commit()
    
    def get_user_documents(self, user_id: int, db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
        """获取用户的文档列表"""
        return db.query(Document).filter(Document.owner_id == user_id).offset(skip).limit(limit).all()