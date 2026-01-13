FROM oven/bun:1.1.42-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p data

# Setup database
RUN bun run db:setup

# Expose port
EXPOSE 5555

# Start the application
CMD ["bun", "run", "start"]
