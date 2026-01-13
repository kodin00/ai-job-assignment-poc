#!/bin/sh
set -e

# Initialize database if it doesn't exist
if [ ! -f "/app/data/jobs.db" ]; then
  echo "📦 Initializing database..."
  bun run db:setup
fi

# Start the application
echo "🚀 Starting application..."
exec bun run start
