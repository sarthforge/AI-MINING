from datetime import date as Date

from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel


class MonthlyChangePointOut(CamelModel):
    month: str = Field(validation_alias=AliasChoices("month_label", "month"))
    date: Date = Field(validation_alias=AliasChoices("obs_date", "date"))
    permitted_cap_ha: float
    total_excavation_ha: float
    unauthorized_ha: float
    vegetation_index_ndvi: float = Field(
        validation_alias=AliasChoices("vegetation_index_ndvi", "vegetationIndexNDVI"),
        serialization_alias="vegetationIndexNDVI",
    )
    turbidity_index: float
