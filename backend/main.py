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
    return db_task

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    if task.status: db_task.status = task.status
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not db_task: raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
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
    return db_assignment

@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id, models.Assignment.user_id == current_user.id).first()
    if not db_assignment: raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(db_assignment)
    db.commit()
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
    return db_subject

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.user_id == current_user.id).first()
    if not db_subject: raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(db_subject)
    db.commit()
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
    return db_note

@app.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not db_note: raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return {"message": "Deleted"}

@app.put("/notes/{note_id}/pin")
def toggle_pin_note(note_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not db_note: raise HTTPException(status_code=404, detail="Note not found")
    db_note.is_pinned = not db_note.is_pinned
    db.commit()
    return {"message": "Toggled"}

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
