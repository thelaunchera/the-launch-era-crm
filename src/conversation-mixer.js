import './conversation-mixer.css';

/**
 * OFF BRIEF local conversation mixer.
 * Does not upload audio or synthesize voices: user imports a file per dialogue turn.
 */
const OUTPUT_RATE = 48000;
const BETWEEN_LINES = 0.35;
let previewUrl = '';
let previewAudio = null;
let currentPanel = null;

function escapeHTML(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

function validPause(value) {
  const valueNumber = Number(value);
  if (!Number.isFinite(valueNumber)) return BETWEEN_LINES;
  return Math.min(4, Math.max(0, valueNumber));
}

function releasePreview() {
  if (previewAudio) {
    previewAudio.pause();
    previewAudio.removeAttribute('src');
    previewAudio.load();
  }
  previewAudio = null;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = '';
}

async function createDialogueWav(ordered) {
  const AudioClass = window.AudioContext || window.webkitAudioContext;
  const OfflineClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioClass || !OfflineClass) {
    throw new Error('Audio mixing needs a recent Safari browser.');
  }
  const decoder = new AudioClass();
  const tracks = [];
  try {
    if (decoder.state === 'suspended') await decoder.resume();
    for (const item of ordered) {
      const blob = item.asset.blob || item.asset;
      if (!blob || typeof blob.arrayBuffer !== 'function') {
        throw new Error('Missing audio data for ' + item.name + '. Import it again.');
      }
      try {
        const decoded = await decoder.decodeAudioData(await blob.arrayBuffer());
        tracks.push({ name: item.name, buffer: decoded, pause: item.pause });
      } catch (error) {
        throw new Error('Could not decode the audio for ' + item.name + '. Use MP3, WAV or M4A.');
      }
    }
  } finally {
    if (decoder.close) await decoder.close().catch(() => {});
  }

  let position = 0.12;
  for (let i = 0; i < tracks.length; i += 1) {
    tracks[i].at = position;
    position += tracks[i].buffer.duration;
    if (i < tracks.length - 1) position += tracks[i].pause;
  }
  position += 0.18;
  if (position > 180) {
    throw new Error('This dialogue is longer than 3 minutes. Divide it into shorter scenes.');
  }

  const offline = new OfflineClass(2, Math.ceil(position * OUTPUT_RATE), OUTPUT_RATE);
  for (const track of tracks) {
    const node = offline.createBufferSource();
    node.buffer = track.buffer;
    const volume = offline.createGain();
    const fade = Math.min(0.01, track.buffer.duration / 3);
    volume.gain.setValueAtTime(0.001, track.at);
    volume.gain.linearRampToValueAtTime(1, track.at + fade);
    volume.gain.setValueAtTime(1, track.at + track.buffer.duration - fade);
    volume.gain.linearRampToValueAtTime(0.001, track.at + track.buffer.duration);
    node.connect(volume);
    volume.connect(offline.destination);
    node.start(track.at);
  }
  const rendered = await offline.startRendering();
  return { blob: encodeWave(rendered), seconds: rendered.duration };
}

