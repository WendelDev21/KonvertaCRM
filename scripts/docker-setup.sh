#!/bin/bash

echo "🐳 Setting up Docker environment for CRM application..."

# Create necessary directories
mkdir -p uploads

# Build and start services
echo "🚀 Building and starting Docker services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec app npx prisma migrate deploy

echo "✅ Setup complete!"
echo ""
echo "🌐 Application should be available at: http://localhost:3000"
echo "🗄️  PostgreSQL is available at: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Access database: docker-compose exec postgres psql -U wendeladminn -d users_db_kv"
