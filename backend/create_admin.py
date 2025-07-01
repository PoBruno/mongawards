from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models, crud
from dotenv import load_dotenv
import os
import sys

load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

def create_admin_user():
    db: Session = SessionLocal()
    try:
        admin_nickname = os.getenv("ADMIN_NICKNAME")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if not admin_nickname or not admin_password:
            print("Error: ADMIN_NICKNAME and ADMIN_PASSWORD environment variables must be set.", file=sys.stderr)
            sys.exit(1)

        db_admin = crud.get_user_by_nickname(db, nickname=admin_nickname)
        if not db_admin:
            hashed_password = crud.pwd_context.hash(admin_password)
            admin_user = models.Usuario(nickname=admin_nickname, password=hashed_password, admin=True)
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"Admin user '{admin_nickname}' created successfully.")
        else:
            print(f"Admin user '{admin_nickname}' already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
