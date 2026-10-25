"""Supabase JWT verification. shortcut: HS256 shared secret; upgrade to JWKS if project uses asymmetric keys."""

from __future__ import annotations

from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.errors import AppError
from app.models import Profile

_bearer = HTTPBearer(auto_error=False)


def current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Profile:
    if cred is None or not cred.credentials:
        raise AppError(401, "UNAUTHORIZED", "Missing or expired token")
    if not settings.supabase_jwt_secret:
        raise AppError(500, "CONFIG", "SUPABASE_JWT_SECRET is not set")
    try:
        claims = jwt.decode(
            cred.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as exc:
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token") from exc
    sub = claims.get("sub")
    if not sub:
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token")
    profile = db.get(Profile, UUID(sub))
    if profile is None:
        raise AppError(401, "UNAUTHORIZED", "No profile")
    return profile


def require_admin(user: Profile = Depends(current_user)) -> Profile:
    if user.role != "admin":
        raise AppError(403, "FORBIDDEN", "Admin only")
    return user
