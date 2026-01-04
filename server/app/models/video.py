from sqlalchemy import (
    Column,
    String,
    Text,
    BigInteger,
    Integer,
    DateTime,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Video(Base):
    __tablename__ = "polymorphix_videos"
    __table_args__ = (
        Index("idx_videos_user_id", "user_id"),
        Index("idx_videos_status", "status"),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
    )

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
    status = Column(String(20), server_default="uploading")
    processing_progress = Column(Integer, server_default="0")
    error_message = Column(Text)

    # Metadata
    view_count = Column(Integer, server_default="0")

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    processed_at = Column(DateTime(timezone=True))

    # Relationships
    formats = relationship(
        "VideoFormat",
        back_populates="video",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class VideoFormat(Base):
    __tablename__ = "video_formats"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    video_id = Column(
        UUID(as_uuid=True),
        ForeignKey("polymorphix_videos.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Format details
    resolution = Column(String(10), nullable=False)
    bitrate = Column(Integer, nullable=False)
    codec = Column(String(20), server_default="h264")

    # Supabase Storage URLs
    manifest_url = Column(Text)
    segment_base_url = Column(Text)

    # Metadata
    file_size = Column(BigInteger)
    segment_duration = Column(Integer, server_default="6")
    segment_count = Column(Integer)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationships
    video = relationship("Video", back_populates="formats")
