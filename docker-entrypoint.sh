#!/bin/sh
set -e

# Always ensure database is initialized
echo "📦 Checking database..."
if [ ! -f "/app/data/jobs.db" ] || [ ! -s "/app/data/jobs.db" ]; then
  echo "📦 Initializing database..."
  bun run db:setup
else
  echo "✅ Database already exists"
fi

# Start the application
echo "🚀 Starting application..."
exec bun run start
