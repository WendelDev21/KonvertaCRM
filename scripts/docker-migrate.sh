#!/bin/sh

echo "🔄 Running database migrations..."

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"
