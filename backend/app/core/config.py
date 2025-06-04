from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # 应用配置
    app_name: str = "AI Knowledge Base"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # 数据库配置
    database_url: str = "sqlite:///./knowledge_base.db"
    redis_url: str = "redis://localhost:6379"
    
    # OpenAI配置
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-3.5-turbo"
    
    # JWT配置
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # 文件上传配置
    max_file_size: str = "50MB"
    upload_dir: str = "./uploads"
    
    # ChromaDB配置
    chroma_persist_directory: str = "./chroma_db"
    
    # CORS配置
    allowed_origins: list = ["*"]
    allowed_methods: list = ["*"]
    allowed_headers: list = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# 确保上传目录存在
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.chroma_persist_directory, exist_ok=True)