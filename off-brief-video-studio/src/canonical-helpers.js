import { SHORT_EPISODES, SHORT_CAST } from './short-production.js';

export const CANON_EPISODES = SHORT_EPISODES;
export const CANON_CAST = SHORT_CAST;

export function canonicalShot(episode, scene) {
  const ep = CANON_EPISODES.find(item => Number(item.episode) === Number(episode));
  return ep?.scenes[Number(scene) - 1] || null;
}

export function masterAnimationPrompt(episode, scene) {
  const ep = CANON_EPISODES.find(item => Number(item.episode) === Number(episode));
  const shot = canonicalShot(episode, scene);
  if (!ep || !shot) return '';
  const dialogue = shot.dialogue.map(line =>
    line.character.toUpperCase() + ': ' + line.text
  ).join('\n');
  return [
    'OFF BRIEF · FLOW TO HIGGSFIELD SHOT PROMPT',
    'SEASON 01 / EPISODE ' + String(ep.episode).padStart(2, '0') +
      ' / SHOT ' + String(scene).padStart(2, '0'),
    'FIRST FRAME: Build or approve one 16:9 still in Google Flow using the OFF BRIEF master references. Then upload that exact still to Higgsfield. Do not redesign the characters between tools.',
    'REFERENCE LOCK: Nia must keep her exact approved face, long dark side braid, gold hoops and royal-blue blazer. Ruby must keep her exact approved face, copper-red curly updo, round glasses and green overshirt. Keep their ages, proportions, skin tones, clothing, set, props and lighting consistent.',
    'ON CAMERA: ' + (shot.cast.length ? shot.cast.join(', ') : 'No visible cast.'),
    'LOCATION: ' + (shot.location || 'OFF BRIEF creative studio'),
    'SHOT: ' + shot.title,
    'CAMERA: ' + shot.camera,
    'ACTION: ' + shot.action,
    'MOTION: ' + shot.motion,
    'STORY BEAT: ' + shot.beat + ' · target ' + shot.plannedDuration + ' seconds.',
    'EXACT ENGLISH DIALOGUE FOR HIGGSFIELD LIP SYNC:\n' +
      (dialogue || 'No spoken line. Use a silent natural reaction.'),
    'FLOW OUTPUT: one clean 16:9 still only. No speech, captions, logos or embedded text.',
    'HIGGSFIELD OUTPUT: one short image-to-video take. Use restrained natural acting, clean lip sync to the exact line, believable anatomy and hands, and a stable edit-friendly ending.',
    'AVOID: face drift, hair changes, outfit changes, extra people, duplicate characters, extra fingers, distorted products, random props, subtitles, invented words, camera spins or exaggerated expressions.',
    'FINAL: 16:9 landscape. Keep each shot separate; assemble the three shots and the existing OFF BRIEF intro in the Studio.'
  ].join('\n\n');
}

export function hydrateCanonicalNote(saved, episode, scene, hasAudio = () => false) {
  const shot = canonicalShot(episode, scene);
  if (!shot) return saved || { duration: '', motion: '', notes: '', dialogues: [] };
  const defaults = {
    duration: shot.plannedDuration,
    motion: masterAnimationPrompt(episode, scene),
    notes: 'SHORT EPISODE · ' + shot.title + '\n' +
      'Action: ' + shot.action + '\nCamera: ' + shot.camera,
    dialogues: shot.dialogue.map(line => ({ ...line })),
    _canonSeeded: true,
  };
  if (!saved) return defaults;
  if (saved._canonSeeded) return saved;

  const previous = Array.isArray(saved.dialogues) ? saved.dialogues : [];
  const known = new Set(shot.dialogue.map(line => line.id));
  const primary = shot.dialogue.map(line => {
    const existing = previous.find(old => old.id === line.id);
    return existing ? {
      ...line,
      ...existing,
      text: String(existing.text || '').trim() ? existing.text : line.text,
    } : { ...line };
  });
  const additional = previous.filter(line => {
    if (known.has(line.id)) return false;
    if (String(line.text || '').trim()) return true;
    if (hasAudio(line.id)) return true;
    return !['nia', 'ruby'].includes(line.id);
  });
  saved.dialogues = [...primary, ...additional];
  if (!String(saved.motion || '').trim()) saved.motion = defaults.motion;
  if (!String(saved.notes || '').trim()) saved.notes = defaults.notes;
  if (saved.duration == null || saved.duration === '') saved.duration = shot.plannedDuration;
  saved._canonSeeded = true;
  return saved;
}
