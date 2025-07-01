from pydantic import BaseModel
from typing import List, Optional

class UsuarioBase(BaseModel):
    nickname: str

class UsuarioCreate(UsuarioBase):
    password: str
    secret_code: str

class UsuarioLogin(UsuarioBase):
    password: str

class Usuario(UsuarioBase):
    id: int
    admin: bool

    class Config:
        from_attributes = True

class IndicadoBase(BaseModel):
    nome: str
    foto: Optional[str] = None

class IndicadoCreate(IndicadoBase):
    pass

class IndicadoUpdate(IndicadoBase):
    nome: Optional[str] = None
    foto: Optional[str] = None

class Indicado(IndicadoBase):
    id: int

    class Config:
        from_attributes = True

class CategoriaBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    banner: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaUpdate(CategoriaBase):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    banner: Optional[str] = None

class CategoriaUpdateStatus(BaseModel):
    is_active: bool

class Categoria(CategoriaBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class IndicadosCategoriaBase(BaseModel):
    indicado_id: int
    categoria_id: int

class IndicadosCategoriaCreate(IndicadosCategoriaBase):
    pass

class IndicadosCategoria(IndicadosCategoriaBase):
    id: int

    class Config:
        from_attributes = True

class Voto(BaseModel):
    indicado_id: int
    categoria_id: int
