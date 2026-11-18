from pydantic import BaseModel, ConfigDict, Field

from app.schemas.atividade_robo import CenarioRobo

# Pseudocódigo do pedagógico: até 60 linhas curtas (fixtures/robo/README.md).
MAX_PSEUDOCODIGO = 4000


class RevisarSubmissaoAtividade(BaseModel):
    titulo: str = Field(min_length=1)
    descricao: str | None = None
    pontuacaoMaxima: float = Field(gt=0)
    gabaritoEstadoJson: str | None = None


class MetricasRobo(BaseModel):
    """Métricas calculadas pelo pedagogico-service (AnaliseRobo); campos extras são ignorados."""

    model_config = ConfigDict(extra="ignore")

    status: str | None = Field(default=None, max_length=30)
    concluida: bool | None = None
    blocosUsados: int | None = None
    totalBlocosWorkspace: int | None = None
    maxBlocos: int | None = None
    blocosSoltos: int | None = None
    excedeuLimiteBlocos: bool | None = None
    usouBlocoNaoPermitido: bool | None = None
    passosExecutados: int | None = None
    passosMinimos: int | None = None
    eficiencia: float | None = None
    quantidadeRepetir: int | None = None
    profundidadeMaxima: int | None = None
    maiorSequenciaIgual: int | None = None
    sequenciaRepetivel: bool | None = None
    distanciaAoDestino: int | None = None
    pseudocodigoTruncado: bool | None = None


class ContextoRobo(BaseModel):
    cenario: CenarioRobo
    metricas: MetricasRobo
    pseudocodigo: str = Field(min_length=1, max_length=MAX_PSEUDOCODIGO)


class RevisarSubmissaoRequest(BaseModel):
    atividade: RevisarSubmissaoAtividade
    submissaoEstadoJson: str = Field(min_length=1)
    # Presente só no Jogo do Robô: usa o prompt do robô e a nota sugerida volta nula.
    contextoRobo: ContextoRobo | None = None


class ErroRelatorioIa(BaseModel):
    descricao: str = Field(min_length=1)
    severidade: str | None = None


class RevisarSubmissaoResponse(BaseModel):
    resumo: str | None = None
    notaSugerida: float | None = None
    acertos: list[str] = Field(default_factory=list)
    erros: list[ErroRelatorioIa] = Field(default_factory=list)