function encodeWave(buffer) {
  const count = buffer.length;
  const bytes = count * 4;
  const binary = new ArrayBuffer(44 + bytes);
  const view = new DataView(binary);
  const header = (at, characters) => {
    for (let i = 0; i < characters.length; i += 1) {
      view.setUint8(at + i, characters.charCodeAt(i));
    }
  };
  header(0, 'RIFF');
  view.setUint32(4, bytes + 36, true);
  header(8, 'WAVE');
  header(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, OUTPUT_RATE, true);
  view.setUint32(28, OUTPUT_RATE * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  header(36, 'data');
  view.setUint32(40, bytes, true);

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  let peak = 0;
  for (let i = 0; i < count; i += 1) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  const gain = peak > 0.93 ? 0.93 / peak : 1;
  let at = 44;
  for (let i = 0; i < count; i += 1) {
    const l = Math.max(-1, Math.min(1, left[i] * gain));
    const r = Math.max(-1, Math.min(1, right[i] * gain));
    view.setInt16(at, Math.round(l * (l < 0 ? 32768 : 32767)), true);
    view.setInt16(at + 2, Math.round(r * (r < 0 ? 32768 : 32767)), true);
    at += 4;
  }
  return new Blob([binary], { type: 'audio/wav' });
}

function saveWave(blob, season, episode, scene) {
  const s = String(season).padStart(2, '0');
  const e = String(episode).padStart(2, '0');
  const c = String(scene).padStart(2, '0');
  const name = 'OFF_BRIEF_S' + s + 'E' + e + '_SCENE' + c + '_DIALOGUE.wav';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
}

export function mountConversationMixer(root, settings) {
  releasePreview();
  const editor = root.querySelector('.ob-two-cols .ob-sheet:last-child');
  if (!editor) return;
  const note = settings.note;
  const ordered = (Array.isArray(note.dialogues) ? note.dialogues : [])
    .filter(line => String(line.text || '').trim() || settings.audioFor(line.id))
    .map((line, index) => ({
      id: line.id,
      name: line.character || 'Narrator',
      text: line.text || '',
      pause: validPause(line.pauseAfter == null ? BETWEEN_LINES : line.pauseAfter),
      asset: settings.audioFor(line.id),
      sequence: index + 1,
      line,
    }));
  const uploaded = ordered.filter(line => Boolean(line.asset)).length;
  const panel = document.createElement('section');
  panel.className = 'ob-dialogue-mixer';
  panel.setAttribute('aria-label', 'Dialogue mix and preview');
  const turns = ordered.map(item =>
    '<div class="ob-mix-turn">' +
      '<span class="ob-mix-number">' + String(item.sequence).padStart(2, '0') + '</span>' +
      '<div class="ob-mix-dialogue">' +
        '<b>' + escapeHTML(item.name) + '</b>' +
        '<p>' + escapeHTML(item.text || 'Recorded dialogue') + '</p>' +
        '<small>' + (item.asset ? '● MP3 ready' : '○ Import voice file below') + '</small>' +
      '</div>' +
      '<label class="ob-mix-pause">Pause after' +
        '<input type="number" inputmode="decimal" min="0" max="4" step="0.1" ' +
          'aria-label="Pause after ' + escapeHTML(item.name) + '" value="' + item.pause + '" data-pause-id="' + escapeHTML(item.id) + '"/>' +
        '<span>sec</span>' +
      '</label>' +
    '</div>'
  ).join('');
  panel.innerHTML =
    '<div class="ob-mix-head">' +
      '<div><span class="ob-eyebrow">SCENE AUDIO · CONVERSATION</span>' +
        '<h3>Un diálogo, todas las voces</h3></div>' +
      '<b>' + uploaded + '/' + ordered.length + ' audios</b>' +
    '</div>' +
    '<p class="ob-mix-intro">Importa cada voz por separado abajo. Aquí se unen las frases en orden con sus pausas, como una conversación real.</p>' +
    '<div class="ob-mix-turns">' + (turns || '<p>Esta toma no tiene diálogo hablado.</p>') + '</div>' +
    '<div class="ob-mix-actions">' +
      '<button type="button" class="ob-black-button" data-mix-preview>▶ Escuchar conversación</button>' +
      '<button type="button" class="ob-neutral" data-mix-export>↓ Descargar audio unido</button>' +
      '<button type="button" class="ob-neutral" data-mix-stop>■ Detener</button>' +
    '</div>' +
    '<audio class="ob-mix-player" controls playsinline preload="none" hidden></audio>' +
    '<p class="ob-mix-message" aria-live="polite">' +
      (ordered.length === 0
        ? 'Escena sin voces. No hay nada que mezclar.'
        : uploaded < ordered.length
          ? 'Faltan ' + (ordered.length - uploaded) + ' archivo(s) de voz.'
          : 'Archivos listos para montar y escuchar.') +
    '</p>' +
    '<small class="ob-mix-foot">El archivo descargado será WAV estéreo de 48 kHz. El video MP4 se gestiona por separado.</small>';
  const lines = editor.querySelector('.ob-lines');
  if (lines) lines.insertAdjacentElement('beforebegin', panel);
  else editor.appendChild(panel);
  currentPanel = panel;

  const message = panel.querySelector('.ob-mix-message');
  const player = panel.querySelector('.ob-mix-player');
  const previewButton = panel.querySelector('[data-mix-preview]');
  const exportButton = panel.querySelector('[data-mix-export]');
  const stopButton = panel.querySelector('[data-mix-stop]');
  if (!ordered.length) {
    previewButton.disabled = true;
    exportButton.disabled = true;
  }
  for (const input of panel.querySelectorAll('[data-pause-id]')) {
    input.addEventListener('input', () => {
      const item = ordered.find(entry => entry.id === input.dataset.pauseId);
      if (!item) return;
      item.pause = validPause(input.value);
      item.line.pauseAfter = item.pause;
      settings.persist();
      message.textContent = 'Pausa guardada. Pulsa Escuchar para actualizar la mezcla.';
    });
  }
  async function process(download) {
    const missing = ordered.filter(item => !item.asset).map(item => item.name + ' ' + item.sequence);
    if (missing.length) {
      message.textContent = 'Importa estos audios antes de mezclar: ' + missing.join(', ');
      return;
    }
    previewButton.disabled = true;
    exportButton.disabled = true;
    message.textContent = 'Uniendo las voces y las pausas…';
    try {
      const wav = await createDialogueWav(ordered);
      if (currentPanel !== panel || !panel.isConnected) return;
      if (download) {
        saveWave(wav.blob, settings.season, settings.episode, settings.scene);
        message.textContent = 'WAV descargado (' + wav.seconds.toFixed(1) + ' s). Tu MP4 sigue por separado.';
      } else {
        releasePreview();
        previewUrl = URL.createObjectURL(wav.blob);
        previewAudio = player;
        player.src = previewUrl;
        player.hidden = false;
        message.textContent = 'Conversación preparada (' + wav.seconds.toFixed(1) + ' s).';
        await player.play().catch(() => {
          message.textContent = 'Audio preparado. Pulsa ▶ en el reproductor para escucharlo.';
        });
      }
    } catch (error) {
      if (currentPanel === panel) message.textContent = error.message || 'Error al mezclar audio.';
    } finally {
      if (currentPanel === panel) {
        previewButton.disabled = false;
        exportButton.disabled = false;
      }
    }
  }
  previewButton.addEventListener('click', () => process(false));
  exportButton.addEventListener('click', () => process(true));
  stopButton.addEventListener('click', () => {
    player.pause();
    player.currentTime = 0;
  });
  if (!window.__offbriefMixExitHandler) {
    window.__offbriefMixExitHandler = true;
    window.addEventListener('beforeunload', releasePreview);
  }
}
