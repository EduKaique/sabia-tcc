# Guia de teste manual — HU002 Recuperar senha (`auth-service`)

Roteiro para validar na mão o fluxo `esqueci-senha → link no log → redefinir-senha → login com a senha nova`
implementado na issue [#17](https://github.com/EduKaique/sabia-tcc/issues/17).

## 0. Atalho rápido (automatizado)

Antes de testar na mão, o jeito mais rápido de confirmar que está tudo certo é rodar a suíte
de testes — ela já cobre todos os cenários deste guia de forma determinística:

```bash
cd auth-service
./mvnw test
```

Esperado: `Tests run: 16, Failures: 0, Errors: 0` (8 deles são só do fluxo de recuperação de senha,
em `RecuperacaoSenhaControllerTest`).

O restante deste guia é para quem quer ver o fluxo acontecendo de verdade (ex.: gravar
print/vídeo para o professor).

## 1. Subir o serviço

```bash
# 1. Auth DB
docker compose up -d auth-db

# 2. auth-service (na raiz do repo)
cd auth-service
./mvnw spring-boot:run
```

- API em `http://localhost:8081`
- Swagger UI em `http://localhost:8081/swagger-ui.html` (dá pra rodar os passos abaixo por lá também)
- Usuário seed: `professor@sabia.edu` / senha `password`

Deixe o terminal do `spring-boot:run` visível — é nele que o link de recuperação vai aparecer
(implementação `dev` do `EmailService`, que só loga o link em vez de mandar e-mail de verdade).

## 2. Fluxo feliz

**2.1 — Pedir a recuperação**

```bash
curl -i -X POST http://localhost:8081/api/auth/esqueci-senha \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@sabia.edu"}'
```

Esperado: `200` com
```json
{"mensagem":"Se o e-mail informado estiver cadastrado, você receberá as instruções de recuperação em instantes."}
```

**2.2 — Pegar o link no log**

No terminal do serviço, procure uma linha assim:

```
[DEV] Link de recuperação de senha para Ana Professora <professor@sabia.edu>: http://localhost:3000/recuperar-senha?token=AbC123...
```

Copie o valor depois de `token=` — é ele que vai no próximo passo.

**2.3 — Redefinir a senha**

```bash
curl -i -X POST http://localhost:8081/api/auth/redefinir-senha \
  -H "Content-Type: application/json" \
  -d '{"token":"COLE_O_TOKEN_AQUI","novaSenha":"novaSenha123","confirmarSenha":"novaSenha123"}'
```

Esperado: `200` com `{"mensagem":"Senha redefinida com sucesso."}`

**2.4 — Logar com a senha nova**

```bash
curl -i -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@sabia.edu","senha":"novaSenha123"}'
```

Esperado: `200` com o token JWT. A senha antiga (`password`) deve dar `401` a partir daqui.

## 3. Casos de erro (critérios de aceite)

**3.1 — E-mail que não existe → mesma resposta (não revela se o e-mail está cadastrado)**

```bash
curl -i -X POST http://localhost:8081/api/auth/esqueci-senha \
  -H "Content-Type: application/json" \
  -d '{"email":"ninguem@sabia.edu"}'
```
Esperado: `200` com a **mesma** mensagem do passo 2.1.

**3.2 — Senhas divergentes → 422**

Peça um link novo (repita 2.1/2.2) e tente redefinir com senhas diferentes:

```bash
curl -i -X POST http://localhost:8081/api/auth/redefinir-senha \
  -H "Content-Type: application/json" \
  -d '{"token":"COLE_O_TOKEN_AQUI","novaSenha":"senhaA123","confirmarSenha":"senhaB123"}'
```
Esperado: `422` — `{"erro":"As senhas não coincidem."}`

**3.3 — Token que não existe → 422**

```bash
curl -i -X POST http://localhost:8081/api/auth/redefinir-senha \
  -H "Content-Type: application/json" \
  -d '{"token":"token-inventado","novaSenha":"senhaA123","confirmarSenha":"senhaA123"}'
```
Esperado: `422` — `{"erro":"Link inválido."}`

**3.4 — Token já usado → 410**

Repita o passo 2.3 com o **mesmo token** que você já usou no fluxo feliz:

```bash
curl -i -X POST http://localhost:8081/api/auth/redefinir-senha \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_JA_USADO","novaSenha":"outraSenha123","confirmarSenha":"outraSenha123"}'
```
Esperado: `410` — `{"erro":"Este link já foi utilizado."}`

**3.5 — Token expirado → 410**

Difícil de simular manualmente (o token vale 24h). Duas opções:
- Confie no teste automatizado `redefinirSenha_comTokenExpirado_retorna410`, que força a
  expiração direto no banco; ou
- Manualmente: peça um link (2.1/2.2), depois no Postgres do `auth-db`:
  ```sql
  UPDATE token_recuperacao_senha SET expira_em = now() - interval '1 minute'
  WHERE hash_token = (SELECT hash_token FROM token_recuperacao_senha ORDER BY id DESC LIMIT 1);
  ```
  e então chame `/api/auth/redefinir-senha` com o token — esperado `410` com
  `{"erro":"Este link expirou."}`.

**3.6 — Pedir um segundo link invalida o primeiro**

Peça `esqueci-senha` duas vezes seguidas para o mesmo e-mail (guarde os dois tokens do log).
Redefina a senha com o **segundo** token (sucesso), depois tente usar o **primeiro** →
esperado `410` (foi invalidado automaticamente ao redefinir com o segundo).
