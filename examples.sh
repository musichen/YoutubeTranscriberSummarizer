#!/bin/bash

# Example usage scripts for YouTube Transcript Extractor

echo "🎬 YouTube Transcript Extractor - Usage Examples"
echo "================================================"
echo ""

# Set a test video (Rick Astley - Never Gonna Give You Up)
TEST_VIDEO="https://www.youtube.com/watch?v=dQw4w9WgXcQ"

echo "📝 Example 1: Basic transcript extraction (JavaScript)"
echo "Command: node index.js \"$TEST_VIDEO\""
echo ""
read -p "Press Enter to run..."
node index.js "$TEST_VIDEO"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "⏰ Example 2: Timestamped transcript saved to file"
echo "Command: node index.js \"$TEST_VIDEO\" -f timestamped -o example_timestamped.txt"
echo ""
read -p "Press Enter to run..."
node index.js "$TEST_VIDEO" -f timestamped -o example_timestamped.txt
echo ""
echo "✓ Output saved to: example_timestamped.txt"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📺 Example 3: Generate SRT subtitles"
echo "Command: node index.js \"$TEST_VIDEO\" -f srt -o example_subtitles.srt"
echo ""
read -p "Press Enter to run..."
node index.js "$TEST_VIDEO" -f srt -o example_subtitles.srt
echo ""
echo "✓ Output saved to: example_subtitles.srt"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📊 Example 4: JSON format with metadata"
echo "Command: node index.js \"$TEST_VIDEO\" -f json -o example_data.json"
echo ""
read -p "Press Enter to run..."
node index.js "$TEST_VIDEO" -f json -o example_data.json
echo ""
echo "✓ Output saved to: example_data.json"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🎙️ Example 5: Whisper AI transcription (optional)"
echo "Command: python3 whisper_transcribe.py \"$TEST_VIDEO\" -m base"
echo ""

if [ -d "whisper-env" ]; then
    read -p "Run Whisper transcription? (This will take 1-2 minutes) [y/N]: " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        source whisper-env/bin/activate
        python3 whisper_transcribe.py "$TEST_VIDEO" -m base -o example_whisper.txt
        deactivate
        echo ""
        echo "✓ Output saved to: example_whisper.txt"
    else
        echo "⏭️  Skipped Whisper example"
    fi
else
    echo "⚠️  Whisper not installed. Run ./setup.sh to install."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Examples complete!"
echo ""
echo "Generated files:"
ls -lh example_* 2>/dev/null || echo "  (No files generated)"
echo ""
echo "💡 Tip: Check README.md for more advanced usage"
echo ""


