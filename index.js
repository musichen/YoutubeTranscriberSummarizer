#!/usr/bin/env node

import { YoutubeTranscript } from 'youtube-transcript';
import { getSubtitles } from '@treeee/youtube-caption-extractor';
import puppeteer from 'puppeteer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  throw new Error('Invalid YouTube URL or video ID');
}

/**
 * Method 1: Try improved caption extractor (better than youtube-transcript)
 */
async function getTranscriptWithImprovedExtractor(videoId, options = {}) {
  try {
    const config = { videoID: videoId };
    if (options.lang) {
      config.lang = options.lang;
    }
    
    const transcript = await getSubtitles(config);
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript found');
    }
    
    // Convert to our format: array of { offset, duration, text }
    // Handle different response formats
    return transcript.map(item => {
      // Handle different field names
      const start = item.start || item.startTime || 0;
      const dur = item.dur || item.duration || 3;
      const text = item.text || item.content || '';
      
      return {
        offset: parseFloat(start) * 1000,  // Convert to ms
        duration: parseFloat(dur) * 1000,
        text: String(text).trim()
      };
    }).filter(item => item.text && item.text.length > 0);
  } catch (error) {
    throw new Error(`Improved extractor failed: ${error.message}`);
  }
}

/**
 * Method 2: Try original youtube-transcript (fallback)
 */
async function getTranscriptWithOriginal(videoId, options = {}) {
  try {
    const config = {};
    if (options.lang) {
      config.lang = options.lang;
    }
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, config);
    return transcript;
  } catch (error) {
    throw error;
  }
}

/**
 * Method 3: Browser simulation with Puppeteer (most reliable, slower)
 */
