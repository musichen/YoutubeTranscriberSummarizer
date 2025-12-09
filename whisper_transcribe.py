#!/usr/bin/env python3
"""
YouTube Audio Transcription using OpenAI Whisper
For videos WITHOUT captions - uses local AI transcription
"""

import argparse
import os
import sys
import tempfile
from pathlib import Path

try:
    import whisper
    WHISPER_TYPE = "openai"
except ImportError:
    try:
        from faster_whisper import WhisperModel
        WHISPER_TYPE = "faster"
    except ImportError:
        print("❌ Error: Whisper not installed. Install with:")
        print("   pip install -U openai-whisper")
        print("   OR")
        print("   pip install -U faster-whisper")
        sys.exit(1)

try:
    import yt_dlp
except ImportError:
    print("❌ Error: yt-dlp not installed. Install with:")
    print("   pip install yt-dlp")
    sys.exit(1)


def sanitize_url(url):
    """Remove backslash escapes from URL (fixes zsh auto-escaping issue)"""
    if not url:
        return url
    # Remove backslashes that escape special characters (e.g., \? becomes ?)
    return url.replace('\\', '')


def download_audio(url, output_dir):
    """Download audio from YouTube video using yt-dlp"""
    print(f"📥 Downloading audio from: {url}")
    
    output_template = os.path.join(output_dir, 'audio')
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template + '.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'quiet': False,
        'no_warnings': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            audio_file = output_template + '.wav'
            
            if not os.path.exists(audio_file):
                raise FileNotFoundError(f"Audio file not found: {audio_file}")
            
            return audio_file, info.get('title', 'Unknown')
    except Exception as e:
        print(f"❌ Error downloading audio: {e}")
        sys.exit(1)


def transcribe_audio(audio_file, model_name="base", language=None):
    """Transcribe audio using Whisper"""
    print(f"\n🎙️  Loading Whisper model: {model_name}")
    print("   (First run will download the model)")
    
    try:
        if WHISPER_TYPE == "openai":
            # Using openai-whisper
            model = whisper.load_model(model_name)
            print(f"✓ Model loaded successfully (openai-whisper)")
            
            print(f"\n🔄 Transcribing audio... (this may take a few minutes)")
            
            transcribe_options = {
                'verbose': False,
                'task': 'transcribe',
            }
            
            if language:
                transcribe_options['language'] = language
            
            result = model.transcribe(audio_file, **transcribe_options)
            
        else:
            # Using faster-whisper
            model = WhisperModel(model_name, device="cpu", compute_type="int8")
            print(f"✓ Model loaded successfully (faster-whisper)")
            
            print(f"\n🔄 Transcribing audio... (this may take a few minutes)")
            
            segments, info = model.transcribe(audio_file, language=language, task="transcribe")
            
            # Convert faster-whisper format to openai-whisper format
            result = {
                'text': '',
                'segments': [],
                'language': info.language if hasattr(info, 'language') else language or 'en'
            }
            
            for segment in segments:
                result['segments'].append({
                    'start': segment.start,
                    'end': segment.end,
                    'text': segment.text
                })
                result['text'] += segment.text
        
        return result
    except Exception as e:
        print(f"❌ Error during transcription: {e}")
        sys.exit(1)


