import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Restore exact user-supplied files without compression or re-encoding.
// Integrity checks prevent the app from publishing partial or incorrect music.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'assets', 'audio');
const destination = join(root, 'public', 'audio');
await mkdir(destination, { recursive: true });
const sha256 = data => createHash('sha256').update(data).digest('hex');

async function restore({ basename, prefix, count, length, sha }) {
  const pieces = await Promise.all(Array.from({ length: count }, (_, i) =>
    readFile(join(source, prefix + String(i).padStart(2, '0') + '.b64'), 'utf8')
  ));
  const audio = Buffer.from(pieces.join(''), 'base64');
  if (audio.length !== length || sha256(audio) !== sha) {
    throw new Error(`OFF BRIEF ${basename} sound did not pass integrity checks.`);
  }
  await writeFile(join(destination, basename), audio);
  console.log(`Verified and restored ${basename}: ${audio.length} original bytes.`);
}

await restore({
  basename: 'offbrief-series-background.mp3',
  prefix: 'part-',
  count: 13,
  length: 4898780,
  sha: 'fda04cb4597c1ffd80d14ce82a74f6938c657952647dc50889138cd3e4903034'
});
await restore({
  basename: 'offbrief-presentation-sound.wav',
  prefix: 'presentation-part-',
  count: 4,
  length: 1325622,
  sha: '6eab4a47ba35605a1f16e3c58de0f9047c4e41c11300707ba2969e82fe43de25'
});
console.log('OFF BRIEF: two official sounds ready for Google Flow / Final Cut.');
