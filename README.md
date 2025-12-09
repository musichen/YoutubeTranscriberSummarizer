# 🎬 YouTube Transcript Extractor & AI Transcriber

**Free, fast, and cost-effective YouTube video transcription for macOS**

Two complementary approaches:
1. **📝 Multi-Method Transcript Extraction** (Node.js) - Tries 3 different methods to extract captions (works for ~30-60% of videos due to YouTube restrictions)
2. **🎙️ AI Audio Transcription** (Python + Whisper) - Transcribe ANY video using local AI (100% reliable, recommended)

---

## 🚀 Quick Start

### Method 1: Extract Existing Captions (Try First, May Fail)

**✨ Advantages:** Instant when it works, zero setup beyond Node.js  
**⚠️ Limitations:** YouTube has restricted transcript API (2024-2025), success rate ~30-60%  
**💡 Fallback:** If this fails, use Whisper (Method 2) - it works for 100% of videos

```bash
# Install dependencies (one-time)
npm install

# Extract transcript
npm start "https://www.youtube.com/watch?v=VIDEO_ID"

# Or use directly
node index.js "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Method 2: AI Transcription with Whisper (For Videos Without Captions)

**✨ Advantages:** Works for ANY video, multilingual, highly accurate, fully local/private

```bash
# One-time setup (see Installation section below)
python3 whisper_transcribe.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Method 3: YTTOOL - Unified YouTube Tool (New!)

**✨ All-in-one tool for converting videos to MP3, downloading playlists, and transcribing**

YTTOOL provides a unified CLI interface for common YouTube operations:

```bash
# Python version
python3 yttool.py convert "YOUTUBE_URL"

# Node.js version
node yttool.js convert "YOUTUBE_URL"
```

**Features:**
- 🎵 **MP3 Conversion** - Download audio and convert to MP3 with metadata
- 📚 **Playlist Download** - Download entire playlists as MP3 (auto-detects or manual count)
- 📝 **Text Transcription** - Calls existing Whisper/transcript tools

The tool will prompt you to choose the format (mp3, mp3-playlist, or txt) if not specified.

**Examples:**
```bash
# Convert single video to MP3
python3 yttool.py convert "https://www.youtube.com/watch?v=VIDEO_ID" --format mp3

# Download entire playlist as MP3
python3 yttool.py convert "PLAYLIST_URL" --format mp3-playlist

# Generate transcript
python3 yttool.py convert "VIDEO_URL" --format txt
```

---

## 📦 Installation

### Prerequisites (One-Time Setup)

#### For JavaScript Transcript Extractor:
```bash
# Requires Node.js (check with: node --version)
# Install from: https://nodejs.org (or use: brew install node)

# Install dependencies
cd /path/to/youtube-transcript-extractor
npm install
```

#### For Python + Whisper (Optional - Only if videos lack captions):

**⚠️ IMPORTANT: Python 3.12 (LTS) is REQUIRED**

Whisper requires Python 3.12 (LTS). Python 3.13+ is **NOT compatible** due to dependency issues (Cython compilation errors).

**During setup, you'll be asked to choose:**
- **openai-whisper** (default) - Official OpenAI implementation
- **faster-whisper** - Faster alternative, optimized for speed

The default (openai-whisper) is recommended for most users. You can change this later by reinstalling.

**Option A: Using pyenv (Recommended if you use pyenv):**
```bash
# 1. Install Python 3.12.10 via pyenv (REQUIRED)
pyenv install 3.12.10

# 2. Set it for this project
cd /path/to/youtube-transcript-extractor
pyenv local 3.12.10

# 3. Verify Python version
python3 --version  # Should show 3.12.10

# 4. Install FFmpeg (if not already installed)
brew install ffmpeg

# 5. Run automated setup
./setup.sh
# OR use the fix script
./fix_whisper_install.sh
```

**Option B: Using Homebrew Python:**
```bash
# 1. Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install FFmpeg and Python 3.12 (REQUIRED)
brew install ffmpeg python@3.12

# 3. Create Python virtual environment with Python 3.12
python3.12 -m venv whisper-env
source whisper-env/bin/activate

# 4. Install Python packages
pip install --upgrade pip
pip install -U openai-whisper yt-dlp
```

**⚠️ Critical Notes:** 
- **Python 3.12 (LTS) is REQUIRED** - Setup will fail if Python 3.12 is not found
- **Python 3.13+ is NOT compatible** - Will cause installation errors
- **Python 3.14+ is NOT compatible** - Will cause Cython compilation errors
- On Apple Silicon (M1/M2/M3), Whisper automatically uses optimized acceleration
- See `PYENV_SETUP.md` for detailed pyenv setup instructions

---

## 💡 Complete Command Reference

### 📝 JavaScript Transcript Extractor - All Commands

#### Basic Syntax
```bash
node index.js <url> [options]
```

#### Required Argument
- `<url>` - YouTube video URL or video ID
  - Full URL: `"https://www.youtube.com/watch?v=VIDEO_ID"`
  - Short URL: `"https://youtu.be/VIDEO_ID"`
  - Video ID only: `VIDEO_ID`

