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
Edite `/opt/w-edu/backend/.env` antes de subir os serviços.  
Troque obrigatoriamente o `SECRET_KEY` em produção.

## Portas internas
| Serviço   | Porta |
|-----------|-------|
| Backend   | 8000  |
| Frontend  | 3000  |
| Nginx     | 80    |
| PostgreSQL| 5432  |

## Atualizar após mudanças
```bash
cd /opt/w-edu

# Backend
git pull
cd backend && .venv/bin/pip install -r requirements.txt
PYTHONPATH=/opt/w-edu/backend .venv/bin/alembic --config alembic.ini upgrade head
sudo systemctl restart wedu-backend

# Frontend
cd ../frontend && npm ci && npm run build
sudo systemctl restart wedu-frontend
```
