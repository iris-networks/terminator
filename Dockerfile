# Multi-stage build - compile binary inside Linux container
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies (skip puppeteer download)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN bun install

# Copy source code
COPY . .

# Build frontend and compile binary for Linux
RUN bun run build
RUN bun build backend/src/index.ts --compile --external puppeteer --outfile=./dist/iris-server

# Production stage - LinuxServer.io webtop
FROM lscr.io/linuxserver/webtop:ubuntu-mate

# Set environment variables
ENV TITLE="Iris AI Platform"
ENV CUSTOM_USER=iris
ENV PASSWORD=iris123

# Configure puppeteer to use system Chrome
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy the compiled binary and frontend files from builder stage
COPY --from=builder /app/dist/iris-server /app/iris-server
COPY --from=builder /app/backend/public /app/public
RUN chmod +x /app/iris-server

# Create data and workspace directories with proper permissions
# LinuxServer.io webtop runs as user 'abc' (UID 911, GID 911)
RUN mkdir -p /app/data /app/workspace && \
    chown -R 911:911 /app && \
    chmod -R 755 /app

# Create desktop shortcut (optional - user can double-click to start)
USER root
RUN mkdir -p /config/Desktop
COPY <<EOF /config/Desktop/iris-ai.desktop
[Desktop Entry]
Version=1.0
Type=Application
Name=Iris AI Platform
Comment=AI-powered research and automation platform
Exec=sh -c 'cd /app && ./iris-server'
Icon=applications-internet
Terminal=true
Categories=Network;WebBrowser;
EOF

RUN chmod +x /config/Desktop/iris-ai.desktop

# Expose ports
EXPOSE 3000 3001

# No auto-start - users can manually launch via desktop shortcut
# Access desktop at http://localhost:3000 (username: iris, password: iris123)
# Launch Iris manually from desktop, then access at http://localhost:3001