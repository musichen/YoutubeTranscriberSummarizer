import React, { useState, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import CheckboxMultiSelect from './CheckboxMultiSelect.jsx';

const OPTION_DEFS = [
  {
    value: 'mp3',
    label: 'Single video → one MP3 file',
  },
  {
    value: 'mp3-playlist',
    label: 'Playlist → folder of MP3 files (playlist URLs)',
  },
  {
    value: 'txt',
    label: 'Text transcript (.txt via captions / Whisper fallback)',
  },
];

function isLikelyYoutubeUrl(raw) {
  const s = raw.trim();
  if (!s) return false;
  return /youtube\.com|youtu\.be/i.test(s);
}

function IntroScreen({ onContinue }) {
  useInput((_, key) => {
    if (key.return) onContinue();
  });
  return (
    <Box flexDirection="column">
      <Text bold color="magenta">
        YouTube tools
      </Text>
      <Box marginTop={1} marginBottom={1}>
        <Text>
          Turn a video or playlist into MP3 and/or a text transcript. Use the
          arrow keys and Space where shown.
        </Text>
      </Box>
      <Text dimColor>Press Enter to continue…</Text>
    </Box>
  );
}

function ConfirmKeys({ onBack, onStart }) {
  useInput((input, key) => {
    if (input === 'b' || input === 'B') {
      onBack();
      return;
    }
    if (key.return) {
      onStart();
    }
  });
  return null;
}

export default function App({ yttool, repoRoot, onFinished }) {
  const { exit } = useApp();
  const { sanitizeUrl, convertToMp3, convertPlaylistToMp3, convertToTxt } =
    yttool;

  const [step, setStep] = useState('intro');
  const [urlInput, setUrlInput] = useState('');
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');

  const goRun = useCallback(async () => {
    const raw = urlInput.trim();
    if (!isLikelyYoutubeUrl(raw)) {
      setError('That does not look like a YouTube link. Try again.');
      setStep('url');
      return;
    }
    if (selected.length === 0) {
      setError('Choose at least one output.');
      setStep('options');
      return;
    }

    const url = sanitizeUrl(raw);
    setError('');
    try {
      await exit();

      console.log('\n');
      console.log('─'.repeat(56));
      console.log('  YouTube tools — running your choices');
      console.log('─'.repeat(56));
      console.log(`  Project: ${repoRoot}`);
      console.log(`  Output folder (default): ${process.cwd()}/output`);
      console.log('─'.repeat(56));
      console.log('');

      const order = ['mp3', 'mp3-playlist', 'txt'];
      const tasks = order.filter((id) => selected.includes(id));
      const results = [];

      for (const id of tasks) {
        const label =
          id === 'mp3'
            ? 'MP3 (single)'
            : id === 'mp3-playlist'
              ? 'MP3 playlist'
              : 'Transcript';
        console.log(`\n▶ ${label} …\n`);
        try {
          if (id === 'mp3') convertToMp3(url, null);
          else if (id === 'mp3-playlist') convertPlaylistToMp3(url, null);
          else convertToTxt(url);
          results.push({ id, ok: true });
        } catch (e) {
          console.error(`\n✖ ${label} failed: ${e.message || e}\n`);
          results.push({ id, ok: false, err: e.message });
        }
      }

      console.log('\n' + '═'.repeat(56));
      const okCount = results.filter((r) => r.ok).length;
      if (okCount === results.length) {
        console.log('  All selected steps finished.');
      } else {
        console.log(
          `  Done with ${okCount}/${results.length} step(s) successful.`
        );
      }
      console.log('═'.repeat(56) + '\n');
    } finally {
      onFinished?.();
    }
  }, [
    exit,
    urlInput,
    selected,
    sanitizeUrl,
    convertToMp3,
    convertPlaylistToMp3,
    convertToTxt,
    repoRoot,
    onFinished,
  ]);

  if (step === 'intro') {
    return (
      <IntroScreen onContinue={() => setStep('url')} />
    );
  }

  if (step === 'url') {
    return (
      <Box flexDirection="column">
        <Text bold>Paste your YouTube link</Text>
        {error ? (
          <Box marginTop={1}>
            <Text color="red">{error}</Text>
          </Box>
        ) : null}
        <Box marginTop={1}>
          <Text color="gray">&gt; </Text>
          <TextInput
            value={urlInput}
            onChange={(v) => {
              setUrlInput(v);
              setError('');
            }}
            onSubmit={() => {
              const t = urlInput.trim();
              if (!isLikelyYoutubeUrl(t)) {
                setError('Please paste a youtube.com or youtu.be link.');
                return;
              }
              setError('');
              setStep('options');
            }}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Enter — next</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'options') {
    return (
      <Box flexDirection="column">
        <Text dimColor>
          {urlInput.trim()}
        </Text>
        <Box marginTop={1} />
        {error ? (
          <Box marginBottom={1}>
            <Text color="red">{error}</Text>
          </Box>
        ) : null}
        <CheckboxMultiSelect
          label="What do you want? (you can pick several)"
          options={OPTION_DEFS}
          value={selected}
          onChange={(v) => {
            setSelected(v);
            setError('');
          }}
          onSubmit={() => {
            if (selected.length === 0) {
              setError('Select at least one option (Space).');
              return;
            }
            setStep('confirm');
          }}
        />
      </Box>
    );
  }

  if (step === 'confirm') {
    const lines = OPTION_DEFS.filter((o) => selected.includes(o.value)).map(
      (o) => o.label
    );
    return (
      <Box flexDirection="column">
        <Text bold>Ready to run</Text>
        <Box marginTop={1}>
          <Text dimColor>{urlInput.trim()}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          {lines.map((l) => (
            <Text key={l}>
              {'  '}• {l}
            </Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Enter — start · b — back to options</Text>
        </Box>
        <ConfirmKeys
          onBack={() => setStep('options')}
          onStart={goRun}
        />
      </Box>
    );
  }

  return null;
}
