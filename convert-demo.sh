#!/bin/bash

# Demo Video to GIF Converter for Iris
# Usage: ./convert-demo.sh input-video.mp4

if [ $# -eq 0 ]; then
    echo "Usage: $0 <input-video-file>"
    echo "Example: $0 demo-video.mp4"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="demo.gif"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found!"
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is required but not installed."
    echo "Install with: brew install ffmpeg"
    exit 1
fi

echo "Converting $INPUT_FILE to optimized GIF..."

# Create ultra-sharp text demo GIF - maximum text clarity
# - Extract key 15 seconds of main functionality
# - Scale to 1200px using bicubic for sharpest text
# - Use 1fps for excellent quality with readable frames
# - Direct encoding optimized for text sharpness

ffmpeg -i "$INPUT_FILE" -ss 15 -t 15 \
    -vf "fps=1,scale=1200:-1:flags=bicubic,unsharp=5:5:1.0:5:5:0.0" \
    -sws_flags bicubic \
    -y "$OUTPUT_FILE"

# Clean up temporary palette file
rm -f palette.png

# Check output file size
if [ -f "$OUTPUT_FILE" ]; then
    SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "✅ Successfully created $OUTPUT_FILE (Size: $SIZE)"
    echo "📍 Place the video file in the root directory and run this script"
    echo "🎬 The demo.gif will be automatically referenced in README.md"
else
    echo "❌ Failed to create GIF"
    exit 1
fi