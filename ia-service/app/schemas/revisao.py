from pydantic import BaseModel, Field


class RevisarSubmissaoAtividade(BaseModel):
    titulo: str = Field(min_length=1)
    descricao: str | None = None
    pontuacaoMaxima: float = Field(gt=0)
    gabaritoEstadoJson: str | None = None


class RevisarSubmissaoRequest(BaseModel):
    atividade: RevisarSubmissaoAtividade
    submissaoEstadoJson: str = Field(min_length=1)


class ErroRelatorioIa(BaseModel):
    descricao: str = Field(min_length=1)
    severidade: str | None = None


class RevisarSubmissaoResponse(BaseModel):
    resumo: str | None = None
    notaSugerida: float | None = None
    acertos: list[str] = Field(default_factory=list)
    erros: list[ErroRelatorioIa] = Field(default_factory=list)