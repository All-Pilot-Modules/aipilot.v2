from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    profile_image: Optional[str] = None
    role: Optional[str] = None  # ✅ Now optional

class UserCreate(UserBase):
    id: str  # Required Banner ID
    password: str  # Required password for registration

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    profile_image: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    is_email_verified: bool

    class Config:
        from_attributes = True

# Auth-specific schemas
class UserLogin(BaseModel):
    identifier: str  # Can be Banner ID or email
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None