---

#### 1. Basic Usage Examples

**Print transcript to console (default behavior):**
```bash
node index.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```
*Explanation: Extracts captions and displays them in the terminal. No file is saved unless you specify `-o`.*

**Using video ID only (no full URL needed):**
```bash
node index.js dQw4w9WgXcQ
```
*Explanation: Works the same way - extracts video ID from the string.*

**Using short YouTube URL:**
```bash
node index.js "https://youtu.be/dQw4w9WgXcQ"
```
*Explanation: Automatically detects and extracts video ID from short URLs.*

---

#### 2. Output Format Options (`-f` or `--format`)

**Plain text format (default):**
```bash
node index.js "VIDEO_URL" -f text
```
*Explanation: Outputs clean text without timestamps. Best for reading or text analysis.*

**Timestamped format:**
```bash
node index.js "VIDEO_URL" -f timestamped
```
*Explanation: Adds `[MM:SS]` timestamps before each caption segment. Useful for finding specific moments.*

**SRT subtitle format:**
```bash
node index.js "VIDEO_URL" -f srt
```
*Explanation: Generates standard `.srt` subtitle file compatible with video players (VLC, Premiere, etc.).*

**JSON format:**
```bash
node index.js "VIDEO_URL" -f json
```
*Explanation: Outputs structured JSON with full metadata including offsets, durations, and text. Best for programmatic use.*

---

#### 3. Saving to File (`-o` or `--output`)

**Save to specific file:**
```bash
node index.js "VIDEO_URL" -o transcript.txt
```
*Explanation: Saves transcript to `transcript.txt` in current directory. Still prints to console by default.*

**Save with custom path:**
```bash
node index.js "VIDEO_URL" -o ~/Documents/my_transcript.txt
```
*Explanation: Saves to absolute path. Creates directory if needed.*

**Auto-generate filename (no console output):**
```bash
node index.js "VIDEO_URL" --no-print
```
*Explanation: Saves to auto-generated file like `transcript_1732654321000.txt` (timestamp-based). No console output.*

**Save only (no console output) with custom name:**
```bash
node index.js "VIDEO_URL" -o output.txt --no-print
```
*Explanation: Saves to file without printing to console. Useful for batch processing.*

---

#### 4. Language Selection (`-l` or `--lang`)

**Extract English captions:**
```bash
node index.js "VIDEO_URL" -l en
```
*Explanation: Explicitly requests English captions. Useful if video has multiple language options.*

**Extract Spanish captions:**
```bash
node index.js "VIDEO_URL" -l es
```
*Explanation: Gets Spanish subtitles if available. Works with any language code YouTube supports.*

**Extract French captions:**
```bash
node index.js "VIDEO_URL" -l fr
```
*Explanation: Retrieves French subtitles. Auto-detects if language not specified.*

**Extract Chinese captions:**
```bash
node index.js "VIDEO_URL" -l zh
```
*Explanation: Gets Chinese (Simplified) captions. Use `zh-TW` for Traditional Chinese.*

**Extract Japanese captions:**
```bash
node index.js "VIDEO_URL" -l ja
```
*Explanation: Retrieves Japanese subtitles. Language code follows ISO 639-1 standard.*

---

#### 5. Console Output Control (`-p` or `--print`)

**Print to console (default):**
```bash
node index.js "VIDEO_URL" -p
```
*Explanation: Explicitly enables console output. This is the default behavior.*

**Disable console output:**
```bash
node index.js "VIDEO_URL" --no-print
```
*Explanation: Suppresses terminal output. Only saves to file (if `-o` is specified) or auto-generates filename.*

---

#### 6. Combined Flag Examples

**Save timestamped transcript to file:**
```bash
node index.js "VIDEO_URL" -f timestamped -o output.txt
```
*Explanation: Combines format and output options. Creates file with timestamps.*

**Generate SRT subtitles in Spanish:**
```bash
node index.js "VIDEO_URL" -f srt -l es -o subtitles_es.srt
```
*Explanation: Creates Spanish SRT file. Perfect for multilingual subtitle projects.*

**Save JSON without console output:**
```bash
node index.js "VIDEO_URL" -f json -o data.json --no-print
```
*Explanation: Saves structured JSON data silently. Ideal for automation scripts.*

**Extract with all options:**
```bash
node index.js "VIDEO_URL" -f timestamped -l en -o transcript.txt -p
```
*Explanation: Uses all major flags together. Explicitly sets format, language, output, and console display.*

---

#### 7. Utility Commands

**Show help:**
```bash
node index.js --help
# or
node index.js -h
```
*Explanation: Displays all available options and usage examples.*

**Show version:**
```bash
node index.js --version
# or
node index.js -v
```
*Explanation: Displays current version number.*

**Using npm script:**
```bash
npm start "VIDEO_URL"
```
*Explanation: Alternative way to run the script. Defined in `package.json`.*

---

### 🎙️ Python Whisper Transcriber - All Commands

#### Basic Syntax
```bash
python3 whisper_transcribe.py <url> [options]
```

