import { CANON_EPISODES, CANON_CAST } from './canonical-production.js';

export { CANON_EPISODES, CANON_CAST };

export function canonicalShot(episode, scene) {
  const index = Number(episode) - 1;
  return CANON_EPISODES[index]?.scenes[Number(scene) - 1] || null;
}

export function masterAnimationPrompt(episode, scene) {
  const ep = CANON_EPISODES[Number(episode) - 1];
  const shot = canonicalShot(episode, scene);
  if (!ep || !shot) return '';
  const dialogue = shot.dialogue.map(line =>
    line.character.toUpperCase() + ': ' + line.text
  ).join('\n');
  return [
    'OFF BRIEF · IMAGE-TO-VIDEO MASTER PROMPT',
    'SEASON ' + String(ep.season).padStart(2, '0') +
      ' / EPISODE ' + String(ep.episode).padStart(2, '0') +
      ' / SHOT ' + String(scene).padStart(2, '0'),
    'Use the exact real approved image for ' + shot.frameId +
      ' as the starting frame, NOT an AI substitute or newly designed character. ' +
      (ep.season === 2
        ? 'Season 2 stills are NOT uploaded to this separate Video Studio yet. Obtain and approve the original frame before animation.'
        : 'Use the F' + String(scene).padStart(2, '0') + ' image from this exact episode once imported.'),
    'STYLE LOCK: Premium original cinematic 3D adult workplace comedy. Original Nia: exact face, long dark side braid, gold hoops, controlled dry reactions. Original Ruby: exact face, copper-red curly high updo, round glasses, lively reactions. Every supporting cast member must use THEIR OWN approved character reference. Keep all episode-specific costumes and hair, face proportions, ages, skin tones, eye lines, props and environment unchanged.',
    'ON CAMERA: ' + (shot.cast.length ? shot.cast.join(', ') : 'No visible cast. Do not add people.'),
    'LOCATION: ' + (shot.location || 'Match the exact original approved reference image.'),
    'ORIGINAL SHOT DESCRIPTION: ' + shot.title,
    'CAMERA AND FRAMING: ' + shot.camera,
    'SOURCE-SCRIPTED ACTION: ' + shot.action,
    'MOTION DIRECTION: ' + shot.motion,
    shot.dialogueCue ? 'PERFORMANCE CUE: ' + shot.dialogueCue : '',
    'STORY BEAT: ' + shot.beat +
      ' / Editing slot approximately ' + shot.plannedDuration + ' seconds.',
    'Create multiple short 4–8-second image-to-video takes when necessary and assemble them in the editor. Do not force a long conversation into a single generation or pretend the tool automatically edits the full episode.',
    'ORIGINAL APPROVED ENGLISH DIALOGUE FOR TIMING ONLY:\n' +
      (dialogue || 'No spoken lines assigned to this shot. Use a silent natural reaction.'),
    'AUDIO: The visual-generation model must generate NO speech, no invented words, no music, no fake lip-sync, no subtitles. Record the exact source dialogue separately as original authorized English character voices and attach the correct audio below each line in the scene editor.',
    'MOTION QUALITY: natural blinks and breathing, one subtle plausible gesture, believable anatomy and fingers, consistent lighting, controlled slow push/pan or stable camera. No face morphing, new people, extra hands, duplicate actors, changed products, random props, added captions, camera spinning or distorted expressions.',
    'OUTPUT: one 16:9 cinematic take, 1920x1080, 24 fps, H.264 MP4. Reuse the same approved image for any later portrait crop; do not regenerate characters.',
  ].filter(Boolean).join('\n\n');
}

export function hydrateCanonicalNote(saved, episode, scene, hasAudio = () => false) {
  const shot = canonicalShot(episode, scene);
  if (!shot) return saved || { duration: '', motion: '', notes: '', dialogues: [] };
  const defaults = {
    duration: shot.plannedDuration,
    motion: masterAnimationPrompt(episode, scene),
    notes: 'ORIGINAL PRIVATE STUDIO · ' + shot.title + '\n' +
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
