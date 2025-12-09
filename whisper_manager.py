#!/usr/bin/env python3
"""
Whisper Model Manager CLI
Manage Whisper models: list, download, delete, and get info
"""

import argparse
import os
import sys
import shutil
from pathlib import Path

# Config file path for storing active model
CONFIG_FILE = Path.home() / ".whisper-version"
PROJECT_CONFIG_FILE = Path.cwd() / ".whisper-version"

# Model information
MODEL_INFO = {
    'tiny': {
        'size': '39M parameters',
        'ram': '~1GB',
        'speed': 'Fastest',
        'accuracy': '70-80%',
        'disk': '~75MB',
        'description': 'Fastest option, good for quick previews'
    },
    'base': {
        'size': '74M parameters',
        'ram': '~1GB',
        'speed': 'Fast',
        'accuracy': '85-90%',
        'disk': '~150MB',
        'description': 'Best balance of speed and accuracy (recommended)'
    },
    'small': {
        'size': '244M parameters',
        'ram': '~2GB',
        'speed': 'Medium',
        'accuracy': '90-93%',
        'disk': '~500MB',
        'description': 'Better accuracy than base'
    },
    'medium': {
        'size': '769M parameters',
        'ram': '~5GB',
        'speed': 'Slow',
        'accuracy': '93-96%',
        'disk': '~1.5GB',
        'description': 'High accuracy, best for important content'
    },
    'large': {
        'size': '1550M parameters',
        'ram': '~10GB',
        'speed': 'Slowest',
        'accuracy': '96-98%',
        'disk': '~3GB',
        'description': 'Highest accuracy, use for production'
    }
}

def get_whisper_type():
    """Detect which Whisper implementation is installed"""
    try:
        import whisper
        return "openai"
    except ImportError:
        try:
            from faster_whisper import WhisperModel
            return "faster"
        except ImportError:
            return None

def get_model_cache_dir(whisper_type):
    """Get the cache directory for Whisper models"""
    if whisper_type == "openai":
        # openai-whisper stores models in ~/.cache/whisper
        cache_dir = Path.home() / ".cache" / "whisper"
    elif whisper_type == "faster":
        # faster-whisper uses HuggingFace cache
        cache_dir = Path.home() / ".cache" / "huggingface" / "hub"
    else:
        return None
    return cache_dir

def list_installed_models(whisper_type):
    """List all installed Whisper models"""
    cache_dir = get_model_cache_dir(whisper_type)
    if not cache_dir or not cache_dir.exists():
        return []
    
    installed = []
    
    if whisper_type == "openai":
        # Models are stored as .pt files with names like base.pt, small.pt, etc.
        for model_name in MODEL_INFO.keys():
            model_file = cache_dir / f"{model_name}.pt"
            if model_file.exists():
                size = model_file.stat().st_size / (1024 * 1024)  # MB
                installed.append({
                    'name': model_name,
                    'path': model_file,
                    'size_mb': size
                })
    elif whisper_type == "faster":
        # faster-whisper uses HuggingFace format
        # Models are in subdirectories like models--guillaumekln--faster-whisper-{model}
        hub_dir = cache_dir
        if hub_dir.exists():
            for item in hub_dir.iterdir():
                if item.is_dir() and 'faster-whisper' in item.name:
                    # Extract model name from directory name
                    # Format: models--guillaumekln--faster-whisper-{model}--{hash}
                    parts = item.name.split('--')
                    if len(parts) >= 3 and 'faster-whisper' in parts[2]:
                        model_name = parts[2].replace('faster-whisper-', '')
                        if model_name in MODEL_INFO:
                            # Calculate total size
                            total_size = sum(f.stat().st_size for f in item.rglob('*') if f.is_file())
                            size_mb = total_size / (1024 * 1024)
                            installed.append({
                                'name': model_name,
                                'path': item,
                                'size_mb': size_mb
                            })
    
    return installed

def download_model(model_name, whisper_type):
    """Download a Whisper model"""
    if model_name not in MODEL_INFO:
        print(f"❌ Error: Invalid model name '{model_name}'")
        print(f"   Available models: {', '.join(MODEL_INFO.keys())}")
        return False
    
    print(f"📥 Downloading model: {model_name}")
    print(f"   {MODEL_INFO[model_name]['description']}")
    print(f"   Size: {MODEL_INFO[model_name]['disk']}")
    print("   (This may take a few minutes...)")
    
    try:
        if whisper_type == "openai":
            import whisper
            print(f"\n🔄 Loading model (will download if not cached)...")
            model = whisper.load_model(model_name)
            
            # Verify the file was actually created
            cache_dir = get_model_cache_dir(whisper_type)
            model_file = cache_dir / f"{model_name}.pt"
            
            # Wait a moment for file to be written (if it's still being written)
            import time
            max_wait = 5  # seconds
            waited = 0
            while not model_file.exists() and waited < max_wait:
                time.sleep(0.5)
                waited += 0.5
            
            if model_file.exists():
                size_mb = model_file.stat().st_size / (1024 * 1024)
                print(f"✓ Model '{model_name}' downloaded and ready! ({size_mb:.1f} MB)")
                return True
            else:
                print(f"⚠️  Model '{model_name}' loaded but file not found in cache")
                print(f"   This is unusual - the model may still work, but detection might fail")
                return True  # Still return True since model loaded successfully
                
        elif whisper_type == "faster":
            from faster_whisper import WhisperModel
            print(f"\n🔄 Loading model (will download if not cached)...")
            model = WhisperModel(model_name, device="cpu", compute_type="int8")
            print(f"✓ Model '{model_name}' downloaded and ready!")
            return True
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        return False

