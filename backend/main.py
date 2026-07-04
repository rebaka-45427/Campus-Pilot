from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt

import models, schemas, database, config
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title=config.settings.app_name)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Config
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.settings.secret_key, algorithm=config.settings.algorithm)
    return encoded_jwt

# Dependency for current user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, config.settings.secret_key, algorithms=[config.settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# Helper to log activities
def log_activity(db: Session, user_id: int, action: str, entity_type: str, details: str):
    activity = models.ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        details=details
    )
    db.add(activity)
    db.commit()

# Seed default admin user on startup if doesn't exist
def seed_admin():
    db = database.SessionLocal()
    admin = db.query(models.User).filter(models.User.username == "Rebaka Jesi").first()
    if not admin:
        new_admin = models.User(
            username="Rebaka Jesi",
            password=get_password_hash("password"),
            email="rebaka@campuspilot.edu",
            college="Engineering College",
            department="Computer Science",
            year="Senior"
        )
        db.add(new_admin)
        db.commit()
        
        # Seed settings for admin
        db.refresh(new_admin)
        settings = models.Setting(user_id=new_admin.id)
        db.add(settings)
        db.commit()
    db.close()

seed_admin()

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=config.settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Users / Profile ---
@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.password:
        current_user.password = get_password_hash(user_update.password)
    current_user.email = user_update.email
    current_user.college = user_update.college
    current_user.department = user_update.department
    current_user.year = user_update.year
    db.commit()
    db.refresh(current_user)
    return current_user