**Important:** Always activate virtual environment first:
```bash
source whisper-env/bin/activate
```

#### Required Argument
- `<url>` - YouTube video URL or video ID
  - Full URL: `"https://www.youtube.com/watch?v=VIDEO_ID"`
  - Short URL: `"https://youtu.be/VIDEO_ID"`
  - Video ID only: `VIDEO_ID`

---

#### 1. Basic Usage Examples

**Basic transcription (default settings):**
```bash
source whisper-env/bin/activate
python3 whisper_transcribe.py "https://www.youtube.com/watch?v=VIDEO_ID"
```
*Explanation: Uses `base` model, `timestamped` format, auto-detects language. Saves to auto-generated file like `transcript_1732654321.txt`.*

**Using video ID only:**
```bash
python3 whisper_transcribe.py dQw4w9WgXcQ
```
*Explanation: Works with just the video ID. Automatically downloads audio and transcribes.*

**Using short URL:**
```bash
python3 whisper_transcribe.py "https://youtu.be/dQw4w9WgXcQ"
```
*Explanation: Handles short YouTube URLs automatically.*

---

#### 2. Model Selection (`-m` or `--model`)

**Tiny model (fastest, least accurate):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m tiny
```
*Explanation: ~39M parameters, ~1GB RAM. Fastest option, good for quick previews. Accuracy: ~70-80%.*

**Base model (default - recommended):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m base
```
*Explanation: ~74M parameters, ~1GB RAM. Best balance of speed and accuracy. Accuracy: ~85-90%. Default choice.*

**Small model (balanced):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m small
```
*Explanation: ~244M parameters, ~2GB RAM. Better accuracy than base. Accuracy: ~90-93%.*

**Medium model (high accuracy):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m medium
```
*Explanation: ~769M parameters, ~5GB RAM. High accuracy, slower. Accuracy: ~93-96%. Best for important content.*

**Large model (best accuracy):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m large
```
*Explanation: ~1550M parameters, ~10GB RAM. Highest accuracy, slowest. Accuracy: ~96-98%. Use for final production.*

---

#### 3. Output Format Options (`-f` or `--format`)

**Timestamped format (default):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -f timestamped
```
*Explanation: Outputs text with `[HH:MM:SS - HH:MM:SS]` timestamps. Includes header. Best for reading with time references.*

**Plain text format:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -f text
```
*Explanation: Clean text only, no timestamps. Best for text analysis, summarization, or reading.*

**SRT subtitle format:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -f srt
```
*Explanation: Generates standard `.srt` subtitle file. Compatible with all video players and editing software.*

**JSON format:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -f json
```
*Explanation: Full JSON with segments, timestamps, confidence scores, and metadata. Best for programmatic processing.*

---

#### 4. Saving to File (`-o` or `--output`)

**Save to specific file:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -o transcript.txt
```
*Explanation: Saves to `transcript.txt`. Format determined by `-f` flag or defaults to `timestamped`.*

**Save with custom path:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -o ~/Documents/my_transcript.txt
```
*Explanation: Saves to absolute path. Creates directories if needed.*

**Auto-generate filename (default):**
```bash
python3 whisper_transcribe.py "VIDEO_URL"
```
*Explanation: Creates file like `transcript_1732654321.txt` with timestamp. Format extension matches chosen format.*

---

#### 5. Language Selection (`-l` or `--language`)

**Specify English (faster than auto-detect):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -l en
```
*Explanation: Forces English detection. Faster processing since model doesn't need to detect language first.*

**Specify Spanish:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -l es
```
*Explanation: Transcribes in Spanish. Use when you know the language for better accuracy and speed.*

**Specify French:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -l fr
```
*Explanation: French transcription. Supports 90+ languages - use ISO 639-1 language codes.*

**Specify Chinese:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -l zh
```
*Explanation: Chinese (Simplified) transcription. Use `zh-TW` for Traditional Chinese.*

**Specify Japanese:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -l ja
```
*Explanation: Japanese transcription. Auto-detection works but specifying is faster and more accurate.*

**Auto-detect language (default):**
```bash
python3 whisper_transcribe.py "VIDEO_URL"
```
*Explanation: Model automatically detects language. Slightly slower but convenient for multilingual content.*

---

#### 6. Advanced Options

**Keep downloaded audio file (debugging):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" --no-cleanup
```
*Explanation: Preserves the downloaded `.wav` audio file in temp directory. Useful for debugging or re-processing audio.*

**Show help:**
```bash
python3 whisper_transcribe.py --help
# or
python3 whisper_transcribe.py -h
```
*Explanation: Displays all available options, model descriptions, and examples.*

---

#### 7. Combined Flag Examples

**High accuracy with SRT output:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m medium -f srt -o subtitles.srt
```
*Explanation: Uses medium model for accuracy, generates SRT format, saves to specific file. Perfect for video editing.*

**Fast transcription in Spanish:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m tiny -l es -f text -o espanol.txt
```
*Explanation: Quick Spanish transcription using tiny model, plain text output. Good for quick translations.*

**Production-quality JSON:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m large -f json -o full_data.json
```
*Explanation: Maximum accuracy with full metadata in JSON. Best for data analysis or archival.*

