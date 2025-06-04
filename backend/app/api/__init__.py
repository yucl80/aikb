from fastapi import APIRouter
from .auth import router as auth_router
from .documents import router as documents_router
from .ai import router as ai_router
from .v1.system import router as system_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(documents_router)
api_router.include_router(ai_router)
api_router.include_router(system_router, prefix="/system", tags=["system"])