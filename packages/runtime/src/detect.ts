import { execFile } from 'node:child_process';
import { accessSync, constants, existsSync } from 'node:fs';
import { promisify } from 'node:util';
import { AGENT_DEFS } from './registry.js';
import type { AgentDef, DetectedAgent } from './types.js';

const exec = promisify(execFile);

/** npm global bins on Windows ship as foo + foo.cmd; spawn needs the .cmd. */
export function normalizeWindowsBin(binPath: string): string {
  if (process.platform !== 'win32') return binPath;
  const lower = binPath.toLowerCase();
  if (lower.endsWith('.exe') || lower.endsWith('.cmd') || lower.endsWith('.bat')) {
    return binPath;
  }
  const cmd = `${binPath}.cmd`;
  if (existsSync(cmd)) return cmd;
  const exe = `${binPath}.exe`;
  if (existsSync(exe)) return exe;
  return binPath;
}

/** Child-process options for Windows .cmd/.bat npm shims. */
export function spawnShellOptions(binPath: string): { shell?: boolean } {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(binPath)) {
    return { shell: true };
  }
  return {};
}

async function which(bin: string): Promise<string | null> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await exec('where.exe', [bin], { timeout: 2000 });
      const lines = stdout
        .trim()
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const cmd = lines.find((l) => l.toLowerCase().endsWith('.cmd'));
      if (cmd) return cmd;
      const exe = lines.find((l) => l.toLowerCase().endsWith('.exe'));
      if (exe) return exe;
      const first = lines[0];
      return first ? normalizeWindowsBin(first) : null;
    }
    const { stdout } = await exec('which', [bin], { timeout: 2000 });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/** PATH → static binFallbacks → async resolveBinFallback (e.g. bundled npm pkg). */
export async function resolveBin(def: AgentDef): Promise<string | null> {
  for (const name of [def.bin, ...(def.altBins ?? [])]) {
    const onPath = await which(name);
    if (onPath) return normalizeWindowsBin(onPath);
  }
  for (const candidate of def.binFallbacks ?? []) {
    try {
      accessSync(candidate, constants.F_OK);
      return normalizeWindowsBin(candidate);
    } catch {
      /* not there / not executable — try next */
    }
  }
  if (def.resolveBinFallback) {
    try {
      const resolved = await def.resolveBinFallback();
      if (resolved) {
        accessSync(resolved, constants.F_OK);
        return normalizeWindowsBin(resolved);
      }
    } catch {
      /* resolver threw or path not runnable — treat as not found */
    }
  }
  return null;
}

async function probeVersion(bin: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await exec(bin, args, {
      timeout: 5000,
      ...spawnShellOptions(bin),
    });
    return stdout.trim().split('\n')[0] ?? null;
  } catch {
    return null;
  }
}

export async function detectOne(def: AgentDef): Promise<DetectedAgent> {
  // ---- HTTP agents (anthropic-api etc) ----
  if (def.kind === 'http') {
    const probe = def.httpProbe ? await def.httpProbe() : { available: false };
    return {
      id: def.id,
      name: def.name,
      bin: def.bin,
      available: probe.available,
      ...(probe.version !== undefined && { version: probe.version }),
      ...(def.installUrl !== undefined && { installUrl: def.installUrl }),
    };
  }
  const path = await resolveBin(def);
  if (!path) {
    return {
      id: def.id,
      name: def.name,
      bin: def.bin,
      available: false,
      ...(def.unavailableHint !== undefined && { hint: def.unavailableHint }),
      ...(def.installUrl !== undefined && { installUrl: def.installUrl }),
    };
  }
  let version = await probeVersion(path, def.versionArgs);
  // Found on disk — but some agents need a further gate (e.g. AMR login state).
  if (def.extraDetect) {
    const extra = await def.extraDetect(path);
    if (extra.version !== undefined && extra.version !== null) version = extra.version;
    return {
      id: def.id,
      name: def.name,
      bin: def.bin,
      available: extra.available,
      path,
      version,
      ...(extra.hint !== undefined && { hint: extra.hint }),
      ...(def.installUrl !== undefined && { installUrl: def.installUrl }),
    };
  }
  return {
    id: def.id,
    name: def.name,
    bin: def.bin,
    available: true,
    path,
    version,
    ...(def.installUrl !== undefined && { installUrl: def.installUrl }),
  };
}

// In-process cache. Agent install state doesn't change inside one server
// run, so spawning `which` + `<bin> --version` on every /api/agents request
// (~400ms total for two agents) is wasted latency that blocks the studio
// composer on first paint. TTL guards against the rare "user installed mid-
// session" case.
const DETECT_TTL_MS = 5 * 60 * 1000;
let detectCache: { ts: number; result: DetectedAgent[] } | null = null;

export async function detectAll(opts?: { force?: boolean }): Promise<DetectedAgent[]> {
  const now = Date.now();
  if (!opts?.force && detectCache && now - detectCache.ts < DETECT_TTL_MS) {
    return detectCache.result;
  }
  const result = await Promise.all(AGENT_DEFS.map(detectOne));
  detectCache = { ts: now, result };
  return result;
}
