# Build stage
FROM node:20-slim AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /build

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/middleware ./packages/middleware

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @line-twilio-chat/shared build || true
RUN echo "=== Debug: Before build ==="
RUN ls -la /build/packages/middleware/
RUN echo "=== Debug: Building middleware ==="
RUN cd /build/packages/middleware && pwd && ls -la && pnpm build
RUN echo "=== Debug: After build ==="
RUN ls -la /build/packages/middleware/
RUN echo "=== Debug: Looking for dist ==="
RUN find /build/packages/middleware -type d -name "dist"
RUN echo "=== Debug: Looking for .js files ==="
RUN find /build/packages/middleware -name "*.js" -type f | head -20

# Production stage
FROM node:20-slim

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for dependency resolution
COPY packages/shared/package.json ./packages/shared/
COPY packages/middleware/package.json ./packages/middleware/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /build/packages/shared/src ./packages/shared/src
COPY --from=builder /build/packages/middleware/dist ./packages/middleware/dist
COPY --from=builder /build/node_modules ./node_modules

WORKDIR /app/packages/middleware

# Expose port (Cloud Run provides PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "dist/server.js"]
