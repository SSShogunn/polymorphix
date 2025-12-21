from pydantic import BaseModel, EmailStr

# Request schemas
class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    
class UserSignIn(BaseModel):
    email: EmailStr
    password: str

# Response schemas
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: str