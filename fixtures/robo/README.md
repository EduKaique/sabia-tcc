# Contrato do simulador do Jogo do Robô

Este documento é a **fonte única das regras** do simulador do Jogo do Robô. Duas implementações o seguem:

| Implementação | Papel | Arquivo |
|---|---|---|
| TypeScript (web) | Animação e retorno imediato ao aluno e ao professor | `web/src/lib/simuladorRobo.ts` |
| Java (pedagogico-service) | Autoritativa (nota, conclusão) | `pedagogico-service/src/main/java/com/sabia/pedagogico/service/robo/SimuladorRobo.java` |

As duas leem **os mesmos casos** desta pasta (`*.json`, um caso por arquivo):

- o Vitest, em `web/src/lib/simuladorRobo.fixtures.test.ts`;
- o JUnit, em `pedagogico-service/src/test/java/com/sabia/pedagogico/service/robo/SimuladorRoboFixturesTest.java`.

Um caso novo aqui passa a valer nos dois lados. Os workflows `ci-web.yml` e `ci-pedagogico.yml` rodam quando `fixtures/**` muda.

## Entrada

- **Cenário:**
  - Formato: `{ versao, linhas, colunas, inicio{linha,coluna}, destino, obstaculos[], blocosPermitidos[], maxBlocos? }`.
  - A linha 0 é a de cima e a coluna 0 é a da esquerda.
  - O cenário já chega válido, porque o `CenarioRoboValidador` o confere ao salvar: grade de 3 a 10, posições dentro da grade, início ≠ destino, obstáculos sem repetição e fora do início e do destino, e existência de caminho.
  - O Java lê o cenário com o mesmo leitor do validador (`CenarioRoboValidador.lerGrade`). Um cenário inválido lança `CenarioInvalidoException`, e isso não é um resultado da simulação.
- **Estado:**
  - É o JSON de `Blockly.serialization.workspaces.save`, como objeto ou como string com esse JSON.
  - Formato real: `{"blocks":{"languageVersion":0,"blocks":[ ...blocos de topo... ]}}`.
  - Cada bloco tem `type`, `id`, `x`/`y` (só no topo), `fields`, `inputs.NOME.block` (e `inputs.NOME.shadow`, para sombras) e `next.block`.

## Regras

| # | Regra |
|---|---|
| R1 | Só `blocks.blocks` é lido. String que não é JSON, JSON que não é objeto, ausência de `blocks.blocks` ou valor que não é lista resultam numa lista de topo vazia, ou seja, `SEM_BLOCOS`. |
| R2 | **Pilha principal** é o bloco de topo com menor `y`; no empate, o de menor `x`; num empate total, o que vem primeiro na lista. `x`/`y` ausentes contam como 0. As outras pilhas são **soltas**, não executam, e `blocosSoltos = nº de blocos de topo − 1` (mínimo 0). |
| R3 | `blocosUsados` é o número de `robo_mover` + `robo_repetir` **só na pilha principal**, incluindo os de dentro de `repetir` (`inputs.FAZER`). Blocos de outros tipos não contam e não executam, mas a cadeia `next` passa por eles. |
| R4 | Se `blocosUsados == 0`, o resultado é `SEM_BLOCOS`, sem passos. |
| R5 | `robo_mover`: `fields.DIRECAO` deve ser exatamente `CIMA`, `BAIXO`, `ESQUERDA` ou `DIREITA` (só a chave própria; nomes como `toString` não valem). Com direção inválida, ausente ou não textual, o bloco é **ignorado em silêncio**. `fields.CASAS` passa pela coerção abaixo e é limitado a [1, 9]. |
| R6 | `robo_repetir`: `fields.VEZES` passa pela coerção abaixo e é limitado a [1, 10]. Executa `inputs.FAZER.block` (a cadeia inteira) VEZES vezes. Sem corpo, cada iteração não faz nada, mas conta como operação. |
| R7 | Cada casa andada é um **passo**. Antes de cada passo, se já houver 500 passos (`LIMITE_PASSOS`), a simulação para com `LIMITE_EXCEDIDO`. O 500º passo é aceito e o 501º não. |
| R8 | Sair da grade resulta em `SAIU_DO_GRID`; entrar num obstáculo, em `COLIDIU`. Nos dois casos é registrado um passo malsucedido com a **última posição válida**, e ele **conta** em `passosExecutados`. A simulação para ali. |
| R9 | O destino só é verificado **no fim**: passar pelo destino e seguir dá `NAO_CHEGOU`. No fim, a posição igual ao destino dá `CHEGOU`; caso contrário, `NAO_CHEGOU`. |
| R10 | `blocosPermitidos` e `maxBlocos` **não** são verificados pelo simulador. Quem os aplica é o editor (toolbox e `maxBlocks` do Blockly) e, no servidor, quem chamar o simulador. |
| R11 | Limites de execução (abaixo): o custo da simulação é limitado, mesmo com `repetir` aninhados vazios. |
| R12 | Determinístico: sem aleatoriedade, relógio ou estado global. A mesma entrada dá sempre o mesmo resultado. |

