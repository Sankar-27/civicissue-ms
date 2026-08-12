from fastapi import APIRouter

from . import admin, auth, issues

router = APIRouter()
router.include_router(auth.router)
router.include_router(issues.router)
router.include_router(admin.router)
