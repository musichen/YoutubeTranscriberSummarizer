# Contributing to YouTube Transcript Extractor

## Setup

Python 3.12 is required (3.13+ is not compatible, see the README). The README install sections use pyenv:

```bash
# follow PYENV_SETUP.md, then verify:
python --version   # must show 3.12.x
```

Node entry point is `index.js` (`npm start` and `npm run transcribe` both run `node index.js`).

## Test manually

Run the extractor on a short public video and confirm you get a transcript and, where the method supports it, a summary. State the video and the transcript method you used in the PR. `TRANSCRIPT_METHODS.md` explains each method, and `examples.sh` in the sibling tooling shows example invocations.

## Pull requests

Create a branch from `main`, keep the change focused, and update `README.md` or the setup guides (`QUICKSTART.md`, `PYENV_SETUP.md`, `TRANSCRIPT_METHODS.md`) when behavior changes.
