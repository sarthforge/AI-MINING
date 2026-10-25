from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.services import export_service

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/sites.csv")
def export_sites_csv(db: Session = Depends(get_db)) -> Response:
    body = export_service.sites_csv(db)
    return Response(
        content=body,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="sites.csv"'},
    )
