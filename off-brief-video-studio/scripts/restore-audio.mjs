import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Restore the user-supplied original 2:33 MP3 from Git-stored Base64 pieces.
// This preserves its bytes, rather than recompressing or changing the music.
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const sourceDir=join(root,'assets','audio');
const encoded=await Promise.all(Array.from({length:13},(_,i)=>
  readFile(join(sourceDir,'part-'+String(i).padStart(2,'0')+'.b64'),'utf8')
));
const sound=Buffer.from(encoded.join(''),'base64');
const sha256=x=>createHash('sha256').update(x).digest('hex');
const expectedMp3Sha='fda04cb4597c1ffd80d14ce82a74f6938c657952647dc50889138cd3e4903034';
if(sound.length!==4898780||sha256(sound)!==expectedMp3Sha)
  throw new Error('The user-provided OFF BRIEF background track is incomplete or corrupted.');
const destination=join(root,'public','audio','offbrief-series-background.mp3');
await mkdir(dirname(destination),{recursive:true});
await writeFile(destination,sound);

// Presentation cue remains the original unmodified WAV in Git. Its first
// five seconds play at the official visual intro; playback fades at the end.
const jingle=await readFile(join(root,'public','audio','offbrief-presentation-sound.wav'));
const expectedJingleSha='6eab4a47ba35605a1f16e3c58de0f9047c4e41c11300707ba2969e82fe43de25';
if(jingle.length!==1325622||sha256(jingle)!==expectedJingleSha)
  throw new Error('The user-provided OFF BRIEF presentation sound is incorrect.');
console.log('OFF BRIEF original background (2:33) and presentation sound (7.5s) verified.');
