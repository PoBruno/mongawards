from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String, unique=True, index=True)
    password = Column(String)
    admin = Column(Boolean, default=False)

class Indicado(Base):
    __tablename__ = "indicados"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    foto = Column(String)

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    descricao = Column(String)
    banner = Column(String)
    is_active = Column(Boolean, default=False)

class IndicadosCategoria(Base):
    __tablename__ = "indicados_categorias"

    id = Column(Integer, primary_key=True, index=True)
    indicado_id = Column(Integer, ForeignKey("indicados.id"))
    categoria_id = Column(Integer, ForeignKey("categorias.id"))

class VotosCategoria(Base):
    __tablename__ = "votos_categoria"

    id = Column(Integer, primary_key=True, index=True)
    indicado_id = Column(Integer, ForeignKey("indicados.id"))
    categoria_id = Column(Integer, ForeignKey("categorias.id"))

class VotosUsuario(Base):
    __tablename__ = "votos_usuario"

    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
