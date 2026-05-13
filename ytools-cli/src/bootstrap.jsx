import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import React from 'react';
import { render } from 'ink';
import App from './App.jsx';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
process.env.YTTOOL_ROOT = repoRoot;

const yttoolUrl = pathToFileURL(path.join(repoRoot, 'yttool.js')).href;
const yttool = await import(yttoolUrl);

await new Promise((resolve) => {
  render(
    <App yttool={yttool} repoRoot={repoRoot} onFinished={resolve} />
  );
});