**Balanced quality with timestamps:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m small -f timestamped -o output.txt
```
*Explanation: Good balance of speed and accuracy with readable timestamped format.*

**Complete example with all options:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m medium -f srt -l en -o subtitles.srt --no-cleanup
```
*Explanation: Uses all major options together. Medium accuracy, SRT format, English, custom filename, keeps audio file.*

---

### 🎛️ Whisper Model Manager - Managing Models

The `whisper_manager.py` tool helps you manage Whisper models: list installed models, download new ones, delete unused models, and get detailed information about each model.

**Important:** Always activate virtual environment first:
```bash
source whisper-env/bin/activate
```

#### Basic Syntax
```bash
python3 whisper_manager.py <command> [options]
```

---

#### 1. List Installed Models

**Show all installed models:**
```bash
python3 whisper_manager.py list
```
*Explanation: Displays all Whisper models currently installed on your system, with their sizes. Shows which model is currently active (set via `use` command). Shows total disk usage.*

**Example output:**
```
🔍 Detected Whisper: openai-whisper

======================================================================
INSTALLED MODELS
======================================================================

✓ tiny     -    72.1 MB ← active
✓ base     -   138.5 MB

Total: 210.6 MB

✓ Active model: tiny

💡 To download more models:
   python3 whisper_manager.py download <model_name>
💡 To delete a model:
   python3 whisper_manager.py delete <model_name>
```

**Note:** The `← active` marker shows which model is currently set as the default. This model will be used automatically by `whisper_transcribe.py` if you don't specify `-m`.

---

#### 2. List Remote Models

**Show all available models (not just installed):**
```bash
python3 whisper_manager.py list-remote
```
*Explanation: Displays all available Whisper models that can be downloaded, with detailed information about each (size, RAM, speed, accuracy). Useful for deciding which model to download.*

**Example output:**
```
======================================================================
AVAILABLE WHISPER MODELS
======================================================================

📦 TINY
   Description: Fastest option, good for quick previews
   Parameters: 39M parameters
   RAM Usage: ~1GB
   Disk Space: ~75MB
   Speed: Fastest
   Accuracy: 70-80%

📦 BASE
   Description: Best balance of speed and accuracy (recommended)
   ...
```

---

#### 3. Set Active Model (Version Management)

**Set a model as active (like nvm/pyenv):**
```bash
python3 whisper_manager.py use base
```
*Explanation: Sets `base` as the active model. This model will be used automatically by `whisper_transcribe.py` when you don't specify `-m` flag. Similar to how `nvm use` or `pyenv local` works.*

**Switch to a different active model:**
```bash
python3 whisper_manager.py use tiny
```
*Explanation: Switches active model to `tiny`. The active model is stored in `.whisper-version` file (project-level) or `~/.whisper-version` (global).*

**How it works:**
- When you run `whisper_transcribe.py` without `-m`, it automatically uses the active model
- If no active model is set, defaults to `base`
- The active model is shown in `list` command with `← active` marker
- You can set an active model even if it's not installed yet (useful for planning)

**Example workflow:**
```bash
# Set base as active
python3 whisper_manager.py use base

# Transcribe without specifying model (uses base)
python3 whisper_transcribe.py "VIDEO_URL"

# Switch to tiny for faster processing
python3 whisper_manager.py use tiny

# Now uses tiny automatically
python3 whisper_transcribe.py "VIDEO_URL"
```

---

#### 4. Download Models

**Download base model (recommended):**
```bash
python3 whisper_manager.py download base
```
*Explanation: Downloads the `base` model (~150MB). First-time download may take a few minutes. Model is cached for future use.*

**Download tiny model (fastest):**
```bash
python3 whisper_manager.py download tiny
```
*Explanation: Downloads the smallest model (~75MB). Fastest transcription, lower accuracy. Good for quick previews.*

**Download large model (best accuracy):**
```bash
python3 whisper_manager.py download large
```
*Explanation: Downloads the largest model (~3GB). Highest accuracy, slowest speed. Best for production-quality transcriptions.*

**Available models:**
- `tiny` - Fastest, least accurate (~75MB)
- `base` - Best balance, recommended (~150MB)
- `small` - Better accuracy (~500MB)
- `medium` - High accuracy (~1.5GB)
- `large` - Best accuracy (~3GB)

---

#### 5. Delete Models

**Delete a model to free up space:**
```bash
python3 whisper_manager.py delete tiny
```
*Explanation: Removes the `tiny` model from disk. Prompts for confirmation unless `-y` flag is used.*

**Delete with auto-confirm:**
```bash
python3 whisper_manager.py delete tiny -y
```
*Explanation: Deletes without confirmation prompt. Useful for scripts.*

**Example output:**
```
⚠️  This will delete the 'tiny' model
   Continue? (y/n): y
✓ Deleted model 'tiny' (74.8 MB freed)
```

---

#### 6. Model Information

