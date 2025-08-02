FROM lscr.io/linuxserver/webtop:ubuntu-xfce

# Switch to root user to install packages
USER root

# Install Bun, and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    openjdk-11-jdk \
    ca-certificates \
    unzip \
    && curl -fsSL https://bun.sh/install | bash \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Add Bun to PATH
ENV PATH="/root/.bun/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Set puppeteer to skip downloading Chromium (use system Chrome from webtop)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Install dependencies
RUN bun install

# Copy source code (excluding .env files via .dockerignore)
COPY . .

# Build the application
RUN bun run build

# Create workspace directory
RUN mkdir -p /app/backend/workspace && chmod 777 /app/backend/workspace

# Expose ports
EXPOSE 3001