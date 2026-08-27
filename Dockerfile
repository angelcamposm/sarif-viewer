# ==============================================================================
# Multi-Stage Rootless Dockerfile for SARIF Security Report Viewer
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build application bundle with Node.js
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies with clean cache
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY tsconfig.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/

# Build static production bundle into /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Serve static production assets with Rootless Nginx
# ------------------------------------------------------------------------------
FROM nginx:alpine-slim AS runner

# Remove default website files and configuration
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/* /etc/nginx/nginx.conf

# Copy complete rootless Nginx master configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled production artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create temporary directories and establish permissions for unprivileged nginx user (UID 101)
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp_path /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    touch /tmp/nginx.pid && \
    chown -R nginx:nginx /tmp /usr/share/nginx/html /var/log/nginx /etc/nginx

# Switch to unprivileged non-root user
USER nginx

# Expose unprivileged non-root port 8080 (IPv4)
EXPOSE 8080

# Health check to ensure Nginx is actively answering requests on port 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
