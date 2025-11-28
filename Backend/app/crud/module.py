from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.module import Module
from app.schemas.module import ModuleCreate
from uuid import uuid4
from datetime import datetime, timezone
import secrets
import slugify  # type: ignore
from typing import List

# ✅ Fetch all modules
def get_all_modules(db: Session) -> List[Module]:
    return db.query(Module).all()

# ✅ Fetch module by name scoped to a teacher
def get_module_by_name(db: Session, teacher_id: str, name: str) -> Module:
    return db.query(Module).filter(
        Module.teacher_id == teacher_id,
        Module.name == name
    ).first()

# ✅ Fetch module by ID
def get_module_by_id(db: Session, module_id) -> Module:
    return db.query(Module).filter(Module.id == module_id).first()

# ✅ Get module by access code (for students joining)
def get_module_by_access_code(db: Session, access_code: str) -> Module:
    return db.query(Module).filter(Module.access_code == access_code).first()

# ✅ Fetch all modules for a teacher
def get_modules_by_teacher(db: Session, teacher_id: str):
    return db.query(Module).filter(Module.teacher_id == teacher_id).all()

# ✅ Create a new module
def create_module(db: Session, payload: ModuleCreate) -> Module:
    # Get default rubric template
    from app.config.feedback_templates import get_template
    default_rubric = get_template("default")["config"]

    new_module = Module(
        id=uuid4(),
        teacher_id=payload.teacher_id,
        name=payload.name,
        description=payload.description,
        is_active=True,
        due_date=payload.due_date,
        visibility=payload.visibility or "class-only",
        slug=slugify.slugify(payload.name),
        access_code=secrets.token_hex(3).upper(),
        instructions=payload.instructions,
        assignment_config=payload.assignment_config,
        feedback_rubric=default_rubric,  # ✅ Assign default rubric on creation
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module

# ✅ Get or create a module (used in upload flow)
def get_or_create_module(db: Session, teacher_id: str, module_name: str) -> Module:
    module = get_module_by_name(db, teacher_id, module_name)
    if module:
        return module

    # Get default rubric template
    from app.config.feedback_templates import get_template
    default_rubric = get_template("default")["config"]

    new_module = Module(
        id=uuid4(),
        teacher_id=teacher_id,
        name=module_name,
        slug=slugify.slugify(module_name),
        access_code=secrets.token_hex(3).upper(),
        is_active=True,
        feedback_rubric=default_rubric,  # ✅ Assign default rubric on creation
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_module)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return get_module_by_name(db, teacher_id, module_name)

    db.refresh(new_module)
    return new_module

# ✅ Update existing module
def update_module(db: Session, module_id, payload: ModuleCreate):
    module = get_module_by_id(db, module_id)
    if not module:
        return None
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(module, key, value)
    db.commit()
    db.refresh(module)
    return module

# ✅ Delete module
def delete_module(db: Session, module_id):
    module = get_module_by_id(db, module_id)
    if not module:
        return None
    db.delete(module)
    db.commit()
    return module