/**
 * Resolve ffmpeg: system PATH first, then the bundled ffmpeg-static binary.
 * Studio on Windows often has no global ffmpeg; the monorepo ships one via pnpm.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let cached: string | null = null;

function findOnPath(): string | null {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('where.exe', ['ffmpeg'], { encoding: 'utf8', timeout: 3000 });
      const line = out
        .trim()
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find(Boolean);
      if (line && existsSync(line)) return line;
    } else {
      const out = execFileSync('which', ['ffmpeg'], { encoding: 'utf8', timeout: 3000 }).trim();
      if (out && existsSync(out)) return out;
    }
  } catch {
    /* not on PATH */
  }
  return null;
}

function findBundled(): string | null {
  try {
    const p = require('ffmpeg-static') as string | null | undefined;
    if (typeof p === 'string' && p.length > 0 && existsSync(p)) return p;
  } catch {
    /* package not installed */
  }
  return null;
}

/** Absolute path to ffmpeg, or the string `ffmpeg` (PATH lookup) as last resort. */
export function resolveFfmpegBinary(): string {
  if (cached) return cached;
  cached = findOnPath() ?? findBundled() ?? 'ffmpeg';
  return cached;
}

export function ffmpegMissingMessage(): string {
  if (process.platform === 'win32') {
    return (
      'ffmpeg not found. Run `pnpm install` in the html-video repo (bundles ffmpeg-static), ' +
      'or install ffmpeg and add it to PATH (e.g. winget install ffmpeg).'
    );
  }
  if (process.platform === 'darwin') {
    return 'ffmpeg not found. Run `pnpm install` in the repo, or `brew install ffmpeg`.';
  }
  return 'ffmpeg not found. Run `pnpm install` in the repo, or install ffmpeg via your package manager.';
}
