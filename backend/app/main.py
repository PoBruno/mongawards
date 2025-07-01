from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form, Response, Cookie
from typing import Optional
from sqlalchemy.orm import Session
import os
from fastapi.staticfiles import StaticFiles
import shutil
from starlette.responses import FileResponse
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from PIL import Image
from io import BytesIO
from uuid import uuid4

from . import crud, models, schemas
from .database import SessionLocal, engine

app = FastAPI()

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Helper function to save and process images
async def save_image_file(upload_file: UploadFile, upload_dir: str, max_size: tuple = (800, 600)) -> str:
    os.makedirs(upload_dir, exist_ok=True)
    file_extension = upload_file.filename.split(".")[-1].lower()
    unique_filename = f"{uuid4()}.webp"
    file_path = os.path.join(upload_dir, unique_filename)

    # Read image into PIL and convert to WebP
    image_data = await upload_file.read()
    img = Image.open(BytesIO(image_data))
    img.thumbnail(max_size, Image.LANCZOS) # Resize while maintaining aspect ratio

    # Save as WebP
    img.save(file_path, "webp")

    return f"/static/{os.path.basename(upload_dir)}/{unique_filename}"

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(access_token: Optional[str] = Cookie(None), db: Session = Depends(get_db)):
    if access_token is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = crud.get_user_by_nickname(db, nickname=access_token)
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
def login(response: Response, form_data: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_nickname(db, nickname=form_data.nickname)
    if not user or not crud.pwd_context.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect nickname or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    response.set_cookie(key="access_token", value=user.nickname, httponly=True)
    return {"message": "Login successful", "is_admin": user.admin}

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logout successful"}

@app.get("/check-admin", response_model=bool)
def check_admin(current_user: schemas.Usuario = Depends(get_current_user)):
    return current_user.admin

@app.get("/categorias/", response_model=list[schemas.Categoria])
def read_categorias(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: schemas.Usuario = Depends(get_current_user)):
    if current_user.admin:
        categorias = crud.get_categorias(db, skip=skip, limit=limit)
    else:
        categorias = crud.get_categorias(db, skip=skip, limit=limit, is_active=True)
    return categorias


@app.get("/categorias/{categoria_id}", response_model=schemas.Categoria)
def get_categoria(categoria_id: int, db: Session = Depends(get_db)):
    db_categoria = crud.get_categoria_by_id(db, categoria_id)
    if db_categoria is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_categoria

@app.post("/categorias/", response_model=schemas.Categoria)
async def create_categoria(
    nome: str = Form(...),
    descricao: str = Form(...),
    banner: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    banner_path = None
    if banner:
        banner_path = await save_image_file(banner, "frontend/static/banners")
    categoria_create = schemas.CategoriaCreate(nome=nome, descricao=descricao, banner=banner_path)
    return crud.create_categoria(db=db, categoria=categoria_create, banner_path=banner_path)

@app.put("/categorias/{categoria_id}", response_model=schemas.Categoria)
async def update_categoria(
    categoria_id: int,
    nome: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    banner: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    banner_path = None
    if banner:
        banner_path = await save_image_file(banner, "frontend/static/banners")
    categoria_update = schemas.CategoriaUpdate(nome=nome, descricao=descricao, banner=banner_path)
    db_categoria = crud.update_categoria(db, categoria_id, categoria_update, banner_path)
    if db_categoria is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_categoria

@app.delete("/categorias/{categoria_id}")
def delete_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    db_categoria = crud.delete_categoria(db, categoria_id)
    if db_categoria is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


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


@app.get("/indicados/{indicado_id}", response_model=schemas.Indicado)
def get_indicado(indicado_id: int, db: Session = Depends(get_db)):
    db_indicado = crud.get_indicado_by_id(db, indicado_id)
    if db_indicado is None:
        raise HTTPException(status_code=404, detail="Nominee not found")
    return db_indicado

@app.post("/indicados/", response_model=schemas.Indicado)
async def create_indicado(
    nome: str = Form(...),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    foto_path = None
    if foto:
        foto_path = await save_image_file(foto, "frontend/static/fotos")
    indicado_create = schemas.IndicadoCreate(nome=nome, foto=foto_path)
    return crud.create_indicado(db=db, indicado=indicado_create, foto_path=foto_path)

@app.put("/indicados/{indicado_id}", response_model=schemas.Indicado)
async def update_indicado(
    indicado_id: int,
    nome: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    foto_path = None
    if foto:
        foto_path = await save_image_file(foto, "frontend/static/fotos")
    indicado_update = schemas.IndicadoUpdate(nome=nome, foto=foto_path)
    db_indicado = crud.update_indicado(db, indicado_id, indicado_update, foto_path)
    if db_indicado is None:
        raise HTTPException(status_code=404, detail="Nominee not found")
    return db_indicado

@app.delete("/indicados/{indicado_id}")
def delete_indicado(
    indicado_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    db_indicado = crud.delete_indicado(db, indicado_id)
    if db_indicado is None:
        raise HTTPException(status_code=404, detail="Nominee not found")
    return {"message": "Nominee deleted successfully"}


@app.post("/indicados_categorias/", response_model=schemas.IndicadosCategoria)
def create_indicado_categoria(
    indicado_categoria: schemas.IndicadosCategoriaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    return crud.create_indicado_categoria(db=db, indicado_categoria=indicado_categoria)

@app.delete("/indicados_categorias/{indicado_categoria_id}")
def delete_indicado_categoria(
    indicado_categoria_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.Usuario = Depends(get_current_admin_user)
):
    db_indicado_categoria = crud.delete_indicado_categoria(db, indicado_categoria_id)
    if db_indicado_categoria is None:
        raise HTTPException(status_code=404, detail="Nominee-Category link not found")
    return {"message": "Nominee-Category link deleted successfully"}


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
    return FileResponse("frontend/index.html")

@app.get("/dashboard")
async def read_dashboard():
    return FileResponse("frontend/dashboard.html")

@app.get("/admin")
async def read_admin(current_user: schemas.Usuario = Depends(get_current_admin_user)):
    return FileResponse("frontend/admin.html")

@app.get("/indicados_categorias/", response_model=list[schemas.IndicadosCategoria])
def read_indicados_categorias(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    indicados_categorias = crud.get_indicados_categorias(db, skip=skip, limit=limit)
    return indicados_categorias

@app.get("/votos_usuario/", response_model=list[int])
def get_user_voted_categories(current_user: schemas.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    voted_categories = crud.get_user_voted_categories(db, current_user.id)
    return [cat_id for cat_id, in voted_categories]

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")