### Coerção de CASAS e VEZES

1. Número JSON: truncado em direção a zero (`2.9 → 2`, `-3.7 → -3`). Número não finito vale o padrão.
2. String: depois de tirar espaços das pontas, se for um decimal com sinal opcional e ponto opcional (`"3"`, `" 4 "`, `"+1"`, `"2.7"`, `".5"`, `"5."`), é convertida e truncada.
3. Qualquer outra coisa (ausente, `null`, `""`, texto, objeto, booleano) vale o **padrão 1**.
4. Depois disso, o valor é limitado à faixa: CASAS em [1, 9] e VEZES em [1, 10]. Por isso `0 → 1`, `-3 → 1`, `99 → 9` e `50 → 10`.

### Limites de execução

| Constante | Valor | O que limita |
|---|---|---|
| `LIMITE_PASSOS` | 500 | Casas andadas (R7) |
| `LIMITE_OPERACOES` | 10000 | Operações: +1 a cada bloco visitado na execução (qualquer tipo, inclusive os pulados da cadeia) e +1 a cada iteração de `repetir`, mesmo com corpo vazio. Antes de cada operação, o contador é incrementado; **se passar de 10000**, a simulação para com `LIMITE_EXCEDIDO`. Assim, 10000 operações são aceitas e a 10001ª não. |
| `MAX_PROFUNDIDADE` | 10 | Profundidade de aninhamento via `inputs`. Os blocos de topo estão na profundidade 1, um bloco dentro de um input de um bloco de profundidade *p* está em *p + 1*, e `next` **não** aumenta a profundidade. Vale a maior profundidade do workspace inteiro (todas as pilhas). |
| `MAX_BLOCOS_WORKSPACE` | 200 | `totalBlocosWorkspace`: blocos que **não são sombra** em **todas** as pilhas, contando os aninhados (`inputs.*.block`) e a cadeia `next`. Sombras (`inputs.*.shadow`) não contam. |

Todos os limites resultam em `LIMITE_EXCEDIDO`; não existe status próprio para cada um.

**Ordem das verificações:**
1. Leitura (R1).
2. Análise estrutural: profundidade e `totalBlocosWorkspace`. É feita sem recursão e percorre o workspace inteiro.
3. Se `profundidade > 10` ou `totalBlocosWorkspace > 200`, o resultado é **determinístico, sem executar**: `LIMITE_EXCEDIDO`, `blocosUsados = 0`, `passosExecutados = 0`, `blocosSoltos` calculado normalmente e `posicaoFinal = início`. Essa verificação vem **antes** de R4, então um workspace grande sem blocos do robô também dá `LIMITE_EXCEDIDO`.
4. Pilha principal e `blocosUsados` (R2, R3); depois `SEM_BLOCOS` (R4).
5. Execução. A cadeia `next` é percorrida em laço. A recursão acontece só em `FAZER`, já limitada pela profundidade.

**Custo do caso R11:** sem corpo, `ops(repetir V) = 1 + V`. Aninhado: `ops(repetir V [corpo]) = 1 + V × (1 + ops(corpo))`. Com V = 10:
- 1 nível: 11;
- 2 níveis: 121;
- 3 níveis: 1221;
- 4 níveis: 12221 > 10000, então o resultado é `LIMITE_EXCEDIDO`.

