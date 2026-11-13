# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.2.0] - 2026-11-13

Segunda versão, publicada como **pré-release**. Notas completas em
[docs/release-notes/v0.2.0.md](docs/release-notes/v0.2.0.md).

### Adicionado

#### Aluno

- Página de troca de senha (`/trocar-senha`): obrigatória quando há troca pendente e voluntária pelo item "Alterar senha" do menu (#74).
- Aviso na tela de entrada orientando o aluno que esqueceu a senha a falar com o professor (#74).

#### Professor

- Página da turma (`/professor/turmas/<id>`) com a tabela de alunos: avatar, nome, matrícula, data de entrada, aviso de troca de senha pendente, busca, matrícula e remoção (#74).
- Redefinição da senha do aluno pelo professor, com senha gerada automaticamente ou digitada e opção de exigir a troca no próximo acesso; a senha aparece uma única vez (#74).
- Item "Alterar senha" no menu lateral (#74).
- Relatório da revisão por IA salvo na submissão, com os botões "Gerar novamente" e "Descartar relatório" na página de correção.

#### Lições

- Módulo "Aprender" do aluno (`/aluno/aprender`): lista de lições com a situação de cada uma e página da lição com conteúdo em texto e vídeo opcional do YouTube (#80).
- Prática da lição no editor de blocos (Jogo do Robô ou blocos livres), com salvamento automático do workspace e conclusão quando o robô chega ao destino ou o programa é executado (#80).
- Progresso por aluno (vídeo assistido, atividade concluída, lição concluída) e atalho para a próxima lição (#80).
- API do aluno em `/api/aluno/licoes`: listar, detalhar, marcar vídeo como visto, salvar o workspace e concluir a atividade (#80).
- Carga das lições a partir de `seed/licoes.json` na subida do serviço pedagógico, em todos os perfis, por código e sem duplicar; lição retirada do arquivo fica inativa e o progresso é mantido (#80).

#### IA

- Revisão por IA gerada automaticamente quando o aluno envia a submissão, por evento no RabbitMQ (só com a mensageria ligada; em produção ela está desligada).
- Endpoints `GET`, `PUT` e `DELETE /api/professor/submissoes/{id}/relatorio-ia` para ler, salvar e remover o relatório de IA da submissão.

#### Autenticação e convites

- Endpoints do auth-service para o professor listar os alunos da turma e redefinir a senha de um aluno, com a posse da turma conferida pelo serviço pedagógico (#74).
- Claim `mustChangePassword` no JWT (#74).

#### Infra e deploy

- Mensageria com RabbitMQ entre auth-service, serviço pedagógico e ia-service: retry com backoff, DLQ, idempotência no consumo, logs estruturados e status do broker no health de cada serviço. Veja [docs/mensageria.md](docs/mensageria.md).
- `scripts/reprocessar-dlq.py` para reenviar mensagens de uma DLQ.
- Testes de publicação e consumo de eventos no auth-service, no serviço pedagógico e no ia-service.

### Alterado

#### Aluno

- O card da atividade na lista do aluno exibe a descrição com a formatação do editor, em vez do texto bruto.

#### Professor

- O card da turma tem um único botão "Acessar turma"; editar e excluir ficam na página da turma (#74).
- O diálogo de gerenciar alunos só busca e matricula; a lista de alunos vem do auth-service (#74).
- A descrição sugerida pela IA é exibida com formatação e sanitizada.

#### Autenticação e convites

- `POST /api/auth/trocar-senha` devolve um token novo, já sem a troca pendente, em vez de só uma mensagem (#74).

#### Infra e deploy

- A fila de correções que o serviço pedagógico declarava sem uso foi substituída pela topologia de eventos `sabia.eventos`.
- Compose de desenvolvimento: credenciais e portas do RabbitMQ configuráveis por variável, e auth-service e ia-service esperam o broker.
- Compose de produção: `RABBITMQ_ENABLED=false` também no auth-service e no ia-service.

### Corrigido

#### Autenticação e convites

- O auth-service responde 400 a um corpo JSON malformado, em vez de 500.

### Segurança

#### Autenticação e convites

- Com troca de senha pendente, o gateway, o auth-service e o serviço pedagógico recusam as requisições com 403 `SENHA_TEMPORARIA`, exceto a própria troca (#74).
- As senhas não aparecem mais no log de DEBUG do perfil dev (#74).
- A resposta da redefinição de senha do aluno é enviada com `Cache-Control: no-store` (#74).
- O corpo de uma requisição ilegível não é registrado no log do auth-service.

#### Infra e deploy

- Descrições de atividade sanitizadas com uma lista restrita de tags; links abrem em nova aba com `noopener noreferrer`.
- O vídeo das lições é incorporado pelo domínio `youtube-nocookie.com`.

## [0.1.0] - 2026-11-03

Primeira versão, publicada como **pré-release**. Notas completas em
[docs/release-notes/v0.1.0.md](docs/release-notes/v0.1.0.md).

### Adicionado

#### Aluno

- Entrada pelo link de convite da turma (`/convite/<código>`) ou digitando o código na página inicial (HU003.3, HU003.4).
- Primeiro acesso pelo convite, com cadastro de dados, avatar e senha numa única operação (HU003.2).
- Login do aluno pela matrícula na mesma tela de entrada de professores e administradores.
- Listagem de atividades avaliativas com status (pendente, em andamento, entregue, corrigida) e realização no editor de blocos (#15).
- Editor de blocos estilo Scratch, com painel de entrada e saída e execução do programa em sandbox no navegador.
- Modo de atividade Jogo do Robô: o aluno programa um robô num tabuleiro com blocos de mover e repetir, simula o percurso e envia.

#### Professor

- Cadastro, edição e exclusão de turmas, com código e link de convite para os alunos (#45).
- Matrícula e desmatrícula de alunos na turma, com busca por aluno.
- Criação, edição, exclusão, publicação e despublicação de atividades avaliativas, com descrição em texto formatado e gabarito montado no editor de blocos (#5).
- Escolha do modo da atividade (blocos livres ou Jogo do Robô), com cenários prontos e limite opcional de blocos.
- Página de correção de submissões com nota e feedback (#54); no Jogo do Robô, a correção reexecuta o percurso do aluno e sugere a nota.
- Página de relatórios com médias por atividade, distribuição de notas, progressão dos alunos e status das entregas por turma.

#### IA

- Geração de atividade com IA a partir de um pedido do professor, com inserção dos blocos do gabarito no editor (#11).
- Serviço de IA (ia-service, FastAPI + Gemini) com revisão de submissão que devolve resumo, nota sugerida, acertos e erros; a nota final continua sendo do professor (#57).

#### Autenticação e convites

- Serviço de autenticação próprio (auth-service), único emissor dos tokens JWT (#16).
- Recuperação e redefinição de senha por e-mail, com envio real via SMTP (#17).
- Painel do administrador para cadastrar, desativar e reativar professores (#52, #19).
- Validação pública do código de convite da turma (HU003.1).
- API de troca obrigatória de senha e de perfil do aluno (#18).

#### Infra e deploy

- API Gateway (Fastify) como ponto único de entrada, com verificação do JWT e controle de acesso por perfil.
- Serviço pedagógico (pedagogico-service) para turmas, atividades, submissões, correções e relatórios (#29).
- Imagens de produção de todos os serviços, incluindo o front em modo standalone.
- Publicação das imagens no GitHub Container Registry pelo GitHub Actions, com os testes dos serviços Java antes da publicação.
- Compose de produção com Caddy como proxy reverso e HTTPS com certificado de IP do Let's Encrypt.
- Scripts de operação em `deploy/`: deploy por tag com rollback, backup, restauração (com modo de teste), smoke test e `dc.sh`.
- Runbook de produção e documentação do pipeline de imagens.
- Health check público no serviço pedagógico.

### Alterado

#### Aluno

- Fluxo de login e visual do módulo do aluno reformulados.
- Editor de blocos com tema visual "scratch".

#### Infra e deploy

- Removida a API monolítica antiga e o seu CI, substituídos pelos serviços separados (#49).
- Banco de dados unificado, com um schema por serviço.
- RabbitMQ passou a ser opcional no serviço pedagógico e fica desligado em produção.
- URLs da API centralizadas no front, que passa a usar caminhos relativos atrás do proxy.

### Corrigido

#### IA

- Inserção dos blocos gerados pela IA no editor (#14).
- Cota esgotada do Gemini passou a ser tratada no ia-service, com o código `COTA_IA_ESGOTADA`.

#### Infra e deploy

- Sequences do banco sincronizadas com os ids fixos dos dados de desenvolvimento.
- Erros do container do front em desenvolvimento.
- HTTPS por IP: o Caddy agora entrega o certificado mesmo quando o navegador não envia SNI.
- O smoke test só aceita o código HTTP esperado em cada verificação.
- O deploy valida `EMAIL_PROVIDER` antes de subir e mostra o comando exato quando falta permissão na pasta de backup.
- Branches de disparo do workflow de publicação de imagens.

### Segurança

#### Autenticação e convites

- `JWT_SECRET` obrigatório em produção, com tamanho mínimo e recusa de valores padrão, no auth-service, no serviço pedagógico e no gateway.
- Perfil de produção sem carga de dados de desenvolvimento; usuários iniciais criados a partir de variáveis de ambiente.
- O serviço pedagógico revalida o JWT por conta própria, e o gateway bloqueia as rotas internas (`/api/interno`).

#### IA

- A chave do Gemini não aparece mais em logs nem em mensagens de erro.

#### Infra e deploy

- Descrições das atividades sanitizadas com DOMPurify antes de serem exibidas.
- Cookie de sessão com `secure` em HTTPS.
- Em produção, apenas o Caddy publica portas; banco, serviços e documentação da API ficam inacessíveis de fora.

[Unreleased]: https://github.com/EduKaique/sabia-tcc/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/EduKaique/sabia-tcc/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/EduKaique/sabia-tcc/releases/tag/v0.1.0
