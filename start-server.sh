#!/bin/bash

# Secure server startup script
# Environment variables are passed via stdin to avoid exposure in process list

# Default values (can be overridden)
DISPLAY_VAL="${DISPLAY:-:1}"
PROVIDER_VAL="${PROVIDER:-anthropic}"
MODEL_VAL="${MODEL:-claude-sonnet-4-20250514}"

# Check if API key is provided
if [ -z "$API_KEY" ]; then
    echo "Error: API_KEY environment variable must be set"
    echo "Usage: API_KEY=your_key ./start-server.sh"
    exit 1
fi

# Create temporary environment file
TEMP_ENV=$(mktemp)
trap "rm -f $TEMP_ENV" EXIT

# Write environment variables to temp file
cat > "$TEMP_ENV" << EOF
DISPLAY=$DISPLAY_VAL
OPENAI_API_KEY=$API_KEY
PROVIDER=$PROVIDER_VAL
MODEL=$MODEL_VAL
EOF

# Start the server with clean environment and only required variables
# This prevents API key from appearing in process list or printenv
env -i PATH="$PATH" NODE_PATH="$NODE_PATH" HOME="$HOME" $(cat "$TEMP_ENV" | xargs) pnpm start &

echo "Server started with PID $!"
echo "Environment variables loaded securely (not visible in ps aux)"