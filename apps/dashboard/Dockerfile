# ============================================================
# Stage 1: Install dependencies
# ============================================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

WORKDIR /app

# Copy workspace root files needed for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package.json for each workspace package
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/sdk/package.json ./packages/sdk/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2: Build the application
# ============================================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY --from=deps /app/packages/sdk/node_modules ./packages/sdk/node_modules

# Copy all source code
COPY . .

# Build with turbo (builds sdk first, then dashboard)
RUN pnpm turbo run build --filter=@vibeping/dashboard...

# ============================================================
# Stage 3: Production runtime
# ============================================================
FROM node:20-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js standalone output
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "apps/dashboard/server.js"]
