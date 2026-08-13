'use client';

import type { FFmpeg } from '@ffmpeg/ffmpeg';

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;   // 50 MB — auto-compress above this
export const MAX_HARD_LIMIT_BYTES = 150 * 1024 * 1024; // 150 MB — hard reject above this

// Singleton — loads FFmpeg WASM once (~30 MB, cached by browser after first load)
let _ffmpeg: FFmpeg | null = null;
let _loadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg) return _ffmpeg;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const instance = new FFmpeg();
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    await instance.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    _ffmpeg = instance;
    return instance;
  })();

  return _loadPromise;
}

/**
 * Compress a video file using FFmpeg.wasm.
 * Strategy: tries CRF 18 (near-lossless) → 23 → 28,
 * stopping as soon as the file is under MAX_UPLOAD_BYTES.
 */
export async function compressVideo(
  file: File | Blob,
  onProgress: (p: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  const handler = ({ progress }: { progress: number }) =>
    onProgress(Math.round(Math.min(progress * 100, 99)));

  ffmpeg.on('progress', handler);

  try {
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));

    const crfLevels = [18, 23, 28]; // 18 = near-lossless, 28 = noticeable but small
    for (const crf of crfLevels) {
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-c:v', 'libx264', '-crf', String(crf), '-preset', 'fast',
        '-c:a', 'aac', '-b:a', '256k',
        '-movflags', '+faststart',
        '-y', 'output.mp4',
      ]);

      const data = (await ffmpeg.readFile('output.mp4')) as Uint8Array;
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });

      if (blob.size < MAX_UPLOAD_BYTES || crf === crfLevels[crfLevels.length - 1]) {
        return blob;
      }
    }

    throw new Error('Could not compress video under 50 MB.');
  } finally {
    ffmpeg.off('progress', handler);
  }
}

/**
 * Compress an audio file using FFmpeg.wasm.
 * Strategy: tries 320k → 256k → 192k → 128k AAC,
 * stopping as soon as the file is under MAX_UPLOAD_BYTES.
 */
export async function compressAudio(
  file: File | Blob,
  onProgress: (p: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  const handler = ({ progress }: { progress: number }) =>
    onProgress(Math.round(Math.min(progress * 100, 99)));

  ffmpeg.on('progress', handler);

  try {
    const ext = file instanceof File ? (file.name.split('.').pop() ?? 'mp3') : 'mp3';
    const inputName = `input.${ext}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const bitrates = ['320k', '256k', '192k', '128k'];
    for (const bitrate of bitrates) {
      await ffmpeg.exec([
        '-i', inputName,
        '-c:a', 'aac', '-b:a', bitrate,
        '-y', 'output.aac',
      ]);

      const data = (await ffmpeg.readFile('output.aac')) as Uint8Array;
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/aac' });

      if (blob.size < MAX_UPLOAD_BYTES || bitrate === bitrates[bitrates.length - 1]) {
        return blob;
      }
    }

    throw new Error('Could not compress audio under 50 MB.');
  } finally {
    ffmpeg.off('progress', handler);
  }
}
