# Build stage
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy root package files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml* ./

# Copy all packages
COPY packages ./packages

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the middleware package
RUN pnpm --filter @line-twilio-chat/middleware build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy package.json files
COPY packages/middleware/package.json ./packages/middleware/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile --filter @line-twilio-chat/middleware...

# Copy built files
COPY --from=builder /app/packages/middleware/dist ./packages/middleware/dist

# Set working directory to middleware
WORKDIR /app/packages/middleware

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "dist/server.js"]
