#!/usr/bin/env node

/**
 * YTTOOL - YouTube Tool
 * Unified CLI tool for YouTube operations (convert to MP3, download playlists, transcribe, etc.)
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sanitize URL by removing backslash escapes (fixes zsh auto-escaping issue)
 */
function sanitizeUrl(url) {
  if (!url) return url;
  return url.replace(/\\/g, '');
}

/**
 * Generate a short hash from text
 */
function generateShortHash(text) {
  return crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
}

/**
 * Check if yt-dlp is installed
 */
function checkYtDlp() {
  try {
    execSync('which yt-dlp', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get video information using yt-dlp
 */
function getVideoInfo(url) {
  try {
    const cmd = `yt-dlp --dump-json --no-warnings --quiet "${url}"`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const info = JSON.parse(output);
    return {
      title: info.title || 'Unknown',
      id: info.id || '',
      duration: info.duration || 0,
    };
  } catch (e) {
    console.log(chalk.yellow(`⚠️  Could not fetch video info: ${e.message}`));
    return {
      title: 'Unknown',
      id: '',
      duration: 0,
    };
  }
}

/**
 * Get playlist information including number of entries
 */
function getPlaylistInfo(url) {
  try {
    // First try to get playlist info
    const infoCmd = `yt-dlp --dump-json --no-warnings --quiet "${url}"`;
    let playlistInfo = null;
    try {
      const infoOutput = execSync(infoCmd, { encoding: 'utf-8' });
      playlistInfo = JSON.parse(infoOutput.trim());
    } catch (e) {
      // Not a playlist or error, continue
    }
    
    // If it's a playlist, get flat list
    if (playlistInfo && playlistInfo._type === 'playlist') {
      const flatCmd = `yt-dlp --flat-playlist --dump-json --no-warnings --quiet "${url}"`;
      const flatOutput = execSync(flatCmd, { encoding: 'utf-8' });
      const lines = flatOutput.trim().split('\n').filter(line => line.trim());
      
      // Count video entries
      const videoEntries = lines.filter(line => {
        try {
          const entry = JSON.parse(line);
          return entry._type === 'video' || (entry.id && !entry._type);
        } catch (e) {
          return false;
        }
      });
      
      return {
        title: playlistInfo.title || 'Unknown Playlist',
        count: videoEntries.length || lines.length,
        entries: videoEntries,
      };
    }
    
    return null;
  } catch (e) {
    console.log(chalk.yellow(`⚠️  Could not fetch playlist info: ${e.message}`));
    return null;
  }
}

/**
 * Convert video to MP3
 */
function convertToMp3(url, outputDir = null) {
  if (!checkYtDlp()) {
    console.log(chalk.red('❌ Error: yt-dlp not found. Install with: brew install yt-dlp'));
    process.exit(1);
  }
  
  if (outputDir === null) {
    outputDir = process.cwd();
  }
  
  // Get video info for filename
  console.log('📥 Fetching video information...');
  const videoInfo = getVideoInfo(url);
  const title = videoInfo.title;
  
  // Sanitize title for filename
  const safeTitle = title
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  // Generate short hash
  const shortHash = generateShortHash(url + title);
  const filename = `${safeTitle}_${shortHash}.mp3`;
  const outputPath = path.join(outputDir, filename);
  
  console.log(chalk.blue(`🎵 Converting to MP3: ${title}`));
  console.log(chalk.blue(`📁 Output: ${outputPath}`));
  
  const ytDlpCmd = `yt-dlp -x --audio-format mp3 --audio-quality 192K --embed-metadata --embed-thumbnail -o "${outputPath.replace('.mp3', '.%(ext)s')}" "${url}"`;
  
  try {
    execSync(ytDlpCmd, { stdio: 'inherit' });
    
    // Check if file was created
    if (existsSync(outputPath)) {
      console.log(chalk.green(`✅ Successfully converted: ${outputPath}`));
    } else {
      // Try to find the file with different extension
      const basePath = outputPath.replace('.mp3', '');
      const extensions = ['.mp3', '.m4a', '.webm', '.opus'];
      let found = false;
      
      for (const ext of extensions) {
        const testPath = basePath + ext;
        if (existsSync(testPath)) {
          if (ext !== '.mp3') {
            renameSync(testPath, outputPath);
          }
          console.log(chalk.green(`✅ Successfully converted: ${outputPath}`));
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log(chalk.yellow(`⚠️  File created but path may differ. Check: ${outputDir}`));
      }
    }
    
    return outputPath;
  } catch (e) {
    console.log(chalk.red(`❌ Error converting to MP3: ${e.message}`));
    process.exit(1);
  }
}

/**
 * Convert playlist to MP3 using yt-dlp native playlist support
 */
function convertPlaylistToMp3(url, outputDir = null) {
  if (!checkYtDlp()) {
    console.log(chalk.red('❌ Error: yt-dlp not found. Install with: brew install yt-dlp'));
    process.exit(1);
  }
  
  if (outputDir === null) {
    outputDir = process.cwd();
  }
  
  // Get playlist info for display (optional)
  console.log('📋 Fetching playlist information...');
  const playlistInfo = getPlaylistInfo(url);
  
  let playlistTitle;
  if (playlistInfo) {
    playlistTitle = playlistInfo.title;
    const totalCount = playlistInfo.count;
    console.log(chalk.blue(`📚 Playlist: ${playlistTitle}`));
    console.log(chalk.blue(`📊 Found ${totalCount} videos`));
  } else {
    playlistTitle = 'Playlist';
    console.log(chalk.blue('📚 Processing playlist...'));
  }
  
  console.log(chalk.blue(`\n🔄 Downloading entire playlist...`));
  console.log(chalk.blue(`📁 Files will be saved to: ${outputDir}`));
  console.log(chalk.blue(`📝 Each file will be named: [Video Title].mp3\n`));
  
  // Use yt-dlp's native playlist support
  // Output template: %(playlist)s/%(title)s.%(ext)s
  // This creates a folder named after the playlist and files named by title
  const outputTemplate = path.join(outputDir, '%(playlist)s', '%(title)s.%(ext)s');
  const ytDlpCmd = `yt-dlp -x --audio-format mp3 --audio-quality 192K --embed-metadata --embed-thumbnail --yes-playlist --ignore-errors -o "${outputTemplate}" "${url}"`;
  
  try {
    execSync(ytDlpCmd, { stdio: 'inherit' });
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.green('✅ Playlist download completed!'));
    console.log(chalk.blue(`📁 Files saved to: ${path.join(outputDir, playlistTitle)}`));
    console.log(chalk.cyan(`${'='.repeat(60)}`));
  } catch (e) {
    console.log(chalk.red(`\n❌ Error downloading playlist: ${e.message}`));
    console.log(chalk.yellow('💡 Some videos may have been downloaded successfully. Check the output directory.'));
    process.exit(1);
  }
}

/**
 * Convert video to text transcript using index.js
 */
function convertToTxt(url) {
  console.log('📝 Converting to text transcript using existing transcript tool...');
  
  // Get path to index.js (same directory as this script)
  const scriptPath = path.join(__dirname, 'index.js');
  
  if (!existsSync(scriptPath)) {
    console.log(chalk.red(`❌ Error: index.js not found at ${scriptPath}`));
    process.exit(1);
  }
  
  // Call index.js
  try {
    execSync(`node "${scriptPath}" "${url}"`, { stdio: 'inherit' });
    console.log(chalk.green('✅ Transcript generation completed'));
  } catch (e) {
    console.log(chalk.red(`❌ Error running index.js: ${e.message}`));
    process.exit(1);
  }
}

/**
 * Prompt user for format choice
 */
async function promptFormatChoice() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve, reject) => {
    console.log('\n📋 What would you like to convert to?');
    console.log('  1. mp3 - Single video to MP3');
    console.log('  2. mp3-playlist - Entire playlist to MP3');
    console.log('  3. txt - Video transcript (using existing tool)');
    console.log();
    
    rl.question('Enter choice (1-3): ', (answer) => {
      rl.close();
      const choice = answer.trim();
      const choiceMap = {
        '1': 'mp3',
        '2': 'mp3-playlist',
        '3': 'txt',
      };
      
      const format = choiceMap[choice];
      if (!format) {
        console.log(chalk.red('❌ Invalid choice'));
        process.exit(1);
      }
      resolve(format);
    });
  });
}

