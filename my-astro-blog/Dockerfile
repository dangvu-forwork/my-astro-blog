# STAGE 1: Build & Compile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# STAGE 2: Lean Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOST=:: PORT=4321
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4321/api/health || exit 1

CMD ["node", "./dist/server/entry.mjs"]