**Show info for all models:**
```bash
python3 whisper_manager.py info
```
*Explanation: Displays detailed information about all available Whisper models: size, RAM usage, speed, accuracy, and descriptions.*

**Show info for specific model:**
```bash
python3 whisper_manager.py info large
```
*Explanation: Shows detailed information for the `large` model only.*

**Example output:**
```
======================================================================
WHISPER MODEL INFORMATION
======================================================================

📦 TINY
   Description: Fastest option, good for quick previews
   Parameters: 39M parameters
   RAM Usage: ~1GB
   Disk Space: ~75MB
   Speed: Fastest
   Accuracy: 70-80%

📦 BASE
   Description: Best balance of speed and accuracy (recommended)
   Parameters: 74M parameters
   RAM Usage: ~1GB
   Disk Space: ~150MB
   Speed: Fast
   Accuracy: 85-90%

...
```

---

#### 7. Common Workflows

**Check what models you have and set active:**
```bash
python3 whisper_manager.py list
python3 whisper_manager.py use base
python3 whisper_transcribe.py "VIDEO_URL"  # Uses active model automatically
```

**Download multiple models for testing:**
```bash
python3 whisper_manager.py download tiny
python3 whisper_manager.py download base
python3 whisper_manager.py download medium
```

**Free up disk space by removing unused models:**
```bash
python3 whisper_manager.py list
python3 whisper_manager.py delete tiny -y
python3 whisper_manager.py delete small -y
```

**Test different models for quality comparison:**
```bash
# Set and test tiny (fast)
python3 whisper_manager.py use tiny
python3 whisper_transcribe.py "VIDEO_URL" -o test_tiny.txt

# Switch to base (balanced)
python3 whisper_manager.py use base
python3 whisper_transcribe.py "VIDEO_URL" -o test_base.txt

# Test large (best quality) - override active model
python3 whisper_transcribe.py "VIDEO_URL" -m large -o test_large.txt
```

---

#### 8. Model Comparison Guide

| Model | Size | RAM | Speed | Accuracy | Use Case |
|-------|------|-----|-------|----------|----------|
| `tiny` | 75MB | 1GB | Fastest | 70-80% | Quick previews, testing |
| `base` | 150MB | 1GB | Fast | 85-90% | **Recommended default** |
| `small` | 500MB | 2GB | Medium | 90-93% | Better accuracy needed |
| `medium` | 1.5GB | 5GB | Slow | 93-96% | Important content |
| `large` | 3GB | 10GB | Slowest | 96-98% | Production quality |

**Recommendation:** Start with `base` model. Download `large` only if you need maximum accuracy and have sufficient RAM/disk space.

---

#### 9. Troubleshooting

**"Whisper not installed" error:**
```bash
# Install Whisper first
./setup.sh
# Or manually
source whisper-env/bin/activate
pip install openai-whisper
```

**Model download fails:**
- Check internet connection
- Ensure sufficient disk space (models range from 75MB to 3GB)
- Try downloading a smaller model first

**Can't find installed models:**
- Models are cached in `~/.cache/whisper` (openai-whisper) or `~/.cache/huggingface` (faster-whisper)
- The `list` command should detect them automatically
- If not detected, try downloading the model again

---

#### 10. Where Are Whisper Models Stored?

**📁 Model Storage Locations (macOS - Tested)**

Whisper models are automatically downloaded and cached on your system. The location depends on which Whisper implementation you're using:

**For `openai-whisper` (default):**
- **Cache Directory:** `~/.cache/whisper/`
- **Full Path (macOS):** `/Users/YOUR_USERNAME/.cache/whisper/`
- **File Format:** Each model is stored as a single `.pt` (PyTorch) file
- **File Names:**
  - `tiny.pt` (~75MB)
  - `base.pt` (~150MB)
  - `small.pt` (~500MB)
  - `medium.pt` (~1.5GB)
  - `large.pt` (~3GB)

**Example files on macOS:**
```
/Users/YOUR_USERNAME/.cache/whisper/tiny.pt
/Users/YOUR_USERNAME/.cache/whisper/base.pt
/Users/YOUR_USERNAME/.cache/whisper/small.pt
/Users/YOUR_USERNAME/.cache/whisper/medium.pt
/Users/YOUR_USERNAME/.cache/whisper/large.pt
```

**For `faster-whisper`:**
- **Cache Directory:** `~/.cache/huggingface/hub/`
- **Full Path (macOS):** `/Users/YOUR_USERNAME/.cache/huggingface/hub/`
- **File Format:** Models are stored in subdirectories with multiple files
- **Directory Pattern:** `models--guillaumekln--faster-whisper-{model_name}--{hash}/`

**Example structure:**
```
/Users/YOUR_USERNAME/.cache/huggingface/hub/
  └── models--guillaumekln--faster-whisper-base--{hash}/
      ├── config.json
      ├── model.bin
      └── ... (other model files)
```

**⚠️ Note:** These paths are tested on macOS. On Linux and Windows, the `~/.cache/` directory should work similarly, but the exact paths may vary. The `~` symbol refers to your home directory.

