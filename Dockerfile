FROM node:20-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies inside the container to ensure platform-specific binaries (like Prisma) work correctly
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile seed script to plain JS
RUN node_modules/.bin/esbuild prisma/seed.ts \
    --bundle --platform=node --outfile=prisma/seed.js \
    --external:@prisma/client --external:.prisma/client

# Build the Next.js app (standalone output)
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma CLI + client from builder
COPY --from=builder /app/node_modules/.bin/prisma /usr/local/bin/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Ensure db directory exists
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
