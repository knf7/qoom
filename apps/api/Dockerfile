# ==========================================
# 1. Build Stage
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Install PNPM globally for monorepo speed
RUN npm install -g pnpm

# Copy workspace configurations and manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/prompts/package.json ./packages/prompts/
COPY packages/security/package.json ./packages/security/
COPY packages/ui/package.json ./packages/ui/

# Fetch dependencies
RUN pnpm install --frozen-lockfile

# Copy monorepo codebases
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

# Generate Prisma Engine and build the NestJS server bundle
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
RUN pnpm --filter @qoom/api build

# ==========================================
# 2. Production Stage
# ==========================================
FROM node:18-alpine AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN npm install -g pnpm

# Copy compiled bundles and manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/prompts/package.json ./packages/prompts/
COPY packages/security/package.json ./packages/security/
COPY packages/ui/package.json ./packages/ui/

# Fetch production dependencies strictly to minimize container sizes
RUN pnpm install --prod --frozen-lockfile

# Fetch generated client and build artifacts from builder stage
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /usr/src/app/packages/types/dist ./packages/types/dist
COPY --from=builder /usr/src/app/packages/prompts/dist ./packages/prompts/dist
COPY --from=builder /usr/src/app/packages/security/dist ./packages/security/dist
COPY --from=builder /usr/src/app/packages/ui/dist ./packages/ui/dist

# Expose server port
EXPOSE 3001

CMD ["pnpm", "--filter", "@qoom/api", "start"]
