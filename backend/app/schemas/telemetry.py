from pydantic import Field

from app.schemas.common import CamelModel


class TelemetryOut(CamelModel):
    constellation: str | None = None
    orbit_mode: str | None = None
    last_pass_utc: str | None = Field(None, serialization_alias="lastPassUTC")
    next_pass_eta: str | None = Field(None, serialization_alias="nextPassETA")
    cloud_coverage: str | None = None
    sun_azimuth: str | None = None
    sensor_bands: str | None = None
    ground_sampling_distance: str | None = None
    cadastre_sync: str | None = None
