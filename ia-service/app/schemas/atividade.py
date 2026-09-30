from pydantic import BaseModel, Field


class GerarAtividadeRequest(BaseModel):
    idTurma: int = Field(gt=0)
    tipoAtividade: str = Field(min_length=1)
    descricaoObjetivo: str = Field(min_length=1)


class GerarAtividadeResponse(BaseModel):
    titulo: str
    descricao: str
    gabaritoEstadoJson: str | None = None