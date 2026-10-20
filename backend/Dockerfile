# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_OPTIONS="--max-old-space-size=512"

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --no-audit --maxsockets=2

# Copy source code and configuration
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=5001

# Copy package files
COPY package*.json ./

# Copy dependencies, compiled files, and Prisma artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5001

# Run compiled Node.js server
CMD ["node", "dist/server.js"]
