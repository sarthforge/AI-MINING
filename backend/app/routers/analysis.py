from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.db import get_db
from app.models import Profile
from app.schemas.job import AnalysisCreate, AnalysisJobOut
from app.services import analysis_service

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post(
    "",
    response_model=AnalysisJobOut,
    response_model_by_alias=True,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_analysis(
    body: AnalysisCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: Profile = Depends(require_admin),
) -> AnalysisJobOut:
    job = analysis_service.enqueue(
        db,
        site_id=body.site_id,
        baseline_date=body.baseline_date,
        current_image_date=body.current_image_date,
        created_by=user.id,
    )
    background_tasks.add_task(analysis_service.run_analysis, str(job.job_id))
    return job


@router.get("/{job_id}", response_model=AnalysisJobOut, response_model_by_alias=True)
def get_analysis(job_id: UUID, db: Session = Depends(get_db)) -> AnalysisJobOut:
    return analysis_service.get_job(db, job_id)
