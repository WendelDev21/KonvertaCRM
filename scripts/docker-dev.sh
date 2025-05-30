#!/bin/bash

echo "🔧 Starting development environment with Docker..."

# Start only database for development
docker-compose up -d postgres

echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev

echo "✅ Development environment ready!"
echo ""
echo "🗄️  PostgreSQL is running at: localhost:5432"
echo ""
echo "Now you can run your Next.js app locally with:"
echo "  npm run dev"
