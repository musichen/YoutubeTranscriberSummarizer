#!/usr/bin/env python3
"""
YTTOOL - YouTube Tool
Unified CLI tool for YouTube operations (convert to MP3, download playlists, transcribe, etc.)
"""

import argparse
import os
import sys
import hashlib
import subprocess
from pathlib import Path

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
    return url.replace('\\', '')


def generate_short_hash(text):
    """Generate a short hash from text"""
    return hashlib.md5(text.encode()).hexdigest()[:8]


def get_video_info(url):
    """Get video information using yt-dlp"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                'title': info.get('title', 'Unknown'),
                'id': info.get('id', ''),
                'duration': info.get('duration', 0),
            }
    except Exception as e:
        print(f"⚠️  Could not fetch video info: {e}")
        return {
            'title': 'Unknown',
            'id': '',
            'duration': 0,
        }


def get_playlist_info(url):
    """Get playlist information including number of entries"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if 'entries' in info:
                entries = list(info['entries'])
                return {
                    'title': info.get('title', 'Unknown Playlist'),
                    'count': len(entries),
                    'entries': entries,
                }
            return None
    except Exception as e:
        print(f"⚠️  Could not fetch playlist info: {e}")
        return None


def convert_to_mp3(url, output_dir=None):
    """Download audio and convert to MP3"""
    if output_dir is None:
        output_dir = os.getcwd()
    
    # Get video info for filename
    print("📥 Fetching video information...")
    video_info = get_video_info(url)
    title = video_info['title']
    
    # Sanitize title for filename (remove invalid characters)
    safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
    safe_title = safe_title.replace(' ', '_')[:50]  # Limit length
    
    # Generate short hash
    short_hash = generate_short_hash(url + title)
    filename = f"{safe_title}_{short_hash}.mp3"
    output_path = os.path.join(output_dir, filename)
    
    print(f"🎵 Converting to MP3: {title}")
    print(f"📁 Output: {output_path}")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path.replace('.mp3', '.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'embed_metadata': True,
        'embed_thumbnail': True,
        'quiet': False,
        'no_warnings': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        # Check if file was created (yt-dlp might add extension)
        if os.path.exists(output_path):
            print(f"✅ Successfully converted: {output_path}")
        else:
            # Try to find the file with different extension
            base_path = output_path.replace('.mp3', '')
            for ext in ['.mp3', '.m4a', '.webm', '.opus']:
                test_path = base_path + ext
                if os.path.exists(test_path):
                    # Rename to .mp3 if needed
                    if ext != '.mp3':
                        os.rename(test_path, output_path)
                    print(f"✅ Successfully converted: {output_path}")
                    return output_path
            print(f"⚠️  File created but path may differ. Check: {output_dir}")
        
        return output_path
    except Exception as e:
        print(f"❌ Error converting to MP3: {e}")
        sys.exit(1)


def convert_playlist_to_mp3(url, output_dir=None, count=None):
    """Download entire playlist and convert all videos to MP3 using yt-dlp native playlist support"""
    if output_dir is None:
        output_dir = os.getcwd()
    
    # Get playlist info for display (optional)
    print("📋 Fetching playlist information...")
    playlist_info = get_playlist_info(url)
    
    if playlist_info:
        playlist_title = playlist_info['title']
        total_count = playlist_info['count']
        print(f"📚 Playlist: {playlist_title}")
        print(f"📊 Found {total_count} videos")
    else:
        playlist_title = 'Playlist'
        print("📚 Processing playlist...")
    
    # Create playlist directory using yt-dlp's output template
    # yt-dlp will automatically create the directory based on %(playlist)s
    # We'll use: %(playlist)s/%(title)s.%(ext)s
    # This ensures each file is named by its title and organized in playlist folder
    
    print(f"\n🔄 Downloading entire playlist...")
    print(f"📁 Files will be saved to: {output_dir}")
    print(f"📝 Each file will be named: [Video Title].mp3\n")
    
    # Use yt-dlp's native playlist support - it handles everything automatically
    # Output template: %(playlist)s/%(title)s.%(ext)s
    # This creates a folder named after the playlist and files named by title
    output_template = os.path.join(output_dir, '%(playlist)s', '%(title)s.%(ext)s')
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'embed_metadata': True,
        'embed_thumbnail': True,
        'yes_playlist': True,  # Ensure playlist is downloaded even if URL points to single video in playlist
        'quiet': False,
        'no_warnings': False,
        'ignoreerrors': True,  # Continue on errors for individual videos
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"\n{'='*60}")
        print(f"✅ Playlist download completed!")
        print(f"📁 Files saved to: {os.path.join(output_dir, playlist_title if playlist_info else 'Playlist')}")
        print(f"{'='*60}")
    except Exception as e:
        print(f"\n❌ Error downloading playlist: {e}")
        print("💡 Some videos may have been downloaded successfully. Check the output directory.")
        sys.exit(1)


