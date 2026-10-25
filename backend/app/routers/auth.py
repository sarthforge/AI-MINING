from fastapi import APIRouter, Depends

from app.auth import current_user
from app.models import Profile
from app.schemas.auth import AuthMeOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthMeOut, response_model_by_alias=True)
def auth_me(user: Profile = Depends(current_user)) -> AuthMeOut:
    return AuthMeOut(id=user.id, email=user.email, role=user.role)
