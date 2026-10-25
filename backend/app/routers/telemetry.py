from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.telemetry import TelemetryOut
from app.services import telemetry_service

router = APIRouter(tags=["telemetry"])


@router.get("/telemetry", response_model=TelemetryOut, response_model_by_alias=True)
def get_telemetry(db: Session = Depends(get_db)) -> TelemetryOut:
    return telemetry_service.get_telemetry(db)
