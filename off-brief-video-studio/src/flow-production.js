/**
 * OFF BRIEF / Flow → Higgsfield production prompt.
 * Flow establishes the approved still; Higgsfield creates motion and lip sync.
 */
export function generateGoogleFlowPrompt(episode, scene, episodeKey) {
  if (!scene) return '';
  const cast = Array.isArray(scene.cast) ? scene.cast.join(', ') : '';
  const lines = (scene.dialogue || [])
    .filter(item => item.text)
    .map(item => (item.character || 'Character').toUpperCase() + ': "' + item.text + '"')
    .join('\n');
  const seconds = Number(scene.plannedDuration || 0);
  const match = String(scene.frameId || '').match(/S(\d{2})$/);
  const shotNo = match?.[1] || String(scene.scene || 1).padStart(2, '0');
  return [
    'OFF BRIEF / FLOW → HIGGSFIELD',
    'EPISODE: ' + (episode?.title || episodeKey),
    'SHOT: ' + (scene.frameId || 'S' + shotNo) + ' · ' + (scene.title || ''),
    '',
    'STEP 1 — GOOGLE FLOW / APPROVED STILL',
    'Use the Nia full-body + close-up references, Ruby full-body + close-up references, the approved duo reference and the OFF BRIEF studio reference.',
    'Create one clean 16:9 landscape still for this exact shot. Preserve the approved faces, hair, glasses, body proportions, outfits, set, lighting and color. Do not generate speech, motion, subtitles, logos or embedded text.',
    'CAST: ' + cast,
    'CAMERA: ' + (scene.camera || 'Match the approved reference style'),
    'ACTION AT THE FIRST FRAME: ' + (scene.action || ''),
    '',
    'STEP 2 — HIGGSFIELD / IMAGE TO VIDEO',
    'Upload the exact approved Flow still. Do not replace or redesign it.',
    'MOTION: ' + (scene.motion || 'Subtle realistic character acting'),
    'STORY BEAT: ' + (scene.beat || 'STORY'),
    'TARGET LENGTH: about ' + (seconds || 6) + ' seconds.',
    'EXACT ENGLISH LINE FOR LIP SYNC:',
    lines || '(Silent natural reaction; no spoken line.)',
    'Use restrained acting, natural blinks, believable hands, stable framing and a clean editing tail. Do not improvise words or add voiceover.',
    '',
    'AVOID: face drift, different hair, outfit changes, extra people, duplicated characters, deformed fingers, camera spins, subtitles, title cards, intro, outro or transition effects.',
    '',
    'FILE: OFFBRIEF_' + episodeKey + '_S' + shotNo + '.mp4',
    'Import this finished clip into the matching shot in OFF BRIEF Video Studio.'
  ].join('\n');
}
