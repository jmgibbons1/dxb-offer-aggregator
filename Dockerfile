# syntax=docker/dockerfile:1

# --- Stage 1: build the Vite frontend + install all deps -------------------
FROM node:20-bookworm AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build            # -> /app/dist

# --- Stage 2: production dependencies only (compiles better-sqlite3) --------
FROM node:20-bookworm AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- Stage 3: slim runtime --------------------------------------------------
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY package.json ./
EXPOSE 3001
CMD ["node", "server/index.js"]
