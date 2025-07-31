FROM lscr.io/linuxserver/webtop:ubuntu-xfce

# Switch to root user to install packages
USER root

# Install Node.js 18+, pnpm, and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    openjdk-11-jdk \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g pnpm@8.15.1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Set puppeteer to skip downloading Chromium (use system Chrome from webtop)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Install dependencies
RUN pnpm install

# Copy source code (excluding .env files via .dockerignore)
COPY . .

# Build the application
RUN pnpm build

# Create workspace directory
RUN mkdir -p /app/backend/workspace && chmod 777 /app/backend/workspace

# Expose ports
EXPOSE 3001