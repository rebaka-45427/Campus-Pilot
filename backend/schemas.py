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
    notes: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    status: Optional[str] = None

class Task(TaskBase):
    id: int
    status: str
    created_at: datetime
    user_id: int
    class Config:
        from_attributes = True

class AssignmentBase(BaseModel):
    subject: str
    title: str
    deadline: datetime
    status: str = "Pending"

class AssignmentCreate(AssignmentBase):
    pass

class Assignment(AssignmentBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    name: str
    total_classes: int = 0
    classes_attended: int = 0

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str
    content: str
    is_pinned: bool = False

class NoteCreate(NoteBase):
    pass

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
