#!/bin/sh

echo "🔄 Aplicando migrações do Prisma..."
npx prisma db push

echo "🚀 Criando usuário admin..."
node scripts/create_admin_user.js

echo "🎯 Iniciando aplicação"
exec node server.js
