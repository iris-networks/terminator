FROM lscr.io/linuxserver/webtop:ubuntu-kde

# Set metadata
LABEL org.opencontainers.image.title="Terminator"
LABEL org.opencontainers.image.description="AI-powered research and automation platform"
LABEL org.opencontainers.image.version="1.0.0"

# Install required dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    chromium-browser \
    fonts-liberation \
    libasound2t64 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libnss3 \
    && rm -rf /var/lib/apt/lists/*

# Create application directory
RUN mkdir -p /app/terminator

# Copy the compiled binary and assets
COPY ./dist/terminator-linux /app/terminator/terminator
COPY ./dist/public /app/terminator/public
COPY ./.env.example /app/terminator/.env

# Make the binary executable
RUN chmod +x /app/terminator/terminator

# Set up environment for Chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app/terminator

# Create a startup script
RUN echo '#!/bin/bash\n\
echo "Starting Terminator..."\n\
echo "Terminator will be available at http://localhost:3000"\n\
echo "Configure your AI provider by editing /app/terminator/.env"\n\
echo ""\n\
cd /app/terminator\n\
./terminator\n\
' > /app/start-terminator.sh && chmod +x /app/start-terminator.sh

# Create desktop shortcut
RUN mkdir -p /config/Desktop && \
    echo '[Desktop Entry]\n\
Version=1.0\n\
Type=Application\n\
Name=Terminator\n\
Comment=AI-powered research and automation platform\n\
Exec=/app/start-terminator.sh\n\
Icon=applications-internet\n\
Terminal=true\n\
StartupNotify=false\n\
Categories=Network;WebBrowser;\n\
' > /config/Desktop/terminator.desktop && \
    chmod +x /config/Desktop/terminator.desktop

# Expose the default port
EXPOSE 3000

# The base image will handle the desktop environment
# Users can manually start Terminator from the desktop or terminal