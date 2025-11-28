#!/bin/bash

# YouTube Transcript Extractor - Setup Script
# This script installs all dependencies for both JavaScript and Python methods

set -e  # Exit on error

echo "🚀 YouTube Transcript Extractor - Setup Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}⚠️  Homebrew not found. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✓ Homebrew already installed${NC}"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Installing Node.js...${NC}"
    brew install node
else
    echo -e "${GREEN}✓ Node.js already installed ($(node --version))${NC}"
fi

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install
echo -e "${GREEN}✓ Node.js dependencies installed${NC}"

# Ask if user wants to install Python + Whisper
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎙️  Optional: Install Python + Whisper for AI transcription?"
echo "   (Required only for videos WITHOUT captions)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Install Whisper? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # REQUIRE Python 3.12 (LTS) for Whisper compatibility
    # Python 3.13+ has compatibility issues with Whisper dependencies
    PYTHON_CMD=""
    PYTHON_FOUND=false
    
    echo -e "${YELLOW}⚠️  Whisper requires Python 3.12 (LTS) for compatibility${NC}"
    echo -e "${YELLOW}   Python 3.13+ is not compatible with Whisper dependencies${NC}"
    echo ""
    
    # Check for pyenv first
    if command -v pyenv &> /dev/null; then
        # Check if Python 3.12 is available in pyenv
        if pyenv versions --bare | grep -q "^3\.12"; then
            PYTHON_VERSION=$(pyenv versions --bare | grep "^3\.12" | head -1)
            PYTHON_CMD="$HOME/.pyenv/versions/$PYTHON_VERSION/bin/python3"
            echo -e "${GREEN}✓ Found Python $PYTHON_VERSION in pyenv (required for Whisper)${NC}"
            PYTHON_FOUND=true
        else
            CURRENT_PYTHON=$(python3 --version 2>/dev/null | cut -d' ' -f2)
            if [[ "$CURRENT_PYTHON" =~ ^3\.12 ]]; then
                PYTHON_CMD="python3"
                echo -e "${GREEN}✓ Using pyenv Python: $CURRENT_PYTHON (compatible)${NC}"
                PYTHON_FOUND=true
            else
                echo -e "${RED}❌ Python 3.12 not found in pyenv${NC}"
                echo -e "${YELLOW}   Current Python: $CURRENT_PYTHON (incompatible)${NC}"
            fi
        fi
    fi
    
    # Fallback to system Python 3.12
    if [[ "$PYTHON_FOUND" == false ]]; then
        if command -v python3.12 &> /dev/null; then
            PYTHON_CMD="python3.12"
            echo -e "${GREEN}✓ Python 3.12 found ($(python3.12 --version))${NC}"
            PYTHON_FOUND=true
        elif command -v python3 &> /dev/null; then
            CURRENT_VERSION=$(python3 --version 2>/dev/null | cut -d' ' -f2)
            if [[ "$CURRENT_VERSION" =~ ^3\.12 ]]; then
                PYTHON_CMD="python3"
                echo -e "${GREEN}✓ Python 3.12 found ($(python3 --version))${NC}"
                PYTHON_FOUND=true
            else
                echo -e "${RED}❌ Python 3.12 not found${NC}"
                echo -e "${YELLOW}   Current Python: $CURRENT_VERSION (incompatible)${NC}"
            fi
        fi
    fi
    
    # If Python 3.12 not found, provide installation instructions
    if [[ "$PYTHON_FOUND" == false ]]; then
        echo ""
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}❌ Python 3.12 (LTS) is REQUIRED for Whisper${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${YELLOW}Install Python 3.12:${NC}"
        echo ""
        if command -v pyenv &> /dev/null; then
            echo -e "${GREEN}Option 1: Using pyenv (recommended)${NC}"
            echo "  pyenv install 3.12.10"
            echo "  pyenv local 3.12.10"
            echo "  ./setup.sh"
            echo ""
        fi
        echo -e "${GREEN}Option 2: Using Homebrew${NC}"
        echo "  brew install python@3.12"
        echo "  ./setup.sh"
        echo ""
        echo -e "${YELLOW}Then run this setup script again.${NC}"
        exit 1
    fi

    # Check if FFmpeg is installed
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${YELLOW}⚠️  FFmpeg not found. Installing FFmpeg...${NC}"
        brew install ffmpeg
    else
        echo -e "${GREEN}✓ FFmpeg already installed${NC}"
    fi

    # Remove old virtual environment if it exists
    if [ -d "whisper-env" ]; then
        echo ""
        echo "🗑️  Removing old virtual environment..."
        rm -rf whisper-env
    fi
    
    # Create virtual environment
    echo ""
    echo "🐍 Setting up Python virtual environment..."
    if ! $PYTHON_CMD -m venv whisper-env; then
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        echo -e "${YELLOW}   Try installing Python 3.12: pyenv install 3.12.10${NC}"
        exit 1
    fi
    
    # Verify venv was created correctly
    if [ ! -f "whisper-env/bin/activate" ]; then
        echo -e "${RED}❌ Virtual environment creation failed${NC}"
        exit 1
    fi
    
    source whisper-env/bin/activate

    # Install Python packages
    echo ""
    echo "📦 Installing Python packages (Whisper, yt-dlp)..."
    echo "   This may take a few minutes..."
    pip install --upgrade pip --quiet
    
    # Install NumPy 1.x first (required for Whisper compatibility)
    echo -e "${YELLOW}   Installing NumPy 1.x (required for Whisper compatibility)...${NC}"
    pip install "numpy<2" --quiet
    
    # Try installing openai-whisper, fallback to faster-whisper if it fails
    if ! pip install -U openai-whisper yt-dlp --quiet 2>/dev/null; then
        echo -e "${YELLOW}   Standard Whisper failed, trying faster-whisper (alternative)...${NC}"
        pip install -U faster-whisper yt-dlp --quiet
        echo -e "${GREEN}   Note: Using faster-whisper (compatible alternative)${NC}"
    fi
    
    # Ensure NumPy stays at 1.x
    pip install "numpy<2" --force-reinstall --no-deps --quiet 2>/dev/null || true

    echo -e "${GREEN}✓ Python + Whisper installed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Note: To use Whisper, first activate the virtual environment:${NC}"
    echo "      source whisper-env/bin/activate"
    
    deactivate
else
    echo -e "${YELLOW}⏭️  Skipping Whisper installation${NC}"
    echo "   (You can install it later by running this script again)"
fi

# Make scripts executable
chmod +x index.js
chmod +x whisper_transcribe.py

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Quick Start:"
echo ""
echo "1. Extract YouTube captions (instant):"
echo "   npm start \"https://www.youtube.com/watch?v=VIDEO_ID\""
echo ""
echo "2. AI transcription (for videos without captions):"
echo "   source whisper-env/bin/activate"
echo "   python3 whisper_transcribe.py \"VIDEO_URL\""
echo ""
echo "3. See all options:"
echo "   node index.js --help"
echo "   python3 whisper_transcribe.py --help"
echo ""
echo "📖 Read README.md for full documentation"
echo ""

