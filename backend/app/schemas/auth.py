from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str


class UserRead(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = {"from_attributes": True}


TokenResponse.model_rebuild()
