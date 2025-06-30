from sqlalchemy.orm import Session
from typing import Optional
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_nickname(db: Session, nickname: str):
    return db.query(models.Usuario).filter(models.Usuario.nickname == nickname).first()

def create_user(db: Session, user: schemas.UsuarioCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.Usuario(nickname=user.nickname, password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_categorias(db: Session, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None):
    query = db.query(models.Categoria)
    if is_active is not None:
        query = query.filter(models.Categoria.is_active == is_active)
    return query.offset(skip).limit(limit).all()

def create_categoria(db: Session, categoria: schemas.CategoriaCreate, banner_path: Optional[str] = None):
    db_categoria = models.Categoria(nome=categoria.nome, descricao=categoria.descricao, banner=banner_path)
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

def update_categoria_status(db: Session, categoria_id: int, is_active: bool):
    db_categoria = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()
    if db_categoria:
        db_categoria.is_active = is_active
        db.commit()
        db.refresh(db_categoria)
    return db_categoria

def get_indicados(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Indicado).offset(skip).limit(limit).all()

def create_indicado(db: Session, indicado: schemas.IndicadoCreate, foto_path: Optional[str] = None):
    db_indicado = models.Indicado(nome=indicado.nome, foto=foto_path)
    db.add(db_indicado)
    db.commit()
    db.refresh(db_indicado)
    return db_indicado

def create_indicado_categoria(db: Session, indicado_categoria: schemas.IndicadosCategoriaCreate):
    db_indicado_categoria = models.IndicadosCategoria(**indicado_categoria.dict())
    db.add(db_indicado_categoria)
    db.commit()
    db.refresh(db_indicado_categoria)
    return db_indicado_categoria

def get_indicados_categorias(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.IndicadosCategoria).offset(skip).limit(limit).all()

def create_voto(db: Session, voto: schemas.Voto, usuario_id: int):
    db_voto = models.VotosCategoria(indicado_id=voto.indicado_id, categoria_id=voto.categoria_id)
    db.add(db_voto)
    db.commit()
    db.refresh(db_voto)

    db_voto_usuario = models.VotosUsuario(categoria_id=voto.categoria_id, usuario_id=usuario_id)
    db.add(db_voto_usuario)
    db.commit()
    db.refresh(db_voto_usuario)
    return db_voto

def get_votos_by_user_and_category(db: Session, usuario_id: int, categoria_id: int):
    return db.query(models.VotosUsuario).filter(models.VotosUsuario.usuario_id == usuario_id, models.VotosUsuario.categoria_id == categoria_id).first()

def get_results(db: Session):
    return db.query(models.VotosCategoria).all()
