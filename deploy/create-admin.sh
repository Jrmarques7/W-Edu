#!/bin/bash
# Cria o primeiro usuário admin após o deploy
# Uso: bash create-admin.sh "Nome" "email@exemplo.com" "senha"

NAME="${1:-Admin}"
EMAIL="${2:-admin@wedu.com}"
PASSWORD="${3:-admin123}"

API="http://localhost:8002"

echo "Criando conta admin: $EMAIL"

RESPONSE=$(curl -s -X POST "$API/students" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

ID=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ -z "$ID" ]; then
  echo "Erro ao criar conta: $RESPONSE"
  exit 1
fi

psql postgresql://wedu:wedu@localhost:5432/wedu \
  -c "UPDATE students SET role='admin' WHERE id=$ID;"

echo ""
echo "✓ Admin criado com sucesso!"
echo "  E-mail: $EMAIL"
echo "  Senha:  $PASSWORD"
echo "  Acesse: http://SEU_IP"
