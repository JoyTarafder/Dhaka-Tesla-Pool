# Production multi-stage Dockerfile for Dhaka Tesla Pool Express Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code and build config
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma Client and build TypeScript to JavaScript
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm install prisma@^6.4.1 tsx@^4.19.3

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000

CMD ["./docker-entrypoint.sh"]
