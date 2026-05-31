# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm install --workspace=frontend
COPY frontend/ ./frontend/
RUN npm --workspace=frontend run build

# Stage 2: Production backend
FROM node:20-alpine AS production
WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build output
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Generate Prisma client
RUN cd backend && npx prisma generate

# Create uploads directory
RUN mkdir -p /app/backend/uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node src/server.js"]
