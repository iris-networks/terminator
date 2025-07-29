#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Usage: $0 <port>"
    echo "Example: $0 3000"
    exit 1
fi

PORT=$1

# Find process ID using the port
PID=$(lsof -ti :$PORT)

if [ -z "$PID" ]; then
    echo "No process found running on port $PORT"
    exit 1
fi

echo "Found process $PID running on port $PORT"
echo "Killing process..."

# Kill the process
kill -9 $PID

if [ $? -eq 0 ]; then
    echo "Process $PID killed successfully"
else
    echo "Failed to kill process $PID"
    exit 1
fi