import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    meetings = relationship("Meeting", back_populates="owner")

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False, default="New Meeting")
    duration = Column(Integer, default=0)
    raw_transcript = Column(Text, nullable=True)
    final_transcript = Column(Text, nullable=True)
    summary_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    owner = relationship("User", back_populates="meetings")
    speakers = relationship("Speaker", back_populates="meeting", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="meeting", cascade="all, delete-orphan")

class Speaker(Base):
    __tablename__ = "speakers"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"))
    original_label = Column(String, nullable=False)
    mapped_name = Column(String, nullable=True)
    
    meeting = relationship("Meeting", back_populates="speakers")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"))
    title = Column(String, nullable=False)
    owner = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    priority = Column(String, default="medium")
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    meeting = relationship("Meeting", back_populates="tasks")

class Embedding(Base):
    __tablename__ = "embeddings"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"))
    chunk_text = Column(Text, nullable=False)