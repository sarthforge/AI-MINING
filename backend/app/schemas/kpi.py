from app.schemas.common import CamelModel


class DashboardKpisOut(CamelModel):
    total_sites: int
    active_alerts: int
    critical_alerts: int
    total_new_excavation_ha: float
    average_confidence: float
    boundary_breaches: int
    average_ndvi_drop: float