**To check your models:**
```bash
# List all installed models (recommended)
python3 whisper_manager.py list

# Or manually check the directory
ls -lh ~/.cache/whisper/*.pt
```

**To free up disk space:**
```bash
# Delete specific models
python3 whisper_manager.py delete tiny -y
python3 whisper_manager.py delete small -y

# Or manually delete files
rm ~/.cache/whisper/medium.pt
```

**Active model not working:**
- Check which model is active: `python3 whisper_manager.py list`
- Verify the model is installed (should show `← active` marker)
- If active model is not installed, either install it or set a different active model
- Config file is stored in `.whisper-version` (project) or `~/.whisper-version` (global)

---

#### 8. Real-World Use Cases

**Quick preview (fastest):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m tiny -f text
```
*Explanation: Get a quick transcript in seconds. Use to check if video is worth full transcription.*

**Video editing workflow:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m base -f srt -o edit_subtitles.srt
```
*Explanation: Generate subtitles for video editing software. Base model is fast enough for most projects.*

**Academic/research transcription:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m large -f timestamped -o research_transcript.txt
```
*Explanation: Maximum accuracy for important content. Timestamped format helps with citations.*

**Batch processing (silent):**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m base -f text -o "transcript_$(date +%s).txt"
```
*Explanation: Silent processing with timestamped filenames. Perfect for automation scripts.*

**Multilingual content:**
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m medium -l auto -f json
```
*Explanation: Auto-detect language, medium accuracy, JSON for programmatic processing.*

---

#### 9. Deactivating Virtual Environment

**After using Whisper:**
```bash
deactivate
```
*Explanation: Exits the Python virtual environment. Always run this when done to return to system Python.*

---

### 📊 Format Comparison

| Format | Use Case | Example Output |
|--------|----------|----------------|
| `text` | Reading, analysis | "Never gonna give you up Never gonna let you down" |
| `timestamped` | Finding moments | `[0:00 - 0:03] Never gonna give you up` |
| `srt` | Video editing | `1\n00:00:00,000 --> 00:00:03,000\nNever gonna...` |
| `json` | Programming | `{"segments": [{"start": 0, "text": "Never..."}]}` |

---

### 🎯 Quick Reference Table

#### JavaScript Commands
| Command | What It Does |
|---------|--------------|
| `node index.js "URL"` | Print transcript to console |
| `node index.js "URL" -o file.txt` | Save to file |
| `node index.js "URL" -f srt -o subs.srt` | Generate SRT subtitles |
| `node index.js "URL" -l es` | Extract Spanish captions |
| `node index.js "URL" -f json` | Get JSON data |
| `node index.js "URL" --no-print` | Save only (no console) |

#### Python Whisper Commands
| Command | What It Does |
|---------|--------------|
| `python3 whisper_transcribe.py "URL"` | Basic transcription (base model) |
| `python3 whisper_transcribe.py "URL" -m medium` | Higher accuracy |
| `python3 whisper_transcribe.py "URL" -f srt` | Generate SRT subtitles |
| `python3 whisper_transcribe.py "URL" -l en` | Force English (faster) |
| `python3 whisper_transcribe.py "URL" -m large -f json` | Best accuracy + JSON |
| `python3 whisper_transcribe.py "URL" --no-cleanup` | Keep audio file |

---

## 🎯 Which Method Should I Use?

### Use **JavaScript Extractor** (Node.js) when:
- ✅ Video has existing captions/subtitles
- ✅ You need instant results (seconds)
- ✅ You want minimal setup
- ✅ Extracting from multiple videos quickly

### Use **Python + Whisper** when:
- ✅ Video has NO captions
- ✅ Video captions are auto-generated and low quality
- ✅ You need high-accuracy transcription
- ✅ You're transcribing non-English content
- ✅ You want complete privacy (all processing local)

**Pro Tip:** Try JavaScript extractor first. If it fails with "no captions available", use Whisper.

---

## 🌍 Supported Languages

### JavaScript Extractor:
Works with any language that has YouTube captions (100+ languages)

### Whisper AI:
Supports 90+ languages including:
- English (en), Spanish (es), French (fr), German (de), Italian (it)
- Portuguese (pt), Dutch (nl), Russian (ru), Arabic (ar)
- Chinese (zh), Japanese (ja), Korean (ko), Hindi (hi)
- And many more...

---

## 📊 Comparison: Online Services vs This Solution

| Feature | This Solution | NotGPT / Online Tools |
|---------|--------------|----------------------|
| **Cost** | 100% Free | Free tier limited, then $10-30/mo |
| **Privacy** | Fully local (Whisper) | Data sent to servers |
| **Speed** | Instant (captions) / 2-10 min (Whisper) | 1-5 minutes |
| **Accuracy** | 95-98% (Whisper) | Varies |
| **Video Length** | Unlimited | Often limited (e.g., 60 min) |
| **Batch Processing** | Unlimited | Quota limits |
| **Internet Required** | Only for download | Always |
| **Captions Required** | No (Whisper fallback) | Often yes |

---

## 🛠️ Common Workflows & Use Cases

### Workflow 1: Quick Transcript Extraction

**Scenario:** You need a transcript quickly for a video with captions.

```bash
# Try JavaScript first (instant)
node index.js "VIDEO_URL" -o transcript.txt

