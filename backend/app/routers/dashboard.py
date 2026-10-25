from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.kpi import DashboardKpisOut
from app.services import kpi_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=DashboardKpisOut, response_model_by_alias=True)
def get_kpis(db: Session = Depends(get_db)) -> DashboardKpisOut:
    return kpi_service.get_kpis(db)
