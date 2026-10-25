from uuid import UUID

from app.schemas.common import CamelModel


class AuthMeOut(CamelModel):
    id: UUID
    email: str
    role: str
