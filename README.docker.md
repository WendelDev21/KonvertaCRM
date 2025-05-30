# 🐳 Docker Setup Guide

Este guia explica como configurar e usar o ambiente Docker para o projeto CRM.

## 📋 Pré-requisitos

- Docker Desktop instalado
- Docker Compose v2+
- Node.js 18+ (para desenvolvimento local)

## 🚀 Setup Inicial

### 1. Configuração Automática (Recomendado)
\`\`\`bash
npm run docker:setup
\`\`\`

### 2. Configuração Manual

1. **Copie o arquivo de ambiente:**
\`\`\`bash
cp .env.docker .env
\`\`\`

2. **Edite as variáveis de ambiente no `.env`:**
\`\`\`env
POSTGRES_PASSWORD=sua_senha_segura
NEXTAUTH_SECRET=sua_chave_secreta_muito_longa
\`\`\`

3. **Inicie os serviços:**
\`\`\`bash
npm run docker:up
\`\`\`

## 🔧 Comandos Disponíveis

### Gerenciamento de Serviços
\`\`\`bash
npm run docker:up      # Iniciar todos os serviços
npm run docker:down    # Parar todos os serviços
npm run docker:logs    # Ver logs em tempo real
npm run docker:clean   # Limpar tudo (cuidado!)
\`\`\`

### Desenvolvimento
\`\`\`bash
npm run docker:dev     # Apenas DB para desenvolvimento local
npm run docker:migrate # Executar migrações
npm run docker:seed    # Popular banco com dados iniciais
\`\`\`

### Build e Deploy
\`\`\`bash
npm run docker:build   # Rebuild das imagens
\`\`\`

## 🌐 Acessos

- **Aplicação:** http://localhost:3000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 📊 Monitoramento

### Ver status dos serviços:
\`\`\`bash
docker-compose ps
\`\`\`

### Ver logs específicos:
\`\`\`bash
docker-compose logs app      # Logs da aplicação
docker-compose logs postgres # Logs do banco
docker-compose logs redis    # Logs do Redis
\`\`\`

### Acessar container:
\`\`\`bash
docker-compose exec app sh        # Shell da aplicação
docker-compose exec postgres bash # Shell do PostgreSQL
\`\`\`

## 🗄️ Banco de Dados

### Acessar PostgreSQL:
\`\`\`bash
docker-compose exec postgres psql -U postgres -d crm_database
\`\`\`

### Backup do banco:
\`\`\`bash
docker-compose exec postgres pg_dump -U postgres crm_database > backup.sql
\`\`\`

### Restaurar backup:
\`\`\`bash
docker-compose exec -T postgres psql -U postgres -d crm_database < backup.sql
\`\`\`

## 🔧 Desenvolvimento

### Para desenvolvimento local (recomendado):
\`\`\`bash
# Inicia apenas banco e Redis
npm run docker:dev

# Em outro terminal, rode a aplicação localmente
npm run dev
\`\`\`

### Para desenvolvimento com Docker completo:
\`\`\`bash
# Usa docker-compose.dev.yml
docker-compose -f docker-compose.dev.yml up -d
\`\`\`

## 🚨 Troubleshooting

### Problema: Porta já em uso
\`\`\`bash
# Verificar o que está usando a porta
lsof -i :3000
lsof -i :5432

# Parar serviços conflitantes
npm run docker:down
\`\`\`

### Problema: Banco não conecta
\`\`\`bash
# Verificar logs do PostgreSQL
docker-compose logs postgres

# Recriar volume do banco (CUIDADO: apaga dados!)
docker-compose down -v
docker volume rm $(docker volume ls -q | grep postgres)
npm run docker:up
\`\`\`

### Problema: Aplicação não inicia
\`\`\`bash
# Verificar logs da aplicação
docker-compose logs app

# Rebuild da imagem
npm run docker:build
\`\`\`

### Reset completo:
\`\`\`bash
npm run docker:clean
npm run docker:setup
\`\`\`

## 📁 Estrutura de Volumes

- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis
- `./uploads`: Arquivos enviados pela aplicação

## 🔒 Segurança

### Para produção, altere:
- `POSTGRES_PASSWORD`: Use senha forte
- `NEXTAUTH_SECRET`: Use chave de 32+ caracteres
- `REDIS_PASSWORD`: Adicione senha ao Redis
- Configure SSL/TLS para conexões externas

## 📝 Logs

Os logs são automaticamente coletados pelo Docker. Para análise:

\`\`\`bash
# Logs com timestamp
docker-compose logs -t

# Seguir logs em tempo real
docker-compose logs -f

# Logs dos últimos 100 linhas
docker-compose logs --tail=100
