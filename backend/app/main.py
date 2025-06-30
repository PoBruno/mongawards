from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form
from typing import Optional
from sqlalchemy.orm import Session
import os
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
import shutil
from starlette.responses import FileResponse

from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = crud.get_user_by_nickname(db, nickname=token)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_admin_user(current_user: schemas.Usuario = Depends(get_current_user)):
    if not current_user.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@app.post("/users/", response_model=schemas.Usuario)
def create_user(user: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if user.secret_code != os.getenv("SECRET_CODE"):
        raise HTTPException(status_code=400, detail="Invalid secret code")
    db_user = crud.get_user_by_nickname(db, nickname=user.nickname)
    if db_user:
        raise HTTPException(status_code=400, detail="Nickname already registered")
    return crud.create_user(db=db, user=user)


@app.post("/token")
def login(form_data: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_nickname(db, nickname=form_data.nickname)
    if not user or not crud.pwd_context.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect nickname or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": user.nickname, "token_type": "bearer"}


@app.get("/categorias/", response_model=list[schemas.Categoria])
def read_categorias(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.Usuario = Depends(get_current_user)):
    if current_user.admin:
        categorias = crud.get_categorias(db, skip=skip, limit=limit)
    else:
        categorias = crud.get_categorias(db, skip=skip, limit=limit, is_active=True)
    return categorias


@app.post("/categorias/", response_model=schemas.Categoria)
def create_categoria(
    nome: str = Form(...),
    descricao: str = Form(...),
    banner: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    banner_path = None
    if banner:
        upload_dir = "../frontend/static/banners"
        os.makedirs(upload_dir, exist_ok=True)
        file_location = os.path.join(upload_dir, banner.filename)
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(banner.file, file_object)
        banner_path = f"/static/banners/{banner.filename}"
    categoria_create = schemas.CategoriaCreate(nome=nome, descricao=descricao, banner=banner_path)
    return crud.create_categoria(db=db, categoria=categoria_create, banner_path=banner_path)


@app.put("/categorias/{categoria_id}/status", response_model=schemas.Categoria)
def update_categoria_status(
    categoria_id: int,
    status: schemas.CategoriaUpdateStatus,
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    db_categoria = crud.update_categoria_status(db, categoria_id, status.is_active)
    if db_categoria is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_categoria


@app.get("/indicados/", response_model=list[schemas.Indicado])
def read_indicados(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    indicados = crud.get_indicados(db, skip=skip, limit=limit)
    return indicados


@app.post("/indicados/", response_model=schemas.Indicado)
def create_indicado(
    nome: str = Form(...),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    foto_path = None
    if foto:
        upload_dir = "../frontend/static/fotos"
        os.makedirs(upload_dir, exist_ok=True)
        file_location = os.path.join(upload_dir, foto.filename)
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(foto.file, file_object)
        foto_path = f"/static/fotos/{foto.filename}"
    indicado_create = schemas.IndicadoCreate(nome=nome, foto=foto_path)
    return crud.create_indicado(db=db, indicado=indicado_create, foto_path=foto_path)


@app.post("/indicados_categorias/", response_model=schemas.IndicadosCategoria)
def create_indicado_categoria(
    indicado_categoria: schemas.IndicadosCategoriaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    return crud.create_indicado_categoria(db=db, indicado_categoria=indicado_categoria)


@app.post("/votar/")
def votar(voto: schemas.Voto, current_user: schemas.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    db_voto = crud.get_votos_by_user_and_category(db, usuario_id=current_user.id, categoria_id=voto.categoria_id)
    if db_voto:
        raise HTTPException(status_code=400, detail="User has already voted in this category")
    return crud.create_voto(db=db, voto=voto, usuario_id=current_user.id)


@app.get("/results/")
def get_results(db: Session = Depends(get_db), current_user: schemas.Usuario = Depends(get_current_admin_user)):
    return crud.get_results(db)

@app.get("/")
async def read_index():
    return FileResponse("../frontend/index.html")

@app.get("/dashboard.html")
async def read_dashboard():
    return FileResponse("../frontend/dashboard.html")

@app.get("/admin.html")
async def read_admin():
    return FileResponse("../frontend/admin.html")

@app.get("/indicados_categorias/", response_model=list[schemas.IndicadosCategoria])
def read_indicados_categorias(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    indicados_categorias = crud.get_indicados_categorias(db, skip=skip, limit=limit)
    return indicados_categorias

app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")
