# Validação da prática no servidor

O pedagogico-service decide se a prática foi concluída. A classe é `ValidadorPratica` (`pedagogico-service/.../service/pratica/`). O navegador só antecipa o resultado, para animar e dar retorno imediato.

Onde o veredito é usado:

- **Entrega da atividade avaliativa** (`POST /api/aluno/atividades/{id}/submeter`): a entrega **nunca é recusada** por causa do resultado. O resultado fica gravado em `submissao_avaliativa.validacao_json` e aparece para o professor no detalhe da submissão (campo `validacao`).
- **Conclusão da prática da lição** (`POST /api/aluno/licoes/{id}/concluir-atividade`, corpo `{ "estadoJson": "..." }`): `atividadeConcluida` passa a ser `resultado.concluida`, mas **nunca volta de `true` para `false`**. Se a prática não foi concluída, a resposta é 200 com `atividadeConcluida = false` e o resultado em `validacao`.

## Entrada recusada (400)

Só a entrada malformada é recusada:

- `estadoJson` ausente ou vazio;
- `estadoJson` acima de 64 KB (`@Size(max = 65536)`);
- texto que não é JSON;
- JSON com aninhamento acima do limite do Jackson (500 níveis).

Qualquer outra violação vira **resultado registrado**, não erro: não chegar, colidir, sair da grade, limite de execução, limite de blocos do professor e bloco não permitido. Uma atividade ou lição do Jogo do Robô sem cenário válido (dado inconsistente) responde 422.

## Resultado (`ResultadoValidacao`, `versaoValidador = 1`)

| Campo | Jogo do Robô | Blocos livres |
|---|---|---|
| `modo` | `JOGO_ROBO` | `BLOCOS` |
| `status` | status do simulador (`CHEGOU`, `NAO_CHEGOU`, `COLIDIU`, `SAIU_DO_GRID`, `SEM_BLOCOS`, `LIMITE_EXCEDIDO`) | `BLOCOS_LIVRES_OK`, `BLOCOS_LIVRES_VAZIO` ou `LIMITE_EXCEDIDO` |
| `concluida` | `CHEGOU` e `!excedeuLimiteBlocos` e `!usouBlocoNaoPermitido` | `BLOCOS_LIVRES_OK` |
| `blocosUsados` | blocos do robô na pilha principal (contrato do simulador) | igual a `totalBlocosWorkspace` |
| `totalBlocosWorkspace` | blocos não-sombra de todas as pilhas | idem |
| `maxBlocos` | `cenario.maxBlocos`, ou `null` | `null` |
| `excedeuLimiteBlocos` | `maxBlocos != null` e `totalBlocosWorkspace > maxBlocos` | `false` |
| `usouBlocoNaoPermitido` | algum bloco (não-sombra, de qualquer pilha) com `type` fora de `cenario.blocosPermitidos` | `false` |
| `passosExecutados`, `blocosSoltos`, `posicaoFinal` | do simulador | `0`, `0`, `null` |
| `motivo` | texto curto para o aluno; `null` quando concluída | idem |

**Prioridade do motivo:**
1. a falha do simulador (não chegou, colidiu, saiu da grade, limite de execução, sem blocos);
2. bloco não permitido;
3. limite de blocos do professor.

## `blocosUsados` × `totalBlocosWorkspace`

- **`blocosUsados`** (contrato do simulador, `fixtures/robo/README.md`): conta só `robo_mover` e `robo_repetir`, só na pilha principal. É o que o robô executou.
- **`totalBlocosWorkspace`:** conta todos os blocos que não são sombra, em todas as pilhas e de qualquer tipo. É a mesma contagem do "Blocos: X / max" que o aluno vê.

**O limite de blocos do professor (`maxBlocos`) usa `totalBlocosWorkspace`.** Um bloco solto também conta, como no contador do aluno e no `maxBlocks` do Blockly.

No Blockly 13, o `maxBlocks` conta também blocos-sombra. Os blocos do robô não têm sombra, então, no Jogo do Robô, as contagens coincidem.

## Blocos livres

O servidor **não executa** o código do aluno, por risco de segurança: no navegador, o código roda com `new Function`.

A regra é: o estado é legível, está dentro dos limites estruturais do simulador (profundidade ≤ 10 e ≤ 200 blocos, pela mesma análise do `SimuladorRobo`) e **ao menos um bloco de topo é de comando**. Acima dos limites, o status é `LIMITE_EXCEDIDO`.

**Limitação:** isso não prova que o programa roda sem erro nem que faz o que a lição pede. Só prova que há um programa com uma instrução executável. O navegador ainda pede a conclusão depois de qualquer execução, inclusive uma que terminou com erro; o `PainelEntradaSaida` não informa o erro, e essa decisão ficou registrada.

## Classificação dos tipos de bloco (`classificacao.json`)

O JSON do Blockly não traz os conectores dos blocos, por isso o servidor usa um catálogo. A classificação foi feita criando cada bloco no Blockly 13 (`node_modules/blockly`) e nas definições do projeto:

- **`comandos`:** blocos de instrução (`previousStatement`). Só esta lista vale para a conclusão. Ela fica embutida no Java como `ValidadorPratica.COMANDOS`, porque os fixtures não vão na imagem Docker. O teste `ClassificacaoBlocosLivresTest` exige igualdade com este arquivo.
- **`valores`:** blocos com `output` (encaixam num input de outro bloco). Sozinhos no topo, não executam nada.
- **`outros`:** blocos que não contam como comando por si só:
  - `procedures_defnoreturn` e `procedures_defreturn`: definição de função, bloco "chapéu" sem conector. Definir uma função não executa nada; chamar sim, e `procedures_callnoreturn` é comando.
  - `procedures_ifreturn`: é uma instrução, mas o Blockly o desativa fora de uma função, e um bloco desativado não gera código.

Todo tipo do toolbox de blocos livres (`web/src/lib/toolboxBlocosLivres.ts`, incluindo as categorias dinâmicas Variáveis e Funções) e os blocos do projeto (`get_input`, `robo_mover`, `robo_repetir`) precisam estar em alguma das três listas. O teste `toolboxBlocosLivres.test.ts` (Vitest) falha quando aparece um tipo novo sem classificação.

**Casos ambíguos:**

- `lists_getIndex`: é valor no modo padrão (obter). No modo "remover" vira instrução. Foi classificado como **valor**, então um `lists_getIndex` sozinho no topo não conclui a prática.
- `controls_flow_statements` (interromper/continuar): só tem conector de cima, mas é instrução, logo **comando**.
