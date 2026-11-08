import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// A verified Base64-encoded copy of the owner-approved 5s intro.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const directory = join(root, 'assets', 'intro');
const pieces = await Promise.all(
  Array.from({ length: 17 }, (_, index) =>
    readFile(join(directory, 'part-' + String(index).padStart(2, '0') + '.b64'), 'utf8')
  )
);
const video = Buffer.from(pieces.join(''), 'base64');
const digest = createHash('sha256').update(video).digest('hex');
const expected = '4472a53abb0b50bc3a18868266efad07d78ade6913178f6ee8c6cda8d10eb644';
if (digest !== expected || video.length !== 6318907) {
  throw new Error('OFF BRIEF intro mismatch: refusing to use wrong media.');
}
const destination = join(root, 'public', 'resources', 'offbrief-official-universal-intro.mp4');
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, video);
console.log('OFF BRIEF intro checksum verified; 5-second original restored.');
