# Runbook de produção — Sabiá

Servidor Ubuntu, acesso por **IP público** (sem domínio), HTTPS com certificado de IP do Let's Encrypt
emitido pelo Caddy. As imagens vêm do GHCR (veja `docs/ci-cd.md`); **nada é compilado no servidor**.

Em todos os comandos, `/opt/sabia` é o clone do repositório, `<IP>` é o IP público e
`dc` é um atalho para o compose de produção:

```bash
alias dc='docker compose -p sabia-prod -f /opt/sabia/docker-compose.prod.yml --env-file /opt/sabia/.env.prod'
# dc exige IMAGE_TAG: exporte a tag em uso antes, ex.: export IMAGE_TAG=$(cat /opt/sabia/deploy/.current_tag)
```

## 1. Preparar o servidor (uma vez)

### Docker

Repositório oficial da Docker (instruções em https://docs.docker.com/engine/install/ubuntu/):

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Se o `apt-get update` reclamar que o repositório não tem a versão do Ubuntu 26.04
(o repositório da Docker costuma demorar a incluir versões novas), use os pacotes do Ubuntu:

```bash
sudo rm /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2
```

Depois, em ambos os casos:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"     # saia e entre de novo na sessão
docker compose version              # precisa ser v2.20+ (usa --wait)
```

### Firewall

```bash
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable && sudo ufw status
```

**Atenção:** o Docker escreve as próprias regras de iptables e **ignora o ufw** para portas publicadas
com `ports:`. A proteção real é o compose: só o `caddy` publica portas (80 e 443). Nunca adicione
`ports:` a outro serviço (o api-gateway confia em `X-Forwarded-For` e não pode ficar exposto).
Confira sempre com o `smoke.sh` (seção 5), que testa as portas internas de fora.

Portas 80 **e** 443 precisam estar abertas para a internet (inclusive no firewall da universidade):
o Let's Encrypt valida o IP por elas, e a renovação também depende disso.

### Código e acesso ao GHCR

```bash
sudo mkdir -p /opt/sabia && sudo chown "$USER" /opt/sabia
git clone -b release https://github.com/EduKaique/sabia-tcc.git /opt/sabia
```

Login no GHCR com um PAT clássico só com `read:packages` (passo a passo em `docs/ci-cd.md`):

```bash
echo "<TOKEN>" | docker login ghcr.io -u <usuario-github> --password-stdin
```

### Configuração

```bash
cd /opt/sabia
cp deploy/.env.prod.example .env.prod
chmod 600 .env.prod
nano .env.prod      # preencha tudo; os comandos para gerar segredos estão no próprio arquivo
```

- `SITE_ADDRESS=<IP>`, `CORS_ORIGINS=https://<IP>`, `FRONTEND_RECUPERAR_SENHA_URL=https://<IP>/redefinir-senha`.
- Senhas iniciais (`SABIA_*_SENHA`) com 12+ caracteres.
- Servidor com ~1,6 GB de RAM: acrescente as linhas de `deploy/env.lowmem.example` e crie swap.

## 2. Primeiro deploy

Escolha a tag no GHCR (`sha-xxxxxxx` do último build verde da `release`).

1. **Smoke em HTTP (opcional, antes do certificado):** no `.env.prod`, `CADDYFILE=Caddyfile.http` e
   `CORS_ORIGINS=https://<IP>,http://<IP>`. Rode `deploy/deploy.sh sha-xxxxxxx` e, de outra máquina,
   `deploy/smoke.sh http://<IP>`. Em HTTP o clipboard e o cookie `Secure` não funcionam: só para teste.
2. **HTTPS em staging do Let's Encrypt:** `CADDYFILE=Caddyfile`,
   `ACME_CA=https://acme-staging-v02.api.letsencrypt.org/directory`. Rode `deploy/deploy.sh sha-xxxxxxx`
   e acompanhe `dc logs -f caddy` até aparecer `certificate obtained successfully`.
   O navegador vai avisar que o certificado não é confiável (é o esperado no staging).
   `deploy/smoke.sh https://<IP>` (usa `-k`).
3. **HTTPS em produção:** `ACME_CA=https://acme-v02.api.letsencrypt.org/directory`,
   `CORS_ORIGINS=https://<IP>`. Apague o certificado de staging e suba de novo:
   ```bash
   export IMAGE_TAG=$(cat deploy/.current_tag)
   dc stop caddy && dc rm -f caddy && docker volume rm sabia-prod_caddy_data
   deploy/deploy.sh "$IMAGE_TAG"
   ```
   Confirme o cadeado no navegador e rode `deploy/smoke.sh https://<IP>` de novo.
4. Agende o backup diário (a linha exata é impressa pelo `deploy/backup.sh`):
   ```bash
   sudo mkdir -p /var/backups/sabia && sudo chown "$USER" /var/backups/sabia
   crontab -e   # 15 3 * * * /opt/sabia/deploy/backup.sh >> /var/backups/sabia/backup.log 2>&1
   ```

Os usuários iniciais (`SABIA_ADMIN_*`, `SABIA_PROFESSOR_*`) são criados na primeira subida do
auth-service. Troque essas senhas pelo próprio sistema depois do primeiro acesso.

## 3. Rotina

| Tarefa | Comando |
|---|---|
| Atualizar | `cd /opt/sabia && git pull && deploy/deploy.sh sha-novo` (faz backup antes) |
| Rollback | `deploy/deploy.sh --rollback` (volta para a tag anterior). O schema do banco **não** volta: se a versão nova mudou tabelas, restaure o backup feito antes do deploy |
| Status | `dc ps` e `docker stats --no-stream` |
| Logs | `dc logs --tail=200 -f <serviço>` (caddy, web, api-gateway, auth-service, pedagogico-service, ia-service, database) |
| Reiniciar um serviço | `dc restart <serviço>` |
| Reiniciar tudo | `dc restart` |
| Backup manual | `deploy/backup.sh` |
| Testar um backup | `deploy/restore.sh /var/backups/sabia/sabia-AAAAMMDD-HHMMSS.dump --test` |
| Restaurar de verdade | `deploy/restore.sh <dump>` (pede `RESTAURAR`, faz backup antes) |
| Limpar imagens antigas | `docker image prune -a --filter "until=168h"` (mantém o que está em uso) |
| Espaço em disco | `df -h /` e `docker system df` |

**Reboot do servidor:** o Docker sobe com o systemd e os containers voltam sozinhos
(`restart: unless-stopped`). Depois do boot, confira `dc ps` e rode o `smoke.sh`.
Um container parado manualmente com `dc stop` **não** volta no reboot.

## 4. Certificado de IP

- Perfil `shortlived`: validade de ~6 dias. O Caddy renova sozinho na metade da vida (~a cada 3 dias).
- Se o Caddy ficar **fora do ar ou sem acesso às portas 80/443 por mais de ~6 dias**, o certificado vence
  e os navegadores bloqueiam o site. Com o servidor ligado e as portas abertas, nada precisa ser feito.
- Diagnóstico:
  ```bash
  dc logs caddy | grep -iE 'certificate|acme|error' | tail -20
  echo | openssl s_client -connect <IP>:443 2>/dev/null | openssl x509 -noout -issuer -dates
  ```
  Erros comuns: porta 80/443 bloqueada no firewall da universidade (o desafio falha), `ACME_CA` ainda
  em staging, ou limite de emissão atingido por muitas tentativas (espere e use staging para testar).
- **Contingência (certificado não sai a tempo da aula):** `CADDYFILE=Caddyfile.http` e
  `CORS_ORIGINS=https://<IP>,http://<IP>` no `.env.prod`, depois `deploy/deploy.sh "$(cat deploy/.current_tag)"`.
  Funciona em `http://<IP>`, mas o botão de copiar link não funciona e o token trafega sem criptografia.
  O HSTS é curto (1 h) justamente para permitir esse retorno. Volte para o HTTPS assim que possível.

## 5. Smoke test após cada deploy

Automático, de **outra máquina** (precisa de `curl` e `nc`):

```bash
deploy/smoke.sh https://<IP>
```

Verifica: `/` 200, `/api/health` 200, login do seed de dev recusado, documentação (Swagger/OpenAPI)
inacessível, `/api/pedagogico/api/interno/` 404, CORS do login e portas 5432, 8000, 8002, 8080, 8081,
3000, 5672 e 15672 fechadas.

Manual:

**Infra**
- [ ] `dc ps`: todos `healthy`, nenhum reiniciando em loop.
- [ ] `https://<IP>` com cadeado (certificado do Let's Encrypt de produção).
- [ ] `dc logs | grep -iE 'key=|secret|senha'` não mostra segredo; sem `DEBUG` e sem SQL nos logs.
- [ ] `docker stats --no-stream`: consumo dentro dos limites com o sistema ocioso.

**Fluxos da aula** (num computador da escola, na rede da escola)
- [ ] Professor faz login, cria uma turma e copia o link de convite (clipboard funciona em HTTPS).
- [ ] Professor cria uma atividade (blocos) e publica.
- [ ] Aluno abre `/convite/<codigo>`, faz o primeiro acesso, define a senha e entra na turma.
- [ ] Aluno sai e entra de novo pela matrícula.
- [ ] Aluno abre a atividade, o editor Blockly carrega (fontes e toolbox), executa e envia.
- [ ] Professor vê a submissão, corrige e lança a nota; o aluno vê a nota.
- [ ] Professor usa "gerar atividade com IA" e "revisar com IA".
- [ ] Degradação: `dc stop ia-service` → o professor vê erro amigável e o resto funciona; `dc start ia-service` depois.
- [ ] Recuperar senha: o e-mail chega (SMTP) com link para `https://<IP>/redefinir-senha`.
- [ ] 5–10 abas de aluno simultâneas sem erro.

**Operação**
- [ ] `deploy/backup.sh` gera o arquivo e `deploy/restore.sh <dump> --test` passa.
- [ ] `dc restart` de um serviço: volta sozinho e os dados continuam lá.

## 6. Véspera da aula

- [ ] Deploy da tag final feito com antecedência (não no dia).
- [ ] `deploy/smoke.sh https://<IP>` passando de uma máquina fora do servidor.
- [ ] Certificado com mais de 2 dias de validade (`openssl s_client`, seção 4).
- [ ] Backup do dia gerado e testado com `restore.sh --test`; uma cópia fora do servidor.
- [ ] `df -h /` com folga (> 5 GB) e `docker stats` normal.
- [ ] Cota da chave do Gemini conferida (cota esgotada vira erro `COTA_IA_ESGOTADA` para o professor).
- [ ] Turmas e atividades da aula criadas; códigos de convite à mão (impressos ou no quadro).
- [ ] Senhas iniciais já trocadas; acesso de admin testado.
- [ ] Teste na rede da escola: o firewall libera `https://<IP>`?
- [ ] Plano B combinado: `Caddyfile.http` (seção 4) e quem tem acesso SSH no dia.

## 7. Encerramento e LGPD

Depois da validação com a turma, os dados dos alunos (nome, matrícula, data de nascimento, submissões)
não devem ficar guardados sem necessidade.

1. Exporte o que o TCC precisa **sem dados pessoais** (contagens, notas agregadas, prints anonimizados).
2. Pare e apague tudo, inclusive o banco:
   ```bash
   export IMAGE_TAG=$(cat /opt/sabia/deploy/.current_tag)
   dc down -v                                    # remove containers e volumes (banco e certificados)
   ```
3. Apague os dumps e os logs:
   ```bash
   sudo rm -rf /var/backups/sabia/* /opt/sabia/deploy/backups
   crontab -e                                    # remova a linha do backup
   ```
   Apague também as cópias em `BACKUP_REMOTE`, se configurado, e os logs do Docker vão junto com os containers.
4. Apague o `.env.prod` (`shred -u /opt/sabia/.env.prod`), revogue o PAT do GHCR e troque/revogue a chave do Gemini.
5. Registre a data da exclusão (para a documentação do TCC).
