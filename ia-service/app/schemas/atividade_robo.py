from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, model_validator

# Mesmo valor usado pelo front (web/src/lib/editorCenario.ts e cenariosRobo.ts).
VERSAO_CENARIO = 1
GRADE_MIN = 3
GRADE_MAX = 10
MAX_OBSTACULOS = 30
# A rota antiga não tem máximo; aqui o limite evita prompts gigantes.
MAX_DESCRICAO_OBJETIVO = 1000

TipoBlocoRobo = Literal["robo_mover", "robo_repetir"]
Dificuldade = Literal["FACIL", "MEDIO", "DIFICIL"]


class Posicao(BaseModel):
    linha: int = Field(ge=0)
    coluna: int = Field(ge=0)


class CenarioRobo(BaseModel):
    versao: int
    linhas: int = Field(ge=GRADE_MIN, le=GRADE_MAX)
    colunas: int = Field(ge=GRADE_MIN, le=GRADE_MAX)
    inicio: Posicao
    destino: Posicao
    obstaculos: list[Posicao] = Field(default_factory=list, max_length=MAX_OBSTACULOS)
    blocosPermitidos: list[TipoBlocoRobo] = Field(min_length=1)
    maxBlocos: int | None = Field(default=None, ge=1)


class ParametrosCenario(BaseModel):
    linhas: int = Field(default=5, ge=GRADE_MIN, le=GRADE_MAX)
    colunas: int = Field(default=5, ge=GRADE_MIN, le=GRADE_MAX)
    dificuldade: Dificuldade = "FACIL"
    usarRepetir: bool = False


class GerarAtividadeRoboRequest(BaseModel):
    descricaoObjetivo: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_DESCRICAO_OBJETIVO),
    ]
    idTurma: int | None = Field(default=None, gt=0)
    cenario: CenarioRobo | None = None
    sugerirCenario: bool = False
    parametrosCenario: ParametrosCenario | None = None

    @model_validator(mode="after")
    def exigir_cenario_sem_sugestao(self) -> "GerarAtividadeRoboRequest":
        if not self.sugerirCenario and self.cenario is None:
            raise ValueError("Informe o cenário ou peça a sugestão de um cenário.")
        return self

    def parametros(self) -> ParametrosCenario:
        return self.parametrosCenario or ParametrosCenario()


class GerarAtividadeRoboResponse(BaseModel):
    titulo: str
    descricao: str
    cenario: CenarioRobo | None = None