def delete_model(model_name, whisper_type):
    """Delete a Whisper model"""
    if model_name not in MODEL_INFO:
        print(f"❌ Error: Invalid model name '{model_name}'")
        print(f"   Available models: {', '.join(MODEL_INFO.keys())}")
        return False
    
    cache_dir = get_model_cache_dir(whisper_type)
    if not cache_dir:
        print("❌ Error: Could not find Whisper cache directory")
        return False
    
    deleted = False
    
    if whisper_type == "openai":
        model_file = cache_dir / f"{model_name}.pt"
        if model_file.exists():
            size_mb = model_file.stat().st_size / (1024 * 1024)
            model_file.unlink()
            print(f"✓ Deleted model '{model_name}' ({size_mb:.1f} MB freed)")
            deleted = True
        else:
            print(f"⚠️  Model '{model_name}' not found")
    
    elif whisper_type == "faster":
        hub_dir = cache_dir
        if hub_dir.exists():
            for item in hub_dir.iterdir():
                if item.is_dir() and 'faster-whisper' in item.name:
                    parts = item.name.split('--')
                    if len(parts) >= 3 and 'faster-whisper' in parts[2]:
                        cached_model_name = parts[2].replace('faster-whisper-', '')
                        if cached_model_name == model_name:
                            size_mb = sum(f.stat().st_size for f in item.rglob('*') if f.is_file()) / (1024 * 1024)
                            shutil.rmtree(item)
                            print(f"✓ Deleted model '{model_name}' ({size_mb:.1f} MB freed)")
                            deleted = True
                            break
            if not deleted:
                print(f"⚠️  Model '{model_name}' not found")
    
    return deleted

def get_active_model():
    """Get the currently active model from config file"""
    # Check project-level config first, then global
    for config_file in [PROJECT_CONFIG_FILE, CONFIG_FILE]:
        if config_file.exists():
            try:
                model = config_file.read_text().strip()
                if model in MODEL_INFO:
                    return model
            except Exception:
                pass
    return None

def set_active_model(model_name):
    """Set the active model in config file"""
    if model_name not in MODEL_INFO:
        print(f"❌ Error: Invalid model name '{model_name}'")
        print(f"   Available models: {', '.join(MODEL_INFO.keys())}")
        return False
    
    try:
        # Use project-level config if in a project directory, otherwise global
        config_file = PROJECT_CONFIG_FILE if Path.cwd().name != Path.home().name else CONFIG_FILE
        config_file.write_text(model_name + '\n')
        print(f"✓ Set active model to: {model_name}")
        print(f"   Config saved to: {config_file}")
        return True
    except Exception as e:
        print(f"❌ Error saving config: {e}")
        return False

def list_remote_models():
    """List all available remote models"""
    print("=" * 70)
    print("AVAILABLE WHISPER MODELS")
    print("=" * 70)
    print()
    
    for name in MODEL_INFO.keys():
        info = MODEL_INFO[name]
        print(f"📦 {name.upper()}")
        print(f"   Description: {info['description']}")
        print(f"   Parameters: {info['size']}")
        print(f"   RAM Usage: {info['ram']}")
        print(f"   Disk Space: {info['disk']}")
        print(f"   Speed: {info['speed']}")
        print(f"   Accuracy: {info['accuracy']}")
        print()
    
    print("💡 Download a model with:")
    print("   python3 whisper_manager.py download <model_name>")
    print("💡 Set as active model with:")
    print("   python3 whisper_manager.py use <model_name>")

def show_model_info(model_name=None):
    """Show information about Whisper models"""
    print("=" * 70)
    print("WHISPER MODEL INFORMATION")
    print("=" * 70)
    print()
    
    models_to_show = [model_name] if model_name else MODEL_INFO.keys()
    
    for name in models_to_show:
        if name not in MODEL_INFO:
            print(f"❌ Unknown model: {name}")
            continue
        
        info = MODEL_INFO[name]
        print(f"📦 {name.upper()}")
        print(f"   Description: {info['description']}")
        print(f"   Parameters: {info['size']}")
        print(f"   RAM Usage: {info['ram']}")
        print(f"   Disk Space: {info['disk']}")
        print(f"   Speed: {info['speed']}")
        print(f"   Accuracy: {info['accuracy']}")
        print()