/**
 * Main function
 */
async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 convert <url> [options]')
    .command('convert <url>', 'Convert YouTube video/playlist', (yargs) => {
      yargs
        .positional('url', {
          describe: 'YouTube video or playlist URL',
          type: 'string',
        })
        .option('format', {
          alias: 'f',
          type: 'string',
          choices: ['mp3', 'mp3-playlist', 'txt'],
          describe: 'Output format (if not specified, will prompt)',
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          describe: 'Output directory (default: current directory)',
        })
    })
    .help()
    .alias('help', 'h')
    .version('1.0.0')
    .alias('version', 'v')
    .argv;
  
  if (argv._[0] !== 'convert' || !argv.url) {
    yargs.showHelp();
    process.exit(1);
  }
  
  // Sanitize URL
  const sanitizedUrl = sanitizeUrl(argv.url);
  if (sanitizedUrl !== argv.url) {
    console.log(chalk.yellow('🔧 Sanitized URL (removed escape characters)'));
  }
  
  // Determine format
  let formatChoice = argv.format;
  
  if (!formatChoice) {
    formatChoice = await promptFormatChoice();
  }
  
  // Execute conversion
  const outputDir = argv.output || null;
  
  if (formatChoice === 'mp3') {
    convertToMp3(sanitizedUrl, outputDir);
  } else if (formatChoice === 'mp3-playlist') {
    convertPlaylistToMp3(sanitizedUrl, outputDir);
  } else if (formatChoice === 'txt') {
    convertToTxt(sanitizedUrl);
  } else {
    console.log(chalk.red(`❌ Unknown format: ${formatChoice}`));
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error(chalk.red(`❌ Error: ${error.message}`));
  process.exit(1);
});

