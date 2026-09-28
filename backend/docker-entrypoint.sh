#!/bin/sh
set -e

echo "🚀 Dhaka Tesla Pool Backend Container Starting..."

# Run database migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

# Run seed script (idempotent upserts)
echo "🌱 Seeding initial database records (Jashim, Bullet, Nusrat, Rafiq, Shirin)..."
npx tsx prisma/seed.ts || echo "Seed skipped or already applied"

# Start the compiled production server
echo "⚡ Starting HTTP Server on port 4000..."
exec node dist/server.js
