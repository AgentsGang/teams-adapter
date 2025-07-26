# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# Debug: Verify build output
RUN ls -la /app/dist/ && echo "Build completed successfully"

# Stage 2: Production
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Teams app manifest and icons (if they exist)
COPY manifest.json ./
COPY *.png ./

# Create logs directory
RUN mkdir -p logs && chown -R botuser:nodejs logs

# Change ownership of the app directory
RUN chown -R botuser:nodejs /app

# Switch to non-root user
USER botuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3978/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3978

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]