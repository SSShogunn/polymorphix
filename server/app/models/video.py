from sqlalchemy import Column, String, Text, BigInteger, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)  
    
    # Basic Info
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # File Info
    original_filename = Column(String(255), nullable=False)
    file_size = Column(BigInteger)
    duration = Column(Integer)
    
    # Supabase Storage URLs
    raw_video_url = Column(Text)
    thumbnail_url = Column(Text)
    
    # Processing
    status = Column(String(20), default="uploading")
    processing_progress = Column(Integer, default=0)
    error_message = Column(Text)
    
    # Metadata
    view_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime(timezone=True))
    
    # Relationships
    formats = relationship("VideoFormat", back_populates="video", cascade="all, delete-orphan")


class VideoFormat(Base):
    __tablename__ = "video_formats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    
    # Format details
    resolution = Column(String(10), nullable=False)
    bitrate = Column(Integer, nullable=False)
    codec = Column(String(20), default="h264")
    
    # Supabase Storage URLs
    manifest_url = Column(Text)
    segment_base_url = Column(Text)
    
    # Metadata
    file_size = Column(BigInteger)
    segment_duration = Column(Integer, default=6)
    segment_count = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    video = relationship("Video", back_populates="formats")