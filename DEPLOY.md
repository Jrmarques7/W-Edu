# W-Edu — Deploy

## Pré-requisitos
- Ubuntu 22.04+
- Git
- Acesso root (sudo)

## Passo a passo

### 1. Clonar o repositório
```bash
git clone <URL_DO_REPO> w-edu
cd w-edu
```

### 2. Rodar o setup
```bash
sudo bash deploy/setup.sh
```

O script instala e configura automaticamente:
- Python 3 + venv + dependências
- Node.js 20 + build do frontend
- PostgreSQL + banco `wedu`
- Serviços systemd (`wedu-backend`, `wedu-frontend`)
- Nginx como reverse proxy na porta 80

### 3. Criar o primeiro admin
```bash
bash deploy/create-admin.sh "Seu Nome" "seu@email.com" "suasenha"
```

### 4. Acessar
```
http://SEU_IP
```

---

## Gerenciar os serviços
```bash
sudo systemctl status wedu-backend
sudo systemctl status wedu-frontend

sudo systemctl restart wedu-backend
sudo systemctl restart wedu-frontend

# Logs
journalctl -u wedu-backend -f
journalctl -u wedu-frontend -f
```

## Variáveis de ambiente
Edite `/var/www/W-Edu/backend/.env` antes de subir os serviços.  
Troque obrigatoriamente o `SECRET_KEY` em produção.

Para envio de notificações via W-Omni/WhatsApp, configure:

```env
WOMNI_URL=https://seu-womni
WOMNI_API_TOKEN=token-opcional
NOTIFICATION_DISPATCH_TIMEOUT_SECONDS=10
NOTIFICATION_WORKER_ENABLED=true
NOTIFICATION_WORKER_INTERVAL_SECONDS=60
NOTIFICATION_WORKER_BATCH_SIZE=100
```

O W-Edu envia eventos WhatsApp para `POST {WOMNI_URL}/messages`.

Para envio de notificações por email, configure SMTP:

```env
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USERNAME=usuario
SMTP_PASSWORD=senha
SMTP_FROM_EMAIL=noreply@exemplo.com
SMTP_USE_TLS=true
```

## Portas internas
| Serviço   | Porta |
|-----------|-------|
| Backend   | 8000  |
| Frontend  | 3000  |
| Nginx     | 80    |
| PostgreSQL| 5432  |

## Microfone em rede local

Navegadores só liberam `getUserMedia` em contexto seguro: `https://` ou `http://localhost`.
Ao acessar por IP, por exemplo `http://172.16.102.76:3000`, o microfone será bloqueado pelo navegador.

Para testar a aula de voz em outro dispositivo na mesma rede, suba o frontend em HTTPS:

```bash
cd frontend
npm run dev:https
```

Depois acesse:

```text
https://172.16.102.76:3000
```

Na primeira execução, o Next pode pedir a senha do sistema para instalar uma CA local via `mkcert`.
Aceite o certificado local no navegador.

Em produção, não exponha o BeVox diretamente como `https://dominio:8001`. A porta `8001` normalmente fala HTTP/WebSocket puro, então o navegador falha ao abrir `wss://dominio:8001/...` se não houver TLS nessa porta.

O `npm start` do frontend sobe `server.mjs`, que roda o Next e faz proxy WebSocket em `/bevox/` para o BeVox local. Deixe `BEVOX_PUBLIC_URL` vazio quando o BeVox estiver no mesmo servidor. O frontend usará:

```text
wss://seu-dominio/bevox/ws/voice/stream
```

Se o BeVox estiver em outro serviço/domínio com TLS próprio, configure `BEVOX_PUBLIC_URL` com a URL pública HTTPS desse serviço, sem o caminho `/ws/voice/stream`.

Um `404` em `/api/quizzes/lesson/<id>/attempts` significa que a aula não tem quiz cadastrado para esse aluno; essa chamada é opcional e não bloqueia o microfone.

## Atualizar após mudanças

### Opção recomendada

Use o script genérico de atualização:

```bash
cd /var/www/W-Edu
sudo bash deploy/update.sh
```

Se o projeto estiver em outro diretório:

```bash
sudo APP_DIR=/var/www/W-Edu bash /var/www/W-Edu/deploy/update.sh
```

O script aceita variáveis para outros projetos:

```bash
sudo APP_DIR=/var/www/my-app \
  BRANCH=main \
  BACKEND_DIR=api \
  FRONTEND_DIR=web \
  BACKEND_SERVICE=my-api \
  FRONTEND_SERVICE=my-web \
  MIGRATE_CMD="PYTHONPATH=/var/www/my-app/api .venv/bin/alembic --config alembic.ini upgrade head" \
  FRONTEND_BUILD_CMD="npm ci && npm run build" \
  bash /var/www/my-app/deploy/update.sh
```

### Manual

```bash
cd /var/www/W-Edu

# Backend
git pull
cd backend && .venv/bin/pip install -r requirements.txt
PYTHONPATH=/var/www/W-Edu/backend .venv/bin/alembic --config alembic.ini upgrade head
sudo systemctl restart wedu-backend

# Frontend
cd ../frontend && npm ci && npm run build
sudo systemctl restart wedu-frontend
```
