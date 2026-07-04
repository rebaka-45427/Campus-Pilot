from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    category: str
    priority: str
    deadline: Optional[datetime] = None
    estimated_time: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    estimated_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Task(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class AssignmentBase(BaseModel):
    subject: str
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    deadline: datetime
    status: str = "Pending"

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    subject: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

class Assignment(AssignmentBase):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    name: str
    total_classes: int = 0
    classes_attended: int = 0

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    total_classes: Optional[int] = None
    classes_attended: Optional[int] = None

class Subject(SubjectBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str
    content: str
    is_pinned: Optional[bool] = False
    is_archived: Optional[bool] = False

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None

class Note(NoteBase):
    id: int
    created_at: datetime
    user_id: int
    class Config:
        from_attributes = True

class TimetableEntryBase(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    subject: str
    room: Optional[str] = None
    teacher: Optional[str] = None
    color: str = "bg-purple-100"

class TimetableEntryCreate(TimetableEntryBase):
    pass

class TimetableEntry(TimetableEntryBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class SettingBase(BaseModel):
    theme: str = "light"
    accent_color: str = "purple"
    notifications: bool = True
    email_notifications: bool = False
    desktop_notifications: bool = False
    language: str = "English"
    timezone: str = "UTC"

class SettingUpdate(SettingBase):
    pass

class Setting(SettingBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- Activity Log Schemas ---
class ActivityLogBase(BaseModel):
    action: str
    entity_type: str
    details: str

class ActivityLog(ActivityLogBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True
