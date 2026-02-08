import re
from pydantic import BaseModel, Field, field_validator


class VideoUploadParams(BaseModel):
    """Schema for validating video upload form parameters."""
    
    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        strip_whitespace=True,
        description="Video title (1-255 characters)"
    )
    description: str = Field(
        ...,
        max_length=2000,
        strip_whitespace=True,
        description="Video description (max 2000 characters)"
    )
    
    @field_validator('title', 'description')
    @classmethod
    def sanitize_text(cls, value: str) -> str:
        """Strip HTML tags from text input."""
        if not value:
            return value
        sanitized = re.sub(r'<[^>]+>', '', value)
        return sanitized.strip()


class VideoUpdate(BaseModel):
    """Schema for validating video update parameters with optional fields."""
    
    title: str | None = Field(
        None,
        min_length=1,
        max_length=255,
        strip_whitespace=True,
        description="Video title (1-255 characters)"
    )
    description: str | None = Field(
        None,
        max_length=2000,
        strip_whitespace=True,
        description="Video description (max 2000 characters)"
    )
    
    @field_validator('title', 'description')
    @classmethod
    def sanitize_text(cls, value: str | None) -> str | None:
        if not value:
            return value
        sanitized = re.sub(r'<[^>]+>', '', value)
        return sanitized.strip()


class DeleteAllResponse(BaseModel):
    deleted: int
    message: str

