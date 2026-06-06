// Remotion adapter render() — RFC-08 §5.
//
// bundle() once (cached) → selectComposition() with per-call metadata overrides
// → renderMedia() into a tmp file → rename to the final path. The HTML frame is
// copied into the bundle's public/ dir and handed to the bridge composition as
// inputProps.htmlSrc; the bridge keeps its CSS/GSAP animation in sync with
// Remotion's frame clock (HtmlFrameDriver.tsx).
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdtemp, mkdir, copyFile, readFile, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import type { RenderInput, RenderContext, RenderOutput } from '@html-video/core';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

// Minimal structural types for the Remotion APIs we touch (peer deps, may be absent).
type Bundler = (opts: { entryPoint: string; publicDir?: string }) => Promise<string>;
type Renderer = {
  selectComposition: (opts: {
    serveUrl: string;
    id: string;
    inputProps?: Record<string, unknown>;
  }) => Promise<{ id: string; width: number; height: number; fps: number; durationInFrames: number }>;
  renderMedia: (opts: Record<string, unknown>) => Promise<unknown>;
};

class EngineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

function loadRemotion(): { bundle: Bundler; renderer: Renderer } {
  try {
    const { bundle } = require('@remotion/bundler') as { bundle: Bundler };
    const renderer = require('@remotion/renderer') as Renderer;
    return { bundle, renderer };
  } catch (err) {
    throw new EngineError(
      'engine-not-installed',
      `Remotion is not installed. Run \`pnpm add remotion @remotion/bundler @remotion/renderer react react-dom\` in the workspace root. (${err instanceof Error ? err.message : err})`,
    );
  }
}

// bundle() is an expensive webpack build — cache it across multi-frame renders.
// Keyed by the bridge entry path (stable for a process). (RFC-08 §5 "bundle 复用")
let bundleCache: { entry: string; serveUrl: string } | undefined;

/** Locate bridge/entry — present in src during dev (ts-node/tsx) and copied to
 * the package root `bridge/` when published. We ship the .tsx; Remotion bundles it. */
