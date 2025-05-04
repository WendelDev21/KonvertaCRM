#!/bin/bash

# Verificar se o Prisma CLI está instalado
if ! command -v npx &> /dev/null; then
    echo "npx não encontrado. Por favor, instale o Node.js e o npm."
    exit 1
fi

echo "🔄 Aplicando alterações no esquema do banco de dados..."

# Gerar cliente Prisma
echo "Gerando cliente Prisma..."
npx prisma generate

# Tentar aplicar as migrações
echo "Aplicando migrações..."
npx prisma migrate dev --name add_user_fields || {
    echo "⚠️ Não foi possível aplicar as migrações automaticamente."
    echo "Tentando aplicar o esquema diretamente..."
    
    # Tentar aplicar o esquema diretamente (útil em ambientes de produção)
    npx prisma db push || {
        echo "❌ Não foi possível aplicar o esquema diretamente."
        echo "Por favor, verifique sua conexão com o banco de dados e tente novamente."
        exit 1
    }
}

echo "✅ Alterações no esquema aplicadas com sucesso!"