def format_timestamp(seconds):
    """Convert seconds to HH:MM:SS format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def save_transcript(result, output_file, format_type="text"):
    """Save transcript to file in various formats"""
    
    with open(output_file, 'w', encoding='utf-8') as f:
        if format_type == "text":
            # Plain text without timestamps
            f.write(result['text'].strip())
        
        elif format_type == "timestamped":
            # Text with timestamps
            f.write("=" * 60 + "\n")
            f.write("TIMESTAMPED TRANSCRIPT\n")
            f.write("=" * 60 + "\n\n")
            
            for segment in result['segments']:
                start = format_timestamp(segment['start'])
                end = format_timestamp(segment['end'])
                text = segment['text'].strip()
                f.write(f"[{start} - {end}] {text}\n")
        
        elif format_type == "srt":
            # SRT subtitle format
            for i, segment in enumerate(result['segments'], 1):
                start_time = format_srt_timestamp(segment['start'])
                end_time = format_srt_timestamp(segment['end'])
                text = segment['text'].strip()
                
                f.write(f"{i}\n")
                f.write(f"{start_time} --> {end_time}\n")
                f.write(f"{text}\n\n")
        
        elif format_type == "json":
            # JSON format with full metadata
            import json
            f.write(json.dumps(result, indent=2, ensure_ascii=False))


def format_srt_timestamp(seconds):
    """Convert seconds to SRT timestamp format (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def print_transcript_preview(result, max_chars=500):
    """Print a preview of the transcript"""
    text = result['text'].strip()
    if len(text) > max_chars:
        print(text[:max_chars] + "...")
    else:
        print(text)


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe YouTube videos using Whisper AI (for videos without captions)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "https://www.youtube.com/watch?v=VIDEO_ID"
  %(prog)s "https://youtu.be/VIDEO_ID" -m medium -o transcript.txt
  %(prog)s "VIDEO_URL" -f srt -l en
  
Model sizes (speed vs accuracy):
  tiny   - Fastest, least accurate (~1GB RAM)
  base   - Fast, good for clear audio (~1GB RAM) [DEFAULT]
  small  - Balanced (~2GB RAM)
  medium - High accuracy, slower (~5GB RAM)
  large  - Best accuracy, slowest (~10GB RAM)
  
Supported languages: en, es, fr, de, it, pt, nl, pl, ru, zh, ja, ko, and 90+ more
        """
    )
    
    parser.add_argument('url', help='YouTube video URL or video ID')
    parser.add_argument(
        '-o', '--output',
        default=None,
        help='Output file path (default: transcript_<timestamp>.txt)'
    )
    parser.add_argument(
        '-m', '--model',
        choices=['tiny', 'base', 'small', 'medium', 'large'],
        default=None,
        help='Whisper model size (default: base, or active model from whisper_manager.py use)'
    )
    parser.add_argument(
        '-f', '--format',
        choices=['text', 'timestamped', 'srt', 'json'],
        default='timestamped',
        help='Output format (default: timestamped)'
    )
    parser.add_argument(
        '-l', '--language',
        help='Source language code (e.g., en, es, fr). Auto-detects if not specified.'
    )
    parser.add_argument(
        '--no-cleanup',
        action='store_true',
        help='Keep downloaded audio file (for debugging)'
    )
    
    args = parser.parse_args()
    
    # Determine which model to use
    model_to_use = args.model
    if model_to_use is None:
        # Try to get active model from whisper_manager config
        config_file = Path.cwd() / ".whisper-version"
        if not config_file.exists():
            config_file = Path.home() / ".whisper-version"
        
        if config_file.exists():
            try:
                active_model = config_file.read_text().strip()
                if active_model in ['tiny', 'base', 'small', 'medium', 'large']:
                    model_to_use = active_model
                    print(f"📌 Using active model: {active_model} (set via whisper_manager.py use)")
            except Exception:
                pass
        
        # Fallback to default
        if model_to_use is None:
            model_to_use = 'base'
    
    # Sanitize URL (remove backslash escapes from terminal pasting)
    sanitized_url = sanitize_url(args.url)
    if sanitized_url != args.url:
        print(f"🔧 Sanitized URL (removed escape characters)")
    
    # Create temp directory for audio download
    temp_dir = tempfile.mkdtemp(prefix='whisper_transcribe_')
    
    try:
        print("🚀 Starting YouTube transcription with Whisper AI\n")
        print("=" * 60)
        
        # Download audio
        audio_file, video_title = download_audio(sanitized_url, temp_dir)
        print(f"✓ Audio downloaded: {video_title}")
        
        # Transcribe
        result = transcribe_audio(audio_file, model_to_use, args.language)
        print(f"✓ Transcription complete!")
        
        # Determine output filename
        if args.output:
            output_file = args.output
        else:
            import time
            timestamp = int(time.time())
            ext = 'srt' if args.format == 'srt' else 'json' if args.format == 'json' else 'txt'
            output_file = f"transcript_{timestamp}.{ext}"
        
        # Save transcript
        save_transcript(result, output_file, args.format)
        print(f"\n✓ Transcript saved to: {output_file}")
        
        # Print preview
        print("\n" + "=" * 60)
        print("TRANSCRIPT PREVIEW:")
        print("=" * 60 + "\n")
        print_transcript_preview(result)
        
        # Stats
        word_count = len(result['text'].split())
        duration = result['segments'][-1]['end'] if result['segments'] else 0
        print(f"\n\n📊 Stats:")
        print(f"   Words: {word_count}")
        print(f"   Duration: {format_timestamp(duration)}")
        print(f"   Language: {result.get('language', 'auto-detected')}")
        
    finally:
        # Cleanup
        if not args.no_cleanup:
            import shutil
            try:
                shutil.rmtree(temp_dir)
                print(f"\n🧹 Cleaned up temporary files")
            except Exception as e:
                print(f"\n⚠️  Could not cleanup temp files: {e}")


if __name__ == "__main__":
    main()

