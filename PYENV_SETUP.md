# 🔧 Pyenv Setup Guide

## ⚠️ IMPORTANT: Python 3.12 (LTS) is REQUIRED

**Whisper requires Python 3.12 (LTS). Python 3.13+ is NOT compatible.**

Python 3.13+ introduces changes that break Cython compilation for Whisper dependencies (specifically the `av` package). Python 3.12 is the LTS (Long Term Support) version and is fully compatible.

## ✅ REQUIRED: Install Python 3.12 (LTS)

Python 3.12 is **REQUIRED** - setup will fail without it:

```bash
# 1. Install Python 3.12.10 via pyenv (REQUIRED)
pyenv install 3.12.10

# 2. Set it as local version for this project (REQUIRED)
cd /Users/musichen/src/cursorprojects/youtubeaitranscribersummmarizer
pyenv local 3.12.10

# 3. Verify (MUST show 3.12.x)
python3 --version  # Should show 3.12.10

# 4. Run setup
./setup.sh
```

**Why Python 3.12?**
- It's the LTS (Long Term Support) version
- Fully compatible with all Whisper dependencies
- Python 3.13+ causes Cython compilation errors
- Python 3.14+ will fail during installation

## 🚀 Quick Setup (Recommended Path)

```bash
# 1. Install Python 3.12
pyenv install 3.12.10

# 2. Set it for this project
cd /Users/musichen/src/cursorprojects/youtubeaitranscribersummmarizer
pyenv local 3.12.10

# 3. Run setup
./setup.sh
```

## 📝 What Changed

The setup scripts now:
- ✅ **REQUIRE Python 3.12** - Will fail if not found
- ✅ Properly detect pyenv
- ✅ Use pyenv Python versions correctly
- ✅ Provide clear error messages if Python 3.12 is missing
- ✅ Show installation instructions when Python 3.12 is not available

## ❓ Troubleshooting

### "No such file or directory: whisper-env/bin/python3"
→ The venv is broken. Run:
```bash
rm -rf whisper-env
./fix_whisper_install.sh
```

### "Whisper installation failed" or "Python 3.12 not found"
→ **Python 3.12 is REQUIRED**. Install it:
```bash
# Install Python 3.12.10 (REQUIRED)
pyenv install 3.12.10

# Set for this project (REQUIRED)
pyenv local 3.12.10

# Verify
python3 --version  # MUST show 3.12.10

# Run fix script
./fix_whisper_install.sh
```

### "Python 3.14.0 may have compatibility issues"
→ **Python 3.14 is NOT compatible**. You MUST use Python 3.12:
```bash
pyenv install 3.12.10
pyenv local 3.12.10
python3 --version  # Verify it shows 3.12.10
./setup.sh
```