# If no captions, use Whisper
source whisper-env/bin/activate
python3 whisper_transcribe.py "VIDEO_URL" -m base -o transcript.txt
deactivate
```

---

### Workflow 2: Generate Subtitles for Video Editing

**Scenario:** Creating subtitles for a video project.

```bash
# If video has captions (fastest)
node index.js "VIDEO_URL" -f srt -o subtitles.srt

# If no captions (high quality)
source whisper-env/bin/activate
python3 whisper_transcribe.py "VIDEO_URL" -m medium -f srt -o subtitles.srt
deactivate
```

---

### Workflow 3: Research/Academic Transcription

**Scenario:** Transcribing lectures or interviews for research.

```bash
source whisper-env/bin/activate
# Maximum accuracy with timestamps for citations
python3 whisper_transcribe.py "VIDEO_URL" -m large -f timestamped -o research.txt
deactivate
```

---

### Workflow 4: Multilingual Content Processing

**Scenario:** Processing videos in multiple languages.

```bash
# Spanish video
node index.js "SPANISH_VIDEO_URL" -l es -o spanish.txt

# French video (no captions - use Whisper)
source whisper-env/bin/activate
python3 whisper_transcribe.py "FRENCH_VIDEO_URL" -l fr -m base -o french.txt
deactivate
```

---

### Workflow 5: Batch Processing Playlist

**Scenario:** Transcribing an entire YouTube playlist.

```bash
# Extract all URLs from playlist
yt-dlp --flat-playlist --print url "PLAYLIST_URL" > urls.txt

# Process each video
while read url; do
  # Try JavaScript first
  if node index.js "$url" -o "transcript_$(date +%s).txt" 2>/dev/null; then
    echo "✓ Captions extracted"
  else
    # Fallback to Whisper
    source whisper-env/bin/activate
    python3 whisper_transcribe.py "$url" -m base -o "transcript_$(date +%s).txt"
    deactivate
  fi
done < urls.txt
```

---

### Workflow 6: Data Analysis Pipeline

**Scenario:** Extracting transcripts for text analysis or AI processing.

```bash
# Get JSON data for programmatic use
node index.js "VIDEO_URL" -f json -o data.json

# Or with Whisper (more metadata)
source whisper-env/bin/activate
python3 whisper_transcribe.py "VIDEO_URL" -f json -o full_data.json
deactivate
```

---

## 🛠️ Advanced Usage

### Batch Processing Multiple Videos

Create a bash script (`batch_transcribe.sh`):

```bash
#!/bin/bash

# List of video URLs
VIDEOS=(
  "https://www.youtube.com/watch?v=VIDEO_ID_1"
  "https://www.youtube.com/watch?v=VIDEO_ID_2"
  "https://www.youtube.com/watch?v=VIDEO_ID_3"
)

# Try JavaScript extractor first, fallback to Whisper
for url in "${VIDEOS[@]}"; do
  echo "Processing: $url"
  
  # Try extracting captions first
  if node index.js "$url" -o "transcript_$(date +%s).txt" 2>/dev/null; then
    echo "✓ Extracted captions"
  else
    echo "→ No captions, using Whisper..."
    source whisper-env/bin/activate
    python3 whisper_transcribe.py "$url" -m base
  fi
  
  echo "---"
done
```

Run with: `bash batch_transcribe.sh`

### Process Entire YouTube Playlist

```bash
# Install yt-dlp playlist support
brew install yt-dlp

# Extract all video URLs from playlist
yt-dlp --flat-playlist --print url "PLAYLIST_URL" > urls.txt

# Process each URL
while read url; do
  node index.js "$url" -o "transcripts/$(basename $url).txt"
done < urls.txt
```

### Integrate with Other Tools

```javascript
// Use as Node.js module
import { YoutubeTranscript } from 'youtube-transcript';

async function getTranscript(videoId) {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  return transcript.map(item => item.text).join(' ');
}

