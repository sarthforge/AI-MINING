import csv
import io

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MiningSite


CSV_COLUMNS = [
    "id",
    "code",
    "name",
    "region",
    "country",
    "totalAreaHa",
    "newExcavationHa",
    "changePercentage",
    "confidenceScore",
    "concessionStatus",
    "alertStatus",
    "lastObservationDate",
    "baselineDate",
    "ndviBaseline",
    "ndviCurrent",
]


def sites_csv(db: Session) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_COLUMNS, lineterminator="\n")
    writer.writeheader()
    for s in db.scalars(select(MiningSite).order_by(MiningSite.id)).all():
        writer.writerow(
            {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "region": s.region,
                "country": s.country,
                "totalAreaHa": s.total_area_ha,
                "newExcavationHa": s.new_excavation_ha,
                "changePercentage": s.change_percentage,
                "confidenceScore": s.confidence_score,
                "concessionStatus": s.concession_status,
                "alertStatus": s.alert_status,
                "lastObservationDate": s.last_observation_date.isoformat(),
                "baselineDate": s.baseline_date.isoformat(),
                "ndviBaseline": s.ndvi_baseline,
                "ndviCurrent": s.ndvi_current,
            }
        )
    return buf.getvalue()