def convert_to_txt(url):
    """Convert video to text transcript using whisper_transcribe.py"""
    print("📝 Converting to text transcript using Whisper AI...")
    
    # Get path to whisper_transcribe.py (same directory as this script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    whisper_script = os.path.join(script_dir, 'whisper_transcribe.py')
    
    if not os.path.exists(whisper_script):
        print(f"❌ Error: whisper_transcribe.py not found at {whisper_script}")
        sys.exit(1)
    
    # Call whisper_transcribe.py
    try:
        result = subprocess.run(
            [sys.executable, whisper_script, url],
            check=True,
            capture_output=False
        )
        print("✅ Transcript generation completed")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running whisper_transcribe.py: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️  Cancelled by user")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='YTTOOL - YouTube Tool for converting videos',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s convert "https://www.youtube.com/watch?v=VIDEO_ID"
  %(prog)s convert "PLAYLIST_URL" --format mp3-playlist
  %(prog)s convert "VIDEO_URL" --format txt
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Convert command
    convert_parser = subparsers.add_parser('convert', help='Convert YouTube video/playlist')
    convert_parser.add_argument('url', help='YouTube video or playlist URL')
    convert_parser.add_argument(
        '--format', '-f',
        choices=['mp3', 'mp3-playlist', 'txt'],
        help='Output format (if not specified, will prompt)'
    )
    convert_parser.add_argument(
        '--output', '-o',
        help='Output directory (default: current directory)'
    )
    
    args = parser.parse_args()
    
    if args.command != 'convert':
        parser.print_help()
        sys.exit(1)
    
    # Sanitize URL
    sanitized_url = sanitize_url(args.url)
    if sanitized_url != args.url:
        print("🔧 Sanitized URL (removed escape characters)")
    
    # Determine format
    format_choice = args.format
    
    if not format_choice:
        print("\n📋 What would you like to convert to?")
        print("  1. mp3 - Single video to MP3")
        print("  2. mp3-playlist - Entire playlist to MP3")
        print("  3. txt - Video transcript (using Whisper AI)")
        print()
        
        try:
            choice = input("Enter choice (1-3): ").strip()
            choice_map = {
                '1': 'mp3',
                '2': 'mp3-playlist',
                '3': 'txt',
            }
            format_choice = choice_map.get(choice)
            if not format_choice:
                print("❌ Invalid choice")
                sys.exit(1)
        except (KeyboardInterrupt, EOFError):
            print("\n⚠️  Cancelled")
            sys.exit(1)
    
    # Execute conversion
    output_dir = args.output if args.output else None
    
    if format_choice == 'mp3':
        convert_to_mp3(sanitized_url, output_dir)
    elif format_choice == 'mp3-playlist':
        convert_playlist_to_mp3(sanitized_url, output_dir)
    elif format_choice == 'txt':
        convert_to_txt(sanitized_url)
    else:
        print(f"❌ Unknown format: {format_choice}")
        sys.exit(1)


if __name__ == '__main__':
    main()

