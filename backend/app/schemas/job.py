from datetime import date
from typing import Any, Literal
from uuid import UUID

from pydantic import Field

from app.schemas.common import CamelModel


class AnalysisCreate(CamelModel):
    site_id: str
    baseline_date: date
    current_image_date: date


class AnalysisJobOut(CamelModel):
    job_id: UUID = Field(validation_alias="id")
    site_id: str
    status: Literal["QUEUED", "RUNNING", "DONE", "FAILED"] = Field(validation_alias="job_status")
    progress: int
    error: str | None = Field(None, validation_alias="error_message")
    result: dict[str, Any] | None = Field(None, validation_alias="result_json")
