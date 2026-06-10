
# Multi-stage Dockerfile for building and running the NestJS app
# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (includes devDependencies needed for build)
COPY package.json package-lock.json* ./
RUN npm install --silent

# Copy source and build
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install only production deps
COPY package.json package-lock.json* ./
RUN npm install --production --silent

# Copy built output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/images ./images
COPY --from=builder /app/start.js ./start.js

EXPOSE 4000

CMD ["node", "start.js"]