Antes dos limites, 10 níveis custavam cerca de 10^10 iterações.

`totalBlocosWorkspace` aparece no resultado das duas implementações, mas não faz parte do `esperado` dos casos; é testado à parte.

### Contagens de blocos (não confundir)

| Contagem | O que conta | Onde aparece |
|---|---|---|
| `blocosUsados` | Só `robo_mover` + `robo_repetir`, só na pilha principal | Resultado da simulação, painel do professor |
| `totalBlocosWorkspace` | Todos os blocos que não são sombra, de todas as pilhas e de qualquer tipo | Resultado da simulação (limite de 200); é a mesma contagem do "Blocos: X / max" do aluno (`PainelJogo.tsx`) |
| `maxBlocks` do Blockly | `workspace.getAllBlocks(false)`: todos os blocos, **inclusive sombras** | Editor (impede arrastar mais blocos) |

Os blocos do robô não têm inputs de valor e, portanto, não geram sombras. Com o toolbox do robô, `totalBlocosWorkspace` e a contagem do `maxBlocks` coincidem. Elas só divergiriam com blocos que têm sombra.

## Resultado

| Campo | Significado |
|---|---|
| `status` | `CHEGOU`, `NAO_CHEGOU`, `COLIDIU`, `SAIU_DO_GRID`, `SEM_BLOCOS` ou `LIMITE_EXCEDIDO` |
| `blocosUsados` | R3 |
| `passosExecutados` | Passos registrados, incluindo o passo malsucedido de R8 |
| `blocosSoltos` | R2 |
| `posicaoFinal` | `{linha, coluna}`; em R8, a última posição válida |
| `totalBlocosWorkspace` | Limite `MAX_BLOCOS_WORKSPACE` (fora dos casos compartilhados) |

O TS também devolve `chegou` e a lista de passos (`passos[]`, usada na animação); o Java não.

## Formato de um caso

```json
{
  "nome": "texto que aparece como nome do teste nos dois lados",
  "cenario": { "versao": 1, "linhas": 5, "colunas": 5, "...": "..." },
  "estado": { "blocks": { "languageVersion": 0, "blocks": [] } },
  "esperado": {
    "status": "CHEGOU",
    "blocosUsados": 2,
    "passosExecutados": 8,
    "blocosSoltos": 0,
    "posicaoFinal": { "linha": 0, "coluna": 4 }
  }
}
```

- `estado` pode ser um objeto ou uma **string** (o texto JSON, ou um texto inválido para testar R1).
- Cada runner compara **só as chaves presentes** em `esperado`.
- Arquivos `NNN-descricao.json`; os dois runners ordenam pelo nome do arquivo.
- Os valores esperados dos casos de comportamento existente (001 a 033) foram obtidos **executando o simulador TS** antes da introdução dos limites.

## Fora do contrato (diferenças aceitas)

Estas entradas só aparecem com estado adulterado. As implementações podem divergir nelas, e nenhum caso as cobre:

- **Coerção:**
  - Strings que o `Number()` do JavaScript aceita, mas que não são decimais simples: hexadecimal (`"0x10"`), notação científica (`"1e1"`), `"Infinity"`, binário e octal. O Java aplica o padrão 1.
  - Listas (`[5]`): o JS converte para 5 e o Java usa o padrão 1.
- **`x`/`y` não numéricos** nos blocos de topo (texto, booleano): a ordenação do JS faz coerção e pode ficar indefinida; o Java usa 0.
- **Valores que não são objeto** onde se espera um bloco (por exemplo, `"next": {"block": 5}`): o JS visita o valor como bloco sem tipo, e o Java o trata como ausente. A diferença é no máximo de uma operação.
- **Aninhamento de JSON acima do limite do Jackson:** o leitor do Java (`StreamReadConstraints`, padrão de 500 níveis no Jackson 3.1) recusa o texto, e o resultado é `SEM_BLOCOS` (R1). Um workspace dentro dos limites de blocos e de profundidade fica bem abaixo disso: 200 blocos em cadeia dão cerca de 405 níveis. O JS lê qualquer profundidade e, para o mesmo estado (mais de cerca de 245 blocos em cadeia), devolve `LIMITE_EXCEDIDO`. Nos dois casos a entrega não é aceita como concluída, e nenhum deles estoura a pilha.
- **Cenário inválido:** o TS supõe um cenário válido e o Java lança `CenarioInvalidoException`.

