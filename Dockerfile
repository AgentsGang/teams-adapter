# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./
RUN npm run build

# Debug: проверить, что index.js существует
RUN ls -R /app/dist

# Stage 2: Production
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy static files
COPY manifest.json ./
COPY color-icon.png outline-icon.png ./

# Change ownership and switch to non-root user
RUN chown -R botuser:nodejs /app
USER botuser

EXPOSE 3978

CMD ["node", "dist/index.js"]