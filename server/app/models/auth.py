"""
Minimal model for Supabase auth.users table.
This table is managed by Supabase, but we need to define it here
so SQLAlchemy can resolve foreign key relationships.
"""

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class AuthUser(Base):
    __tablename__ = "users"
    __table_args__ = {
        "schema": "auth"
    } 

    id = Column(UUID(as_uuid=True), primary_key=True)