# --- Settings ---
@app.get("/settings", response_model=schemas.Setting)
def get_settings(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    setting = db.query(models.Setting).filter(models.Setting.user_id == current_user.id).first()
    if not setting:
        setting = models.Setting(user_id=current_user.id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@app.put("/settings", response_model=schemas.Setting)
def update_settings(setting_update: schemas.SettingUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    setting = db.query(models.Setting).filter(models.Setting.user_id == current_user.id).first()
    if not setting:
        setting = models.Setting(user_id=current_user.id)
        db.add(setting)
    
    setting.theme = setting_update.theme
    setting.accent_color = setting_update.accent_color
    setting.notifications = setting_update.notifications
    setting.email_notifications = setting_update.email_notifications
    setting.desktop_notifications = setting_update.desktop_notifications
    setting.language = setting_update.language
    setting.timezone = setting_update.timezone
    
    db.commit()
    db.refresh(setting)
    return setting

@app.post("/settings/reset", response_model=schemas.Setting)
def reset_settings(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    setting = db.query(models.Setting).filter(models.Setting.user_id == current_user.id).first()
    if setting:
        db.delete(setting)
        db.commit()
    
    new_setting = models.Setting(user_id=current_user.id)
    db.add(new_setting)
    db.commit()
    db.refresh(new_setting)
    return new_setting

# --- Tasks ---
@app.get("/tasks", response_model=List[schemas.Task])
def get_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Task).filter(models.Task.user_id == current_user.id).all()

@app.post("/tasks", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = models.Task(**task.model_dump(), user_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    log_activity(db, current_user.id, "Created", "Task", f"Created task: {db_task.title}")
    return db_task

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task.model_dump(exclude_unset=True)
    
    # Handle completion tracking
    if 'status' in update_data and update_data['status'] == 'completed' and db_task.status != 'completed':
        db_task.completed_at = datetime.now(timezone.utc)
        log_activity(db, current_user.id, "Completed", "Task", f"Completed task: {db_task.title}")
    elif 'status' in update_data and update_data['status'] != 'completed':
        db_task.completed_at = None
        
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    if 'status' not in update_data or update_data['status'] != 'completed':
        log_activity(db, current_user.id, "Updated", "Task", f"Updated task: {db_task.title}")
        
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    
    title = db_task.title
    db.delete(db_task)
    db.commit()
    log_activity(db, current_user.id, "Deleted", "Task", f"Deleted task: {title}")
    return {"message": "Deleted"}

# --- Assignments ---
@app.get("/assignments", response_model=List[schemas.Assignment])
def get_assignments(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Assignment).filter(models.Assignment.user_id == current_user.id).all()

@app.post("/assignments", response_model=schemas.Assignment)
def create_assignment(assignment: schemas.AssignmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_assignment = models.Assignment(**assignment.model_dump(), user_id=current_user.id)
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    log_activity(db, current_user.id, "Created", "Assignment", f"Created assignment: {db_assignment.title}")
    return db_assignment

@app.put("/assignments/{assignment_id}", response_model=schemas.Assignment)
def update_assignment(assignment_id: int, assignment: schemas.AssignmentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id, models.Assignment.user_id == current_user.id).first()
    if not db_assignment: raise HTTPException(status_code=404, detail="Assignment not found")
    
    update_data = assignment.model_dump(exclude_unset=True)
    
    # Handle completion
    if 'status' in update_data and update_data['status'] == 'Completed' and db_assignment.status != 'Completed':
        db_assignment.completed_at = datetime.now(timezone.utc)
        log_activity(db, current_user.id, "Completed", "Assignment", f"Completed assignment: {db_assignment.title}")
    elif 'status' in update_data and update_data['status'] != 'Completed':
        db_assignment.completed_at = None
        
    for key, value in update_data.items():
        setattr(db_assignment, key, value)
        
    db.commit()
    db.refresh(db_assignment)
    
    if 'status' not in update_data or update_data['status'] != 'Completed':
        log_activity(db, current_user.id, "Updated", "Assignment", f"Updated assignment: {db_assignment.title}")
    return db_assignment

@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id, models.Assignment.user_id == current_user.id).first()
    if not db_assignment: raise HTTPException(status_code=404, detail="Assignment not found")
    
    title = db_assignment.title
    db.delete(db_assignment)
    db.commit()
    log_activity(db, current_user.id, "Deleted", "Assignment", f"Deleted assignment: {title}")
    return {"message": "Deleted"}

# --- Attendance / Subjects ---
@app.get("/subjects", response_model=List[schemas.Subject])
def get_subjects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()

@app.post("/subjects", response_model=schemas.Subject)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subject = models.Subject(**subject.model_dump(), user_id=current_user.id)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    log_activity(db, current_user.id, "Created", "Subject", f"Added subject: {db_subject.name}")
    return db_subject

@app.put("/subjects/{subject_id}", response_model=schemas.Subject)
def update_subject(subject_id: int, subject: schemas.SubjectUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.user_id == current_user.id).first()
    if not db_subject: raise HTTPException(status_code=404, detail="Subject not found")
    
    update_data = subject.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subject, key, value)
    
    db.commit()
    db.refresh(db_subject)
    log_activity(db, current_user.id, "Updated", "Subject", f"Updated subject: {db_subject.name}")
    return db_subject

@app.post("/subjects/{subject_id}/present", response_model=schemas.Subject)
def mark_present(subject_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.user_id == current_user.id).first()
    if not db_subject: raise HTTPException(status_code=404, detail="Subject not found")
    
    db_subject.total_classes += 1
    db_subject.classes_attended += 1
    db.commit()
    db.refresh(db_subject)
    log_activity(db, current_user.id, "Marked Present", "Attendance", f"Attended class for: {db_subject.name}")
    return db_subject

@app.post("/subjects/{subject_id}/absent", response_model=schemas.Subject)
def mark_absent(subject_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.user_id == current_user.id).first()
    if not db_subject: raise HTTPException(status_code=404, detail="Subject not found")
    
    db_subject.total_classes += 1
    db.commit()
    db.refresh(db_subject)
    log_activity(db, current_user.id, "Marked Absent", "Attendance", f"Missed class for: {db_subject.name}")
    return db_subject

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.user_id == current_user.id).first()
    if not db_subject: raise HTTPException(status_code=404, detail="Subject not found")
    
    name = db_subject.name
    db.delete(db_subject)
    db.commit()
    log_activity(db, current_user.id, "Deleted", "Subject", f"Deleted subject: {name}")
    return {"message": "Deleted"}

# --- Notes ---
@app.get("/notes", response_model=List[schemas.Note])
def get_notes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Note).filter(models.Note.user_id == current_user.id).order_by(models.Note.is_pinned.desc(), models.Note.created_at.desc()).all()

@app.post("/notes", response_model=schemas.Note)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_note = models.Note(**note.model_dump(), user_id=current_user.id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    log_activity(db, current_user.id, "Created", "Note", f"Created note: {db_note.title}")
    return db_note

@app.put("/notes/{note_id}", response_model=schemas.Note)
def update_note(note_id: int, note: schemas.NoteUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not db_note: raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)
    db.commit()
    db.refresh(db_note)
    log_activity(db, current_user.id, "Updated", "Note", f"Updated note: {db_note.title}")
    return db_note

@app.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not db_note: raise HTTPException(status_code=404, detail="Note not found")
    
    title = db_note.title
    db.delete(db_note)
    db.commit()
    log_activity(db, current_user.id, "Deleted", "Note", f"Deleted note: {title}")
    return {"message": "Deleted"}

@app.put("/notes/{note_id}/pin")
def toggle_pin_note(note_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not db_note: raise HTTPException(status_code=404, detail="Note not found")
    db_note.is_pinned = not db_note.is_pinned
    db.commit()
    return {"message": "Toggled pin"}

@app.put("/notes/{note_id}/archive")
def toggle_archive_note(note_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not db_note: raise HTTPException(status_code=404, detail="Note not found")
    db_note.is_archived = not db_note.is_archived
    db.commit()
    return {"message": "Toggled archive"}

# --- Timetable ---
@app.get("/timetable", response_model=List[schemas.TimetableEntry])
def get_timetable(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.TimetableEntry).filter(models.TimetableEntry.user_id == current_user.id).all()

@app.post("/timetable", response_model=schemas.TimetableEntry)
def create_timetable(entry: schemas.TimetableEntryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_entry = models.TimetableEntry(**entry.model_dump(), user_id=current_user.id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.delete("/timetable/{entry_id}")
def delete_timetable(entry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_entry = db.query(models.TimetableEntry).filter(models.TimetableEntry.id == entry_id, models.TimetableEntry.user_id == current_user.id).first()
    if not db_entry: raise HTTPException(status_code=404, detail="Timetable entry not found")
    db.delete(db_entry)
    db.commit()
    return {"message": "Deleted"}

# --- Activity Logs ---
@app.get("/activity-logs", response_model=List[schemas.ActivityLog])
def get_activity_logs(limit: int = 10, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.ActivityLog).filter(models.ActivityLog.user_id == current_user.id).order_by(models.ActivityLog.created_at.desc()).limit(limit).all()

# --- Search ---
@app.get("/search")
def global_search(q: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    search_query = f"%{q}%"
    
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id, models.Task.title.ilike(search_query)).limit(5).all()
    assignments = db.query(models.Assignment).filter(models.Assignment.user_id == current_user.id, models.Assignment.title.ilike(search_query)).limit(5).all()
    subjects = db.query(models.Subject).filter(models.Subject.user_id == current_user.id, models.Subject.name.ilike(search_query)).limit(5).all()
    notes = db.query(models.Note).filter(models.Note.user_id == current_user.id, models.Note.title.ilike(search_query)).limit(5).all()
    
    return {
        "tasks": [{"id": t.id, "title": t.title, "type": "task"} for t in tasks],
        "assignments": [{"id": a.id, "title": a.title, "type": "assignment"} for a in assignments],
        "subjects": [{"id": s.id, "title": s.name, "type": "subject"} for s in subjects],
        "notes": [{"id": n.id, "title": n.title, "type": "note"} for n in notes]
    }

# --- Analytics ---
@app.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Calculate stats over all entities
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
    assignments = db.query(models.Assignment).filter(models.Assignment.user_id == current_user.id).all()
    subjects = db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()
    
    # Task completion
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == 'completed')
    pending_tasks = total_tasks - completed_tasks
    completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)
    
    # Assignment success
    total_assignments = len(assignments)
    completed_assignments = sum(1 for a in assignments if a.status == 'Completed')
    pending_assignments = total_assignments - completed_assignments
    assignments_rate = round((completed_assignments / total_assignments * 100) if total_assignments > 0 else 0)
    
    # Overall attendance
    total_classes = sum(s.total_classes for s in subjects)
    attended_classes = sum(s.classes_attended for s in subjects)
    attendance_rate = round((attended_classes / total_classes * 100) if total_classes > 0 else 0)
    
    # Category Distribution (Pie Chart)
    categories = {}
    for t in tasks:
        categories[t.category] = categories.get(t.category, 0) + 1
    pieData = [{"name": k, "value": v} for k, v in categories.items()] if categories else [{"name": "No Data", "value": 1}]
    
    # Assignment Pie Chart
    overdue_assignments = sum(1 for a in assignments if a.status not in ['Completed'] and a.deadline.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc))
    assignmentPie = [
        {"name": "Completed", "value": completed_assignments},
        {"name": "Pending", "value": total_assignments - completed_assignments - overdue_assignments},
        {"name": "Overdue", "value": overdue_assignments}
    ]
    if total_assignments == 0: assignmentPie = [{"name": "No Data", "value": 1}]

    # Productivity Score
    productivity_score = round(((completion_rate * 0.4) + (assignments_rate * 0.4) + (attendance_rate * 0.2)))
    
    return {
        "stats": {
            "totalTasks": total_tasks,
            "completedTasks": completed_tasks,
            "pendingTasks": pending_tasks,
            "totalAssignments": total_assignments,
            "completedAssignments": completed_assignments,
            "completionRate": completion_rate,
            "assignmentsRate": assignments_rate,
            "attendanceRate": attendance_rate,
            "productivityScore": productivity_score
        },
        "charts": {
            "taskCategories": pieData,
            "assignmentStatus": assignmentPie
        }
    }