async function getTranscriptWithBrowser(videoUrl, options = {}) {
  let browser;
  try {
    console.log(chalk.yellow('   Trying browser simulation (this may take 10-30 seconds)...'));
    
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set a realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find and click "Show transcript" button
    // YouTube's UI changes frequently, so we try multiple approaches
    let transcriptOpened = false;
    
    // Approach 1: Direct transcript button (newer YouTube UI)
    const transcriptButtonSelectors = [
      'button[aria-label*="Show transcript" i]',
      'button[aria-label*="transcript" i]',
      'ytd-menu-renderer button[aria-label*="transcript" i]',
      '[data-layer-name="show-transcript-button"]',
      'button.ytd-menu-renderer',
      '#button[aria-label*="transcript"]'
    ];
    
    for (const selector of transcriptButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          transcriptOpened = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Approach 2: Try three-dot menu → Show transcript
    if (!transcriptOpened) {
      try {
        // Find the three-dot menu button
        const menuSelectors = [
          'button[aria-label*="More actions" i]',
          'ytd-menu-renderer button',
          '#button[aria-label*="More"]',
          'button[aria-label*="Action menu" i]'
        ];
        
        for (const menuSelector of menuSelectors) {
          try {
            const menuButton = await page.$(menuSelector);
            if (menuButton) {
              await menuButton.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Look for transcript option in menu
              const transcriptMenuSelectors = [
                'ytd-menu-service-item-renderer:has-text("Show transcript")',
                'ytd-menu-service-item-renderer:has-text("transcript")',
                'tp-yt-paper-listbox ytd-menu-service-item-renderer'
              ];
              
              for (const transcriptMenuSelector of transcriptMenuSelectors) {
                try {
                  const items = await page.$$('ytd-menu-service-item-renderer');
                  for (const item of items) {
                    const text = await page.evaluate(el => el.textContent, item);
                    if (text && text.toLowerCase().includes('transcript')) {
                      await item.click();
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      transcriptOpened = true;
                      break;
                    }
                  }
                  if (transcriptOpened) break;
                } catch (e) {
                  continue;
                }
              }
              if (transcriptOpened) break;
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        // Menu approach failed
      }
    }
    
    // Approach 3: Check if transcript is already visible (some videos show it by default)
    if (!transcriptOpened) {
      try {
        await page.waitForSelector('ytd-transcript-segment-renderer, ytd-transcript-body-renderer', { timeout: 3000 });
        transcriptOpened = true;
      } catch (e) {
        // Transcript not visible
      }
    }
    
    if (!transcriptOpened) {
      throw new Error('Could not open transcript panel - YouTube UI may have changed');
    }
    
    // Wait for transcript segments to load
    await page.waitForSelector('ytd-transcript-segment-renderer, ytd-transcript-body-renderer', { timeout: 10000 });
    
    const transcriptData = await page.evaluate(() => {
      // Try multiple selectors for transcript segments
      const segmentSelectors = [
        'ytd-transcript-segment-renderer',
        'ytd-transcript-body-renderer ytd-transcript-segment-renderer',
        '.ytd-transcript-segment-renderer'
      ];
      
      let segments = [];
      for (const selector of segmentSelectors) {
        segments = Array.from(document.querySelectorAll(selector));
        if (segments.length > 0) break;
      }
      
      return segments.map((seg, index) => {
        const timeEl = seg.querySelector('#time, .ytd-transcript-segment-renderer #time, [id="time"]');
        const textEl = seg.querySelector('#content, .ytd-transcript-segment-renderer #content, [id="content"]');
        
        const timeText = timeEl ? timeEl.textContent.trim() : '';
        const text = textEl ? textEl.textContent.trim() : '';
        
        // Parse time (format: "0:00" or "1:23")
        let offset = 0;
        if (timeText) {
          const parts = timeText.split(':').map(Number);
          if (parts.length === 2) {
            offset = (parts[0] * 60 + parts[1]) * 1000;
          } else if (parts.length === 3) {
            offset = (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
          }
        }
        
        return {
          offset: offset,
          duration: 3000, // Default 3s if no end time
          text: text
        };
      }).filter(item => item.text && item.text.length > 0);
    });
    
    if (transcriptData.length === 0) {
      throw new Error('No transcript segments found in browser');
    }
    
    return transcriptData;
    
  } catch (error) {
    throw new Error(`Browser simulation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Method 4: Use yt-dlp to extract subtitles (works for public captions)
 */
async function getTranscriptWithYtDlp(videoUrl, options = {}) {
  try {
    console.log(chalk.yellow('   Trying yt-dlp (extracts subtitle files directly)...'));
    
    // Check if yt-dlp is available
    try {
      execSync('which yt-dlp', { stdio: 'ignore' });
    } catch (e) {
      throw new Error('yt-dlp not found. Install with: brew install yt-dlp');
    }
    
    const videoId = extractVideoId(videoUrl);
    const lang = options.lang || 'en';
    const tempDir = path.join(process.cwd(), '.temp_ytdlp');
    
    // Create temp directory
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    const outputTemplate = path.join(tempDir, `transcript_${videoId}`);
    
    // Download subtitles with yt-dlp
    const ytDlpCmd = `yt-dlp --write-auto-sub --write-sub --sub-lang ${lang} --skip-download --sub-format vtt/srt/best -o "${outputTemplate}.%(ext)s" "${videoUrl}" 2>&1`;
    
    try {
      execSync(ytDlpCmd, { encoding: 'utf-8', stdio: 'pipe' });
    } catch (e) {
      // yt-dlp might output to stderr even on success, check for files
    }
    
    // Find the generated subtitle file
    const possibleFiles = [
      `${outputTemplate}.en.vtt`,
      `${outputTemplate}.en.srt`,
      `${outputTemplate}.${lang}.vtt`,
      `${outputTemplate}.${lang}.srt`,
      `${outputTemplate}.vtt`,
      `${outputTemplate}.srt`
    ];
    
    let subtitleFile = null;
    for (const file of possibleFiles) {
      try {
        await fs.access(file);
        subtitleFile = file;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!subtitleFile) {
      throw new Error('No subtitle file generated by yt-dlp');
    }
    
    // Parse VTT or SRT file
    const content = readFileSync(subtitleFile, 'utf-8');
    const transcript = parseSubtitleFile(content, subtitleFile.endsWith('.vtt'));
    
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
    
    if (!transcript || transcript.length === 0) {
      throw new Error('Empty transcript from yt-dlp');
    }
    
    return transcript;
    
  } catch (error) {
    throw new Error(`yt-dlp method failed: ${error.message}`);
  }
}

/**
 * Parse VTT or SRT subtitle file
 */
function parseSubtitleFile(content, isVtt = true) {
  const transcript = [];
  const lines = content.split('\n');
  
  let currentEntry = null;
  let textLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Skip VTT header
    if (isVtt && line.startsWith('WEBVTT')) continue;
    if (isVtt && line.startsWith('Kind:') || line.startsWith('Language:')) continue;
    
    // Match timestamp line (format: 00:00:00.000 --> 00:00:03.000)
    const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/);
    
    if (timeMatch) {
      // Save previous entry
      if (currentEntry && textLines.length > 0) {
        currentEntry.text = textLines.join(' ').trim();
        if (currentEntry.text) {
          transcript.push(currentEntry);
        }
      }
      
      // Parse start time
      const startHours = parseInt(timeMatch[1]);
      const startMinutes = parseInt(timeMatch[2]);
      const startSeconds = parseInt(timeMatch[3]);
      const startMs = parseInt(timeMatch[4]);
      const offset = (startHours * 3600 + startMinutes * 60 + startSeconds) * 1000 + startMs;
      
      // Parse end time
      const endHours = parseInt(timeMatch[5]);
      const endMinutes = parseInt(timeMatch[6]);
      const endSeconds = parseInt(timeMatch[7]);
      const endMs = parseInt(timeMatch[8]);
      const endOffset = (endHours * 3600 + endMinutes * 60 + endSeconds) * 1000 + endMs;
      
      currentEntry = {
        offset: offset,
        duration: endOffset - offset,
        text: ''
      };
      textLines = [];
    } else if (currentEntry && line && !line.match(/^\d+$/)) {
      // Text line (skip sequence numbers)
      // Clean VTT tags like <c>text</c>
      const cleanText = line.replace(/<[^>]+>/g, '').trim();
      if (cleanText) {
        textLines.push(cleanText);
      }
    }
  }
  
  // Save last entry
  if (currentEntry && textLines.length > 0) {
    currentEntry.text = textLines.join(' ').trim();
    if (currentEntry.text) {
      transcript.push(currentEntry);
    }
  }
  
  return transcript;
}

/**
 * Fetch transcript from YouTube (tries multiple methods)
 */
async function getTranscript(videoUrl, options = {}) {
  const videoId = extractVideoId(videoUrl);
  console.log(chalk.blue(`📹 Fetching transcript for video: ${videoId}`));
  
  const methods = [
    { name: 'Improved extractor', fn: () => getTranscriptWithImprovedExtractor(videoId, options) },
    { name: 'Original extractor', fn: () => getTranscriptWithOriginal(videoId, options) },
    { name: 'yt-dlp', fn: () => getTranscriptWithYtDlp(videoUrl, options) },  // NEW - Add before Puppeteer
    { name: 'Browser simulation', fn: () => getTranscriptWithBrowser(videoUrl, options) }
  ];
  
  let lastError;
  
  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    try {
      if (i > 0) {
        console.log(chalk.yellow(`\n   Method ${i} failed, trying ${method.name}...`));
      }
      const transcript = await method.fn();
      if (transcript && transcript.length > 0) {
        if (i > 0) {
          console.log(chalk.green(`✓ Success with ${method.name}!`));
        }
        return transcript;
      }
    } catch (error) {
      lastError = error;
      // Continue to next method
      continue;
    }
  }
  
  // All methods failed
  const errorMsg = lastError?.message || 'All methods failed';
  throw new Error(`TRANSCRIPT_NOT_ACCESSIBLE: ${errorMsg}\n\nTried 4 different methods:\n1. Improved caption extractor\n2. Original youtube-transcript\n3. yt-dlp (subtitle download)\n4. Browser simulation\n\nAll failed - YouTube has restricted transcript access.`);
}

/**
 * Format transcript with different output styles
 */
function formatTranscript(transcript, format = 'text') {
  switch (format) {
    case 'text':
      return transcript.map(item => item.text).join(' ');
    
    case 'timestamped':
      return transcript.map(item => {
        const time = formatTime(item.offset / 1000);
        return `[${time}] ${item.text}`;
      }).join('\n');
    
    case 'srt':
      return transcript.map((item, index) => {
        const start = formatSrtTime(item.offset);
        const end = formatSrtTime(item.offset + item.duration);
        return `${index + 1}\n${start} --> ${end}\n${item.text}\n`;
      }).join('\n');
    
    case 'json':
      return JSON.stringify(transcript, null, 2);
    
    default:
      return transcript.map(item => item.text).join(' ');
  }
}

/**
 * Format seconds to HH:MM:SS
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format milliseconds to SRT time format (HH:MM:SS,mmm)
 */
function formatSrtTime(milliseconds) {
  const totalSeconds = milliseconds / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor(milliseconds % 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Save transcript to file
 */
async function saveToFile(content, outputPath, format) {
  const extension = format === 'json' ? 'json' : format === 'srt' ? 'srt' : 'txt';
  const filename = outputPath || `transcript_${Date.now()}.${extension}`;
  
  await fs.writeFile(filename, content, 'utf-8');
  return filename;
}

/**
 * Main CLI function
 */
async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <url> [options]')
    .command('$0 <url>', 'Extract transcript from YouTube video', (yargs) => {
      yargs.positional('url', {
        describe: 'YouTube video URL or video ID',
        type: 'string'
      });
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output file path (auto-generates if not specified)'
    })
    .option('format', {
      alias: 'f',
      type: 'string',
      choices: ['text', 'timestamped', 'srt', 'json'],
      default: 'text',
      description: 'Output format'
    })
    .option('lang', {
      alias: 'l',
      type: 'string',
      description: 'Language code (e.g., en, es, fr, zh)'
    })
    .option('print', {
      alias: 'p',
      type: 'boolean',
      default: true,
      description: 'Print transcript to console'
    })
    .option('whisper', {
      alias: 'w',
      type: 'boolean',
      default: false,
      description: 'Use Whisper for transcription (requires Python setup)'
    })
    .example('$0 "https://www.youtube.com/watch?v=dQw4w9WgXcQ"', 'Extract transcript')
    .example('$0 dQw4w9WgXcQ -f timestamped -o output.txt', 'Timestamped format')
    .example('$0 "https://youtu.be/dQw4w9WgXcQ" -f srt', 'Generate SRT subtitles')
    .help()
    .alias('help', 'h')
    .version('1.0.0')
    .alias('version', 'v')
    .argv;

  try {
    const { url, output, format, lang, print: shouldPrint, whisper } = argv;
    const videoUrl = url; // Store for error messages

    if (whisper) {
      console.log(chalk.yellow('⚠️  Whisper mode requires Python setup. Run: python3 whisper_transcribe.py'));
      console.log(chalk.yellow('    See README.md for installation instructions.'));
      process.exit(1);
    }

    // Fetch transcript
    console.log(chalk.blue('🚀 Starting transcript extraction...\n'));
    const transcript = await getTranscript(videoUrl, { lang });
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript found for this video');
    }

    console.log(chalk.green(`✓ Successfully extracted ${transcript.length} caption segments\n`));

    // Format transcript
    const formattedTranscript = formatTranscript(transcript, format);

    // Print to console
    if (shouldPrint) {
      console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.cyan('TRANSCRIPT:'));
      console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
      console.log(formattedTranscript);
      console.log('\n');
    }

    // Save to file if output specified or auto-generate
    if (output || !shouldPrint) {
      const savedPath = await saveToFile(formattedTranscript, output, format);
      console.log(chalk.green(`✓ Transcript saved to: ${savedPath}`));
    }

    // Stats
    const wordCount = formattedTranscript.split(/\s+/).length;
    const duration = transcript[transcript.length - 1]?.offset / 1000 || 0;
    console.log(chalk.gray(`\n📊 Stats: ${wordCount} words | ${formatTime(duration)} duration`));
    
  } catch (error) {
    const errorMsg = error.message || String(error);
    console.error(chalk.red(`\n❌ Error: ${errorMsg.split('\n')[0]}`));
    
    // Better error messages with explanations
    if (errorMsg.includes('TRANSCRIPT_NOT_ACCESSIBLE') || 
        errorMsg.includes('No transcript found') ||
        errorMsg.includes('transcript is not accessible')) {
      
      console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.yellow('💡 What we tried:'));
      console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.yellow('   1. Improved caption extractor (@treeee/youtube-caption-extractor)'));
      console.log(chalk.yellow('   2. Original youtube-transcript package'));
      console.log(chalk.yellow('   3. yt-dlp (subtitle download)'));
      console.log(chalk.yellow('   4. Browser simulation with Puppeteer'));
      console.log('');
      console.log(chalk.yellow('💡 Why this happens:'));
      console.log(chalk.yellow('   • YouTube has restricted their transcript API (late 2024-2025)'));
      console.log(chalk.yellow('   • Requires authentication/cookies for many videos'));
      console.log(chalk.yellow('   • Anti-bot measures block automated access'));
      console.log(chalk.yellow('   • Even videos with visible captions may not be accessible via API'));
      console.log('');
      console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.cyan('✅ Solutions (ranked by reliability):'));
      console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log('');
      console.log(chalk.green('Option 1: Whisper AI (RECOMMENDED - works for ANY video):'));
      console.log(chalk.white('   source whisper-env/bin/activate'));
      console.log(chalk.white(`   python3 whisper_transcribe.py "${argv.url}"`));
      console.log('');
      console.log(chalk.green('Option 2: yt-dlp (if captions are public):'));
      console.log(chalk.white(`   yt-dlp --write-auto-sub --skip-download -o transcript "${argv.url}"`));
      console.log(chalk.white('   # Output: transcript.en.vtt or transcript.en.srt'));
      console.log('');
      console.log(chalk.gray('   Or if you haven\'t set up Whisper yet:'));
      console.log(chalk.gray('   ./setup.sh  # Follow prompts to install Whisper'));
      
    } else if (errorMsg.includes('API_ERROR')) {
      console.log(chalk.yellow('\n💡 The YouTube transcript API returned an error.'));
      console.log(chalk.yellow('   This could be due to:'));
      console.log(chalk.yellow('   • YouTube API changes or restrictions'));
      console.log(chalk.yellow('   • Network issues'));
      console.log(chalk.yellow('   • Video-specific restrictions'));
      console.log('');
      console.log(chalk.cyan('💡 Solution: Use Whisper AI transcription instead:'));
      console.log(chalk.white('   source whisper-env/bin/activate'));
      console.log(chalk.white(`   python3 whisper_transcribe.py "${argv.url}"`));
      
    } else if (errorMsg.includes('does not have captions')) {
      console.log(chalk.yellow('\n💡 Tip: Try using the Python + Whisper script for videos without captions:'));
      console.log(chalk.yellow(`    python3 whisper_transcribe.py "${argv.url}"`));
    } else {
      // Generic error - still suggest Whisper
      console.log(chalk.yellow('\n💡 Alternative: Use Whisper AI transcription (works for any video):'));
      console.log(chalk.white('   source whisper-env/bin/activate'));
      console.log(chalk.white(`   python3 whisper_transcribe.py "${argv.url}"`));
    }
    
    process.exit(1);
  }
}

// Run the CLI
main();

