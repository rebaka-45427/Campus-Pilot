from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String) # Hashed using bcrypt
    email = Column(String, unique=True, index=True, nullable=True)
    college = Column(String, nullable=True)
    department = Column(String, nullable=True)
    year = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String)
    priority = Column(String)
    deadline = Column(DateTime(timezone=True), nullable=True)
    estimated_time = Column(String, nullable=True)
    status = Column(String, default="pending")
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    title = Column(String)
    description = Column(String, nullable=True)
    priority = Column(String, default="Medium")
    deadline = Column(DateTime(timezone=True))
    status = Column(String, default="Pending") # Pending, In Progress, Completed, Overdue
    completed_at = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    total_classes = Column(Integer, default=0)
    classes_attended = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    is_pinned = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

class TimetableEntry(Base):
    __tablename__ = "timetable"
    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String) # Monday, Tuesday, etc.
    start_time = Column(String)
    end_time = Column(String)
    subject = Column(String)
    room = Column(String, nullable=True)
    teacher = Column(String, nullable=True)
    color = Column(String, default="bg-purple-100")
    user_id = Column(Integer, ForeignKey("users.id"))

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    theme = Column(String, default="light")
    accent_color = Column(String, default="purple")
    notifications = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=False)
    desktop_notifications = Column(Boolean, default=False)
    language = Column(String, default="English")
    timezone = Column(String, default="UTC")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    entity_type = Column(String)
    details = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
