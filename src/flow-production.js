/**
 * OFF BRIEF / Google Flow — direct prompts from the approved original script.
 * This never generates media or changes the canonical episode data.
 */
export function generateGoogleFlowPrompt(episode, scene, episodeKey) {
  if (!scene) return '';
  const cast = Array.isArray(scene.cast) ? scene.cast.join(', ') : '';
  const lines = (scene.dialogue || [])
    .filter(item => item.text)
    .map(item => (item.character || 'Character') + ': "' + item.text + '"')
    .join('\n');
  const seconds = Number(scene.plannedDuration || 0);
  const frameNo = String(scene.frameId?.match(/F(\d{2})/)?.[1] || '01');
  const guidance = seconds > 8
    ? 'This beat is about ' + seconds + ' seconds. Generate connected 8-second Flow takes A and B as needed, with exact character poses, clothing, lighting and camera continuity. Do not compress all action into one rushed clip.'
    : 'Aim for the director beat of about ' + (seconds || 8) + ' seconds, allowing an extra clean editing tail.';
  return [
    'OFF BRIEF / GOOGLE FLOW',
    'EPISODE: ' + (episode?.title || episodeKey),
    'SCENE: ' + (scene.frameId || 'F' + frameNo),
    '',
    'Animate ONLY the attached approved OFF BRIEF scene image. Do not invent a new scene.',
    'Preserve every approved character exactly: Nia and Ruby have fixed faces, hair, glasses, body proportions and outfits. Keep the original set, camera framing and lighting. No additional characters. Cinematic 3D animation, 16:9 landscape.',
    '',
    'CAST: ' + cast,
    'CAMERA: ' + (scene.camera || 'Match the supplied frame'),
    'ACTION: ' + (scene.action || ''),
    'MOTION: ' + (scene.motion || 'Subtle realistic character acting'),
    'STORY BEAT: ' + (scene.beat || 'STORY'),
    '',
    'EXACT ENGLISH DIALOGUE, ONLY IF FLOW GENERATES SPEECH:',
    lines || '(This scene does not require spoken dialogue.)',
    'Do not improvise dialogue or invent voiceover. If exact dialogue cannot be spoken reliably, create the animation without speech and add the original script in Final Cut.',
    '',
    guidance,
    'Make movements physically believable and the camera deliberate. End with a stable natural reaction and an edit-friendly clean audio tail.',
    'No show intro, chapter number, logos, outro, subtitles, captions, title card or transition effect embedded in the shot. Those belong to OFF BRIEF Video Studio.',
    '',
    'FILE: OFFBRIEF_' + episodeKey + '_F' + frameNo + '_A.mp4',
    'Use _B and _C for additional connected takes, then import to this scene in Final Cut.'
  ].join('\n');
}
