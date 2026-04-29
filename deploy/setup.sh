#!/bin/bash
set -e

# W-Edu — Script de setup para nova máquina (Ubuntu 22.04+)
# Uso: sudo bash setup.sh

echo "=== W-Edu Setup ==="

# --- Dependências do sistema ---
apt-get update -qq
apt-get install -y -qq \
  git curl wget \
  python3 python3-pip python3-venv \
  postgresql postgresql-client \
  nginx

# --- Node.js 20 ---
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# --- PostgreSQL ---
systemctl enable postgresql
systemctl start postgresql

# Cria usuário e banco (idempotente)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='wedu'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER wedu WITH PASSWORD 'wedu';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='wedu'" | grep -q 1 || \
  sudo -u postgres createdb -O wedu wedu

echo "✓ PostgreSQL configurado"

# --- Diretório da aplicação ---
APP_DIR=/var/www/W-Edu
mkdir -p $APP_DIR
cp -r . $APP_DIR
chown -R www-data:www-data $APP_DIR

# --- Backend ---
cd $APP_DIR/backend
python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt

# Copia e ajusta .env
cp .env.example .env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://wedu:wedu@localhost:5432/wedu|" .env

# Migrations
DATABASE_URL=postgresql://wedu:wedu@localhost:5432/wedu \
  PYTHONPATH=$APP_DIR/backend \
  .venv/bin/alembic --config alembic.ini upgrade head

echo "✓ Backend configurado"

# --- Frontend ---
cd $APP_DIR/frontend
npm ci --silent
npm run build

echo "✓ Frontend construído"

# --- Serviços systemd ---
cp $APP_DIR/deploy/wedu-backend.service /etc/systemd/system/
cp $APP_DIR/deploy/wedu-frontend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable wedu-backend wedu-frontend
systemctl restart wedu-backend wedu-frontend

# --- Nginx ---
cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/wedu
ln -sf /etc/nginx/sites-available/wedu /etc/nginx/sites-enabled/wedu
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "=== Deploy concluído ==="
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Nginx:    http://SEU_IP"