def main():
    parser = argparse.ArgumentParser(
        description="Manage Whisper AI models: list, download, delete, and get info",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s list                    # List installed models (shows active)
  %(prog)s list-remote             # List all available remote models
  %(prog)s use base                # Set base as active model
  %(prog)s download base           # Download base model
  %(prog)s delete tiny             # Delete tiny model
  %(prog)s info                    # Show info for all models
  %(prog)s info large              # Show info for large model
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List installed models')
    
    # List-remote command
    list_remote_parser = subparsers.add_parser('list-remote', help='List all available remote models')
    
    # Use command
    use_parser = subparsers.add_parser('use', help='Set active model (like nvm/pyenv)')
    use_parser.add_argument(
        'model',
        choices=list(MODEL_INFO.keys()),
        help='Model name to set as active'
    )
    
    # Download command
    download_parser = subparsers.add_parser('download', help='Download a model')
    download_parser.add_argument(
        'model',
        choices=list(MODEL_INFO.keys()),
        help='Model name to download'
    )
    
    # Delete command
    delete_parser = subparsers.add_parser('delete', help='Delete a model')
    delete_parser.add_argument(
        'model',
        choices=list(MODEL_INFO.keys()),
        help='Model name to delete'
    )
    delete_parser.add_argument(
        '-y', '--yes',
        action='store_true',
        help='Skip confirmation prompt'
    )
    
    # Info command
    info_parser = subparsers.add_parser('info', help='Show model information')
    info_parser.add_argument(
        'model',
        nargs='?',
        choices=list(MODEL_INFO.keys()) + [None],
        help='Model name (optional, shows all if not specified)'
    )
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Check if Whisper is installed
    whisper_type = get_whisper_type()
    if not whisper_type:
        print("❌ Error: Whisper not installed")
        print("   Install with: ./setup.sh")
        print("   Or manually: pip install openai-whisper")
        sys.exit(1)
    
    print(f"🔍 Detected Whisper: {whisper_type}-whisper\n")
    
    # Execute command
    if args.command == 'list':
        installed = list_installed_models(whisper_type)
        active_model = get_active_model()
        
        if not installed:
            print("📭 No models installed")
            if active_model:
                print(f"   Active model: {active_model} (not installed)")
            print("\n💡 Download a model with:")
            print("   python3 whisper_manager.py download base")
        else:
            print("=" * 70)
            print("INSTALLED MODELS")
            print("=" * 70)
            print()
            total_size = 0
            for model in installed:
                size_str = f"{model['size_mb']:.1f} MB"
                # Mark active model
                marker = " ← active" if active_model and model['name'] == active_model else ""
                print(f"✓ {model['name']:8} - {size_str:>10}{marker}")
                total_size += model['size_mb']
            print()
            print(f"Total: {total_size:.1f} MB")
            if active_model:
                if any(m['name'] == active_model for m in installed):
                    print(f"\n✓ Active model: {active_model}")
                else:
                    print(f"\n⚠️  Active model: {active_model} (not installed)")
                    print("   Install it with: python3 whisper_manager.py download " + active_model)
            else:
                print("\n💡 Set active model with:")
                print("   python3 whisper_manager.py use <model_name>")
            print()
            print("💡 To download more models:")
            print("   python3 whisper_manager.py download <model_name>")
            print("💡 To delete a model:")
            print("   python3 whisper_manager.py delete <model_name>")
    
    elif args.command == 'list-remote':
        list_remote_models()
    
    elif args.command == 'use':
        # Check if model is installed
        installed = list_installed_models(whisper_type)
        installed_names = [m['name'] for m in installed]
        
        if args.model not in installed_names:
            print(f"⚠️  Model '{args.model}' is not installed")
            print(f"   Download it first with:")
            print(f"   python3 whisper_manager.py download {args.model}")
            response = input(f"\n   Set as active anyway? (y/n): ")
            if response.lower() != 'y':
                print("   Cancelled")
                return
        
        set_active_model(args.model)
    
    elif args.command == 'download':
        download_model(args.model, whisper_type)
    
    elif args.command == 'delete':
        if not args.yes:
            print(f"⚠️  This will delete the '{args.model}' model")
            response = input("   Continue? (y/n): ")
            if response.lower() != 'y':
                print("   Cancelled")
                return
        
        delete_model(args.model, whisper_type)
    
    elif args.command == 'info':
        show_model_info(args.model)


if __name__ == "__main__":
    main()


