from sqlalchemy.orm import Session

from app.errors import AppError
from app.models.telemetry import TelemetryStatus
from app.schemas.telemetry import TelemetryOut


def get_telemetry(db: Session) -> TelemetryOut:
    row = db.get(TelemetryStatus, 1)
    if row is None:
        raise AppError(404, "NOT_FOUND", "Telemetry status not found")
    return TelemetryOut.model_validate(row)
