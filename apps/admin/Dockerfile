FROM node:20-alpine AS builder
WORKDIR /app

# Copy the full monorepo (needed for workspace packages)
COPY . .

# Install all dependencies
RUN npm ci

# Generate Prisma client for the current OS/arch
RUN cd packages/db && npx prisma generate

# Build the admin app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@klickkk/admin

# ---- Minimal production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output mirrors monorepo layout (outputFileTracingRoot = repo root)
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static     ./apps/admin/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/admin/server.js"]