// Example: Summarize with AI
const text = await getTranscript('dQw4w9WgXcQ');
// Send to ChatGPT/Claude API for summarization
```

---

## 🐛 Troubleshooting

### "No transcript found" or "All methods failed"
**Problem:** YouTube has restricted transcript API access (2024-2025). Even videos with visible captions may not be accessible via API.

**Solution:** Use Whisper AI (works for ANY video):
```bash
source whisper-env/bin/activate
python3 whisper_transcribe.py "VIDEO_URL"
```

**Alternative:** Try yt-dlp for public captions:
```bash
yt-dlp --write-auto-sub --skip-download -o transcript "VIDEO_URL"
# Output: transcript.en.vtt or transcript.en.srt
```

**Why this happens:**
- The tool tries 3 different methods automatically:
  1. Improved caption extractor
  2. Original youtube-transcript
  3. Browser simulation (Puppeteer)
- All may fail due to YouTube's restrictions
- See `TRANSCRIPT_METHODS.md` for technical details

### "Command not found: node"
**Solution:** Install Node.js:
```bash
brew install node
```

### "No module named 'whisper'"
**Solution:** Activate venv and install:
```bash
source whisper-env/bin/activate
pip install -U openai-whisper
```

### NumPy 2.x Compatibility Error
**Problem:** `A module that was compiled using NumPy 1.x cannot be run in NumPy 2.3.5`

**Solution:** Downgrade NumPy to 1.x (required for Whisper):
```bash
source whisper-env/bin/activate
pip install "numpy<2" --upgrade
```

**Why?** Whisper and PyTorch were compiled with NumPy 1.x and are not yet compatible with NumPy 2.x. This is a known issue that will be resolved in future versions.

### Whisper is slow on Intel Mac
**Solution:** Use smaller model:
```bash
python3 whisper_transcribe.py "VIDEO_URL" -m tiny
```

### "FFmpeg not found"
**Solution:** Install FFmpeg:
```bash
brew install ffmpeg
```

### Private/Age-Restricted Videos
**Solution:** Neither method can access private videos without authentication. For age-restricted videos, use yt-dlp with cookies:
```bash
yt-dlp --cookies-from-browser chrome "VIDEO_URL"
```

### Python 3.13/3.14 Compatibility Issues
**Problem:** Python 3.13+ is **NOT compatible** with Whisper. Python 3.12 (LTS) is **REQUIRED**.

**Solution:** Install Python 3.12 (LTS):
```bash
# If using pyenv (recommended)
pyenv install 3.12.10
pyenv local 3.12.10
python3 --version  # Verify it shows 3.12.10
./fix_whisper_install.sh

# If using Homebrew
brew install python@3.12
python3.12 -m venv whisper-env
source whisper-env/bin/activate
pip install -U openai-whisper yt-dlp
```

**Why?** Python 3.13+ introduces changes that break Cython compilation for Whisper dependencies (specifically the `av` package used by faster-whisper). Python 3.12 is the LTS (Long Term Support) version and is fully compatible.

### "No such file or directory: whisper-env/bin/python3"
**Solution:** Virtual environment is broken. Clean up and recreate:
```bash
rm -rf whisper-env
./fix_whisper_install.sh
```

### pyenv Python Not Found or Wrong Version
**Solution:** Install and set Python 3.12 (REQUIRED):
```bash
# Check pyenv setup
pyenv versions

# Install Python 3.12.10 (REQUIRED - LTS version)
pyenv install 3.12.10

# Set for this project (REQUIRED)
cd /path/to/youtube-transcript-extractor
pyenv local 3.12.10

# Verify (MUST show 3.12.x)
python3 --version  # Should show 3.12.10

# If it shows 3.13+ or 3.14+, the local setting didn't work
# Check: cat .python-version  # Should show 3.12.10
```

---

## 🚀 Performance Tips

1. **JavaScript Extractor is always faster** - Try it first
2. **For Whisper on Apple Silicon (M1/M2/M3):**
   - Use `base` model for 5x faster processing
   - Automatically uses GPU acceleration
3. **For long videos (>1 hour):**
   - Use `tiny` or `base` model
   - Consider splitting audio
4. **Transcribe overnight:**
   - Use `medium` or `large` for best accuracy
   - Process multiple videos in batch

---

## 💰 Cost Comparison

| Method | Setup Time | Per Video Cost | 100 Videos | Notes |
|--------|-----------|---------------|------------|-------|
| **This Solution (JS)** | 2 min | $0 | $0 | Instant |
| **This Solution (Whisper)** | 15 min | $0 | $0 | 2-10 min/video |
| **NotGPT Pro** | 0 min | $0.20 | $20 | Monthly quota |
| **Rev.ai API** | 5 min | $0.25 | $25 | Per minute |
| **AssemblyAI** | 5 min | $0.15 | $15 | Per hour |
| **Human Transcription** | 0 min | $1-3 | $100-300 | Slow |

**Savings Example:** Transcribing 100 videos = **$15-300 saved** ✨

---

## 📝 File Structure

```
youtube-transcript-extractor/
├── index.js                  # JavaScript transcript extractor
├── whisper_transcribe.py     # Python Whisper transcriber
├── whisper_manager.py         # Whisper model manager CLI
├── package.json              # Node.js dependencies
├── README.md                 # This file
└── whisper-env/              # Python virtual environment (created during setup)
```

---

## 🤝 Contributing

Found a bug or have a feature request? Feel free to:
1. Modify the scripts to fit your needs
2. Share improvements with the community
3. Report issues you encounter

---

## 📄 License

MIT License - Free to use, modify, and distribute

---

## 🙏 Credits

- **OpenAI Whisper** - State-of-the-art speech recognition
- **yt-dlp** - YouTube download tool
- **youtube-transcript** - Caption extraction library

---

## 🎓 Learn More

- [Whisper GitHub](https://github.com/openai/whisper)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [YouTube API](https://developers.google.com/youtube)

---

**Made with ❤️ for cost-effective video transcription**

Need help? Check the troubleshooting section or open an issue!