function bridgeEntry(): string {
  const candidates = [
    join(here, 'bridge', 'entry.ts'), // dist/bridge if ever emitted
    join(here, '..', 'src', 'bridge', 'entry.ts'), // dist/ -> src/bridge (dev)
    join(here, '..', 'bridge', 'entry.ts'), // published package `bridge/`
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new EngineError('render-failed', `bridge entry not found (looked in: ${candidates.join(', ')})`);
}

/**
 * Make an HTML frame safe to render inside Remotion's headless chromium iframe.
 *
 * A render-blocking external `<link rel="stylesheet">` (e.g. Google Fonts) keeps
 * the iframe's render tree from painting until the stylesheet resolves. In the
 * headless render environment that request is slow or unreachable, so it never
 * resolves and Remotion screenshots a fully black frame — even though the DOM is
 * correct. (Same family as the file:// fetch issue tracked in #16/#18.)
 *
 * Video rendering must be deterministic and offline-safe, so we do NOT gamble on
 * a network font load: we convert blocking external stylesheet links into
 * non-blocking async loads (media="print" + onload swap). The font applies if it
 * arrives in time; if not, the CSS `font-family` fallback (templates declare one,
 * e.g. `'Archivo Black', sans-serif`) renders instead. Either way paint is never
 * blocked. Inline <style> and same-document CSS are untouched.
 */
export function neutralizeBlockingResources(html: string): string {
  return html.replace(
    /<link\b[^>]*\brel=(["']?)stylesheet\1[^>]*>/gi,
    (tag) => {
      // Only neutralize links to an external origin (http/https/protocol-relative).
      if (!/\bhref=(["'])(?:https?:)?\/\//i.test(tag)) return tag;
      if (/\bmedia=/i.test(tag)) return tag; // already has media handling — leave it
      // Load async (media="print" doesn't block paint), then swap to "all" onload.
      return tag.replace(
        /\s*\/?>$/,
        ` media="print" onload="this.media='all'">`,
      );
    },
  );
}

export async function render(input: RenderInput, ctx: RenderContext): Promise<RenderOutput> {
  const t0 = Date.now();
  const { bundle, renderer } = loadRemotion();
  ctx.onProgress?.(5, 'preparing');

  const { sourcePath } = input.template;
  if (!sourcePath || !existsSync(sourcePath)) {
    throw new EngineError('template-invalid', `Source HTML not found: ${sourcePath}`);
  }
  const { width, height } = input.config.resolution;
  const fps = input.config.fps || 30;
  const requested = input.config.duration === 'auto' ? 5 : Math.max(0.5, Number(input.config.duration));
  const durationInFrames = Math.max(1, Math.round(requested * fps));

  const outDir = dirname(input.config.outputPath);
  await mkdir(outDir, { recursive: true });

  // --- bundle (cached) ---
  const entry = bridgeEntry();
  if (!bundleCache || bundleCache.entry !== entry) {
    ctx.onProgress?.(15, 'bundling');
    const serveUrl = await bundle({ entryPoint: entry });
    bundleCache = { entry, serveUrl };
  }
  const serveUrl = bundleCache.serveUrl;

  // Read the HTML frame and pass its full source as inputProps. The bridge
  // renders it via iframe srcdoc — no staticFile / publicDir / serve-path
  // resolution, and srcdoc is same-origin so the per-frame animation seek works.
  const rawHtml = await readFile(sourcePath, 'utf8');
  const html = neutralizeBlockingResources(rawHtml);

  if (ctx.signal?.aborted) throw new EngineError('cancelled', 'Aborted');

  // --- select composition (override metadata per call) ---
  ctx.onProgress?.(30, 'selecting composition');
  const inputProps = { html, width, height };
  const composition = await renderer.selectComposition({ serveUrl, id: 'HtmlFrame', inputProps });
  const comp = { ...composition, width, height, fps, durationInFrames };

  // --- render to tmp, then atomic rename (RFC-01 immutability) ---
  const tmpDir = await mkdtemp(join(tmpdir(), 'hv-remotion-'));
  const tmpOut = join(tmpDir, `out.${input.config.format === 'webm' ? 'webm' : 'mp4'}`);
  const codec = input.config.format === 'webm' ? 'vp8' : input.config.format === 'gif' ? 'gif' : 'h264';

  try {
    await renderer.renderMedia({
      composition: comp,
      serveUrl,
      codec,
      outputLocation: tmpOut,
      inputProps,
      onProgress: ({ progress }: { progress: number }) => {
        // renderMedia 0..1 → our 30..90 band.
        ctx.onProgress?.(30 + Math.round(progress * 60), 'rendering');
      },
    });
    ctx.onProgress?.(92, 'finalising');
    await rename(tmpOut, input.config.outputPath).catch(async () => {
      // cross-device rename fails → copy fallback
      await copyFile(tmpOut, input.config.outputPath);
    });
  } catch (err) {
    if (ctx.signal?.aborted) throw new EngineError('cancelled', 'Aborted');
    throw new EngineError('render-failed', `Remotion renderMedia failed: ${err instanceof Error ? err.message : err}`);
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  const st = await stat(input.config.outputPath);
  ctx.onProgress?.(100, 'done');
  return {
    outputPath: resolve(input.config.outputPath),
    meta: {
      durationSec: durationInFrames / fps,
      fileSizeBytes: st.size,
      actualResolution: { width, height },
      fps,
      renderedFrames: durationInFrames,
      renderWallClockSec: (Date.now() - t0) / 1000,
      engineVersion: remotionVersion(),
    },
    diagnostics: [],
  };
}

function remotionVersion(): string {
  try {
    return (require('remotion/package.json') as { version: string }).version;
  } catch {
    return '4.x';
  }
}
