import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import uuid
from ..core.config import settings

class VectorService:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_directory,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection_name = "knowledge_base"
        self.collection = self._get_or_create_collection()
    
    def _get_or_create_collection(self):
        """获取或创建集合"""
        try:
            return self.client.get_collection(name=self.collection_name)
        except:
            return self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Knowledge base documents and chunks"}
            )
    
    def add_document(self, content: str, metadata: Dict[str, Any]) -> str:
        """添加文档到向量数据库"""
        doc_id = str(uuid.uuid4())
        
        self.collection.add(
            documents=[content],
            metadatas=[metadata],
            ids=[doc_id]
        )
        
        return doc_id
    
    def add_chunks(self, chunks: List[str], metadatas: List[Dict[str, Any]]) -> List[str]:
        """批量添加文档块"""
        chunk_ids = [str(uuid.uuid4()) for _ in chunks]
        
        self.collection.add(
            documents=chunks,
            metadatas=metadatas,
            ids=chunk_ids
        )
        
        return chunk_ids
    
    def search(self, query: str, n_results: int = 5, where: Optional[Dict] = None) -> Dict[str, Any]:
        """语义搜索"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where
        )
        
        return {
            "documents": results["documents"][0] if results["documents"] else [],
            "metadatas": results["metadatas"][0] if results["metadatas"] else [],
            "distances": results["distances"][0] if results["distances"] else [],
            "ids": results["ids"][0] if results["ids"] else []
        }
    
    def delete_document(self, doc_id: str):
        """删除文档"""
        try:
            self.collection.delete(ids=[doc_id])
        except Exception as e:
            print(f"Error deleting document {doc_id}: {e}")
    
    def delete_chunks(self, chunk_ids: List[str]):
        """批量删除文档块"""
        try:
            self.collection.delete(ids=chunk_ids)
        except Exception as e:
            print(f"Error deleting chunks: {e}")
    
    def update_document(self, doc_id: str, content: str, metadata: Dict[str, Any]):
        """更新文档"""
        self.collection.update(
            ids=[doc_id],
            documents=[content],
            metadatas=[metadata]
        )
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """获取集合统计信息"""
        try:
            count = self.collection.count()
            return {
                "total_documents": count,
                "collection_name": self.collection_name
            }
        except Exception as e:
            return {
                "total_documents": 0,
                "collection_name": self.collection_name,
                "error": str(e)
            }