#!/bin/bash

# Quick fix for Whisper installation - REQUIRES Python 3.12 (LTS)
# Python 3.13+ is NOT compatible with Whisper dependencies

echo "🔧 Fixing Whisper Installation"
echo "================================"
echo ""

# Remove old virtual environment
if [ -d "whisper-env" ]; then
    echo "🗑️  Removing old virtual environment..."
    rm -rf whisper-env
fi

# REQUIRE Python 3.12 (LTS) for Whisper compatibility
# Python 3.13+ has compatibility issues with Whisper dependencies
echo "⚠️  Whisper requires Python 3.12 (LTS) for compatibility"
echo "   Python 3.13+ is not compatible with Whisper dependencies"
echo ""

PYTHON_CMD=""
PYTHON_FOUND=false

# Check for Python 3.12 in pyenv (preferred)
if command -v pyenv &> /dev/null && pyenv versions --bare | grep -q "^3\.12"; then
    PYTHON_VERSION=$(pyenv versions --bare | grep "^3\.12" | head -1)
    PYTHON_CMD="$HOME/.pyenv/versions/$PYTHON_VERSION/bin/python3"
    echo "✓ Found Python $PYTHON_VERSION in pyenv (required for Whisper)"
    PYTHON_FOUND=true
# Check for system Python 3.12
elif command -v python3.12 &> /dev/null; then
    echo "✓ Found system Python 3.12 (required for Whisper)"
    PYTHON_CMD="python3.12"
    PYTHON_FOUND=true
# Check if current Python is 3.12
elif command -v python3 &> /dev/null; then
    CURRENT_VERSION=$(python3 --version 2>/dev/null | cut -d' ' -f2)
    if [[ "$CURRENT_VERSION" =~ ^3\.12 ]]; then
        PYTHON_CMD="python3"
        echo "✓ Found Python 3.12 ($CURRENT_VERSION)"
        PYTHON_FOUND=true
    else
        echo "❌ Python 3.12 not found"
        echo "   Current Python: $CURRENT_VERSION (incompatible)"
    fi
fi

# If Python 3.12 not found, provide installation instructions
if [[ "$PYTHON_FOUND" == false ]]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Python 3.12 (LTS) is REQUIRED for Whisper"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Install Python 3.12:"
    echo ""
    if command -v pyenv &> /dev/null; then
        echo "Option 1: Using pyenv (recommended)"
        echo "  pyenv install 3.12.10"
        echo "  pyenv local 3.12.10"
        echo "  ./fix_whisper_install.sh"
        echo ""
    fi
    echo "Option 2: Using Homebrew"
    echo "  brew install python@3.12"
    echo "  ./fix_whisper_install.sh"
    echo ""
    exit 1
fi

# Create new virtual environment
echo "🐍 Creating virtual environment with $PYTHON_CMD..."
$PYTHON_CMD -m venv whisper-env

# Activate and install
source whisper-env/bin/activate

echo "📦 Installing packages..."
pip install --upgrade pip

# Install NumPy 1.x first (required for Whisper compatibility)
echo "   Installing NumPy 1.x (required for Whisper)..."
pip install "numpy<2"

# Try openai-whisper first
echo "   Trying openai-whisper..."
if pip install -U openai-whisper yt-dlp 2>/dev/null; then
    echo "✅ Successfully installed openai-whisper"
else
    echo "   openai-whisper failed, trying faster-whisper..."
    if pip install -U faster-whisper yt-dlp; then
        echo "✅ Successfully installed faster-whisper (faster alternative)"
    else
        echo "❌ Both installations failed. Please check error messages above."
        exit 1
    fi
fi

# Ensure NumPy stays at 1.x (prevent upgrade to 2.x)
echo "   Pinning NumPy to < 2.0 for compatibility..."
pip install "numpy<2" --force-reinstall --no-deps 2>/dev/null || true

deactivate

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Whisper installation fixed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To use Whisper, run:"
echo "  source whisper-env/bin/activate"
echo "  python3 whisper_transcribe.py \"VIDEO_URL\""
echo ""

