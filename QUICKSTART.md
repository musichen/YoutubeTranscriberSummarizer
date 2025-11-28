# ⚡ Quick Start Guide

## 🎯 Choose Your Method

### Option A: Extract Existing Captions (FASTEST ✨)
**Best for:** Most YouTube videos (works ~80% of the time)  
**Time:** 1-5 seconds  
**Quality:** Original captions

```bash
# One-time setup
npm install

# Use it!
npm start "https://www.youtube.com/watch?v=VIDEO_ID"
```

**That's it!** The transcript will be displayed in your terminal.

---

### Option B: AI Transcription with Whisper (FALLBACK 🎙️)
**Best for:** Videos without captions  
**Time:** 2-10 minutes per 10-min video  
**Quality:** 95-98% accuracy

**⚠️ REQUIRES Python 3.12 (LTS)** - Python 3.13+ is NOT compatible

```bash
# 1. Install Python 3.12 (if using pyenv)
pyenv install 3.12.10
pyenv local 3.12.10

# 2. One-time setup (run once)
./setup.sh

# 3. Use it!
source whisper-env/bin/activate
python3 whisper_transcribe.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

---

## 🚀 Super Quick Install (All-in-One)

**Copy and paste this into your terminal:**

```bash
# Navigate to project
cd /Users/musichen/src/cursorprojects/youtubeaitranscribersummmarizer

# Run automated setup
./setup.sh

# Test it immediately
npm start "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

---

## 📋 Common Commands

```bash
# Extract transcript and save to file
node index.js "VIDEO_URL" -o output.txt

# Generate SRT subtitles
node index.js "VIDEO_URL" -f srt -o subtitles.srt

# Extract with timestamps
node index.js "VIDEO_URL" -f timestamped

# Use Whisper for videos without captions
python3 whisper_transcribe.py "VIDEO_URL"
```

---

## ❓ What If It Doesn't Work?

### "Transcript is disabled"
→ Video has no captions. Use Whisper instead:
```bash
source whisper-env/bin/activate
python3 whisper_transcribe.py "VIDEO_URL"
```

### "Python 3.12 not found" or "Python 3.14 may have compatibility issues"
→ **Python 3.12 (LTS) is REQUIRED**. Install it:
```bash
# If using pyenv
pyenv install 3.12.10
pyenv local 3.12.10
python3 --version  # Should show 3.12.10
./setup.sh

# If using Homebrew
brew install python@3.12
./setup.sh
```

### "Command not found: node"
→ Install Node.js:
```bash
brew install node
npm install
```

### "Cannot find module"
→ Install dependencies:
```bash
npm install
```

---

## 📖 Want More Details?

Check out the full **[README.md](README.md)** for:
- Advanced features
- Batch processing
- Performance optimization
- Language support
- Troubleshooting

---

## 💰 Why This Rocks

| Feature | This Tool | NotGPT | Rev.ai |
|---------|-----------|--------|--------|
| Cost | **FREE** | $10-30/mo | $0.25/min |
| Speed | 1-5 sec (captions) | 1-5 min | 2-3 min |
| Privacy | **100% Local** | Cloud | Cloud |
| Limits | **None** | Quota | Pay-per-use |

---

**Ready to transcribe? Start with the Quick Install above! ⬆️**

