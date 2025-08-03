# Terminator Docker Setup

This setup uses the LinuxServer WebTop image to provide a complete desktop environment with Terminator running as a standalone binary.

## Quick Start

1. **Build the Docker image:**
   ```bash
   docker-compose build
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the desktop environment:**
   - Open your browser and go to `http://localhost:3001`
   - You'll see a full Linux desktop environment (KDE)

4. **Start Terminator:**
   - On the desktop, double-click the "Terminator" shortcut
   - Or open a terminal and run: `/app/start-terminator.sh`
   - Terminator will be available at `http://localhost:3000`

## Configuration

1. **AI Provider Setup:**
   - Edit `/app/terminator/.env` in the container
   - Or mount a local `.env` file as a volume:
     ```yaml
     volumes:
       - ./.env:/app/terminator/.env
     ```

2. **Data Persistence:**
   - The `./config` directory on your host is mounted to `/config` in the container
   - Desktop settings and user data will persist between container restarts

## Architecture

- **Base Image:** LinuxServer WebTop (Ubuntu KDE)
- **Binary:** Standalone Bun-compiled Terminator executable
- **Assets:** Static frontend files served by the binary
- **Browser:** Chromium installed for Puppeteer automation
- **Desktop:** Full KDE desktop environment accessible via web browser

## Ports

- `3000`: Terminator web interface
- `3001`: WebTop desktop environment
- `6379`: Redis (optional, for session storage)

## Environment Variables

- `PUID=1000`: User ID for file permissions
- `PGID=1000`: Group ID for file permissions  
- `TZ=Etc/UTC`: Timezone
- `TITLE=Terminator`: Window title

## Troubleshooting

1. **Binary not executable:**
   ```bash
   docker exec -it terminator-webtop chmod +x /app/terminator/terminator
   ```

2. **Missing assets:**
   ```bash
   # Rebuild with assets
   bun run build
   docker-compose build --no-cache
   ```

3. **Browser issues:**
   - The container includes Chromium for Puppeteer
   - Browser automation should work out of the box
   - Additional permissions may be needed for advanced features

## Building from Source

To rebuild the binary and Docker image:

```bash
# Build frontend and binary
bun run build
mkdir -p ./dist
bun build backend/src/index.ts --compile --target=bun-linux-x64 --outfile=./dist/terminator-linux
cp -r backend/public ./dist/

# Rebuild Docker image
docker-compose build --no-cache
```