## Validação da prática (servidor)

O simulador é usado pelo `ValidadorPratica` do pedagogico-service. Ele decide a conclusão da prática na entrega da atividade e na lição e, além do simulador, verifica `maxBlocos` e `blocosPermitidos` do cenário (R10). As regras, o formato do resultado e a classificação dos blocos livres estão em [`fixtures/blocos-livres/README.md`](../blocos-livres/README.md).

## Análise para o relatório

O detalhe da submissão para o professor traz `analiseRobo`, calculada pelo `AnaliseRoboService` (pedagogico-service) para o relatório de correção por IA. Ela é recalculada a cada consulta, a partir do `estadoJson` da entrega e do cenário da atividade, e nada é gravado; por isso vale também para entregas antigas.

**Quando vem nula:** atividade fora do modo robô, entrega sem projeto, cenário ausente ou ilegível, ou estado que não é JSON válido. A análise nunca faz o detalhe falhar.

**Programa = pilha principal** (R2: menor `y`, depois menor `x`; no empate, a primeira). Blocos soltos não executam e não entram nas contagens de estrutura nem no pseudocódigo; aparecem só em `blocosSoltos`.

### Métricas

| Campo | Definição |
|---|---|
| `status`, `concluida`, `blocosUsados`, `totalBlocosWorkspace`, `maxBlocos`, `blocosSoltos`, `excedeuLimiteBlocos`, `usouBlocoNaoPermitido`, `passosExecutados` | Os mesmos da validação da prática, recalculados com o simulador. |
| `passosMinimos` | Menor caminho do início ao destino (BFS em 4 direções, `CenarioRoboValidador.menorCaminho`). Nulo se o cenário não tem caminho. |
| `eficiencia` | `passosMinimos / passosExecutados`, com 2 casas (arredondamento meio para cima). Só quando o status é `CHEGOU`, `passosExecutados > 0` e `passosMinimos` existe; senão, nula. |
| `quantidadeRepetir` | Número de `robo_repetir` na pilha principal, inclusive aninhados. |
| `profundidadeMaxima` | Aninhamento máximo de `robo_repetir` (um repetir = 1; repetir dentro de repetir = 2); 0 sem repetir. |
| `maiorSequenciaIgual` | Maior número de blocos `robo_mover` **consecutivos** com a mesma direção numa mesma cadeia `next` (a principal ou o `FAZER` de um repetir). Conta blocos, não casas. Qualquer outro bloco interrompe a sequência, inclusive `mover` com direção inválida. |
| `sequenciaRepetivel` | `maiorSequenciaIgual >= 3`. |
| `distanciaAoDestino` | Distância de Manhattan da posição final ao destino. Nula sem posição final. |
| `pseudocodigo`, `pseudocodigoTruncado` | Ver abaixo. |

### Pseudocódigo

- Uma linha por bloco, com recuo de 2 espaços por nível de `repetir`:
  ```
  repetir 4 vezes
    mover CIMA 1
  mover DIREITA 4
  ```
- `mover <DIREÇÃO> <casas>` e `repetir <n> vezes`, com os valores **já coagidos** (casas de 1 a 9, vezes de 1 a 10) e os nomes de direção do contrato (`CIMA`, `BAIXO`, `ESQUERDA`, `DIREITA`).
- Omitidos: `mover` com direção inválida ou ausente e blocos de outros tipos (o simulador os ignora). Sem ids nem coordenadas.
- Programa sem nenhuma linha: `(programa vazio)`.
- **Limites:** no máximo 60 linhas; depois disso, a linha `... (programa truncado)` e `pseudocodigoTruncado = true`. O percurso segue a cadeia `next` em laço e só usa recursão no `FAZER`, até a profundidade 10 (`MAX_PROFUNDIDADE`) e no máximo 200 blocos visitados; ao passar disso, também trunca. As métricas de estrutura contam o programa inteiro dentro desses limites, mesmo quando o pseudocódigo é cortado.
