(function offBriefStudio() {
  'use strict';
  const root = document.getElementById('app');
  const EPISODES = [
    {
      "no": 1,
      "title": "The Viral Emergency",
      "drive": "https://drive.google.com/drive/folders/1SOjQOVRq2HoFczfVANGPWNggM0FtaPMX"
    },
    {
      "no": 2,
      "title": "The Client Said Beige",
      "drive": "https://drive.google.com/drive/folders/1H9ZVmc1t3wPrR81J2l497hpkjCn8WGan"
    },
    {
      "no": 3,
      "title": "Influencer for a Day",
      "drive": "https://drive.google.com/drive/folders/1XDkFyE5RF6ryWUi1_U_juPcrpkCxTz9K"
    },
    {
      "no": 4,
      "title": "The AI Intern",
      "drive": "https://drive.google.com/drive/folders/1uW3IIoSLqUKoF_m-w_FIMsNMuufh3Pas"
    },
    {
      "no": 5,
      "title": "One Product, 100 Photos",
      "drive": "https://drive.google.com/drive/folders/1NqeHhEpQyPLUNYOhk0A4CKufywz3Z2Pz"
    },
    {
      "no": 6,
      "title": "The Competitor",
      "drive": "https://drive.google.com/drive/folders/1N_TxxJn5XVk5DZqGHnj-QX9TmtbV8Kqm"
    },
    {
      "no": 7,
      "title": "The Biggest Pitch",
      "drive": "https://drive.google.com/drive/folders/1nQo8EOZEFOeqLZWbbQBr0DOp5ZtG6b9f"
    },
    {
      "no": 8,
      "title": "We Almost Quit",
      "drive": "https://drive.google.com/drive/folders/1SgkBevCmcO91Xpx0wtK516vi_JRV3lhA"
    }
  ];
  const EPISODE_MEDIA = {
    "1": [
      "https://drive.google.com/file/d/1ZAe16F65uBB-LYb69s9MJTI_OllB6USb/view?usp=drivesdk",
      "https://drive.google.com/file/d/18Q55xz7A6iaO0h4gPHvmpGTCKmn_RybV/view?usp=drivesdk"
    ],
    "2": [
      "https://drive.google.com/file/d/1mfIG4di_TJeFzbIhHG_JRiD1hw0ju_2c/view?usp=drivesdk",
      "https://drive.google.com/file/d/1UZSTdoondfU54fXbhpbH09uR2mXm1EsW/view?usp=drivesdk"
    ],
    "3": [
      "https://drive.google.com/file/d/1OKYfNswAJzb270qV8Ip4omf8eLuePIjo/view?usp=drivesdk",
      "https://drive.google.com/file/d/1vvHnzBAdHMbaLqzjukg-VahvAeL7XX1l/view?usp=drivesdk"
    ],
    "4": [
      "https://drive.google.com/file/d/10ha10QPrXpjxy2YBG6uAwX2fSa1bk3d6/view?usp=drivesdk",
      "https://drive.google.com/file/d/1VnlPPieIx0_AoMegAGzy6gk7znvc9hEc/view?usp=drivesdk"
    ],
    "5": [
      "https://drive.google.com/file/d/1YohMhLXyLJgDQQQXl-k0JnUKpW3cMFqn/view?usp=drivesdk",
      "https://drive.google.com/file/d/1w3y-s_FGu00JSIJeHp2pQVNk0_lW-P37/view?usp=drivesdk"
    ],
    "6": [
      "https://drive.google.com/file/d/1mg1IycoSzbSU9TOZGy954CLUsaj9WhzU/view?usp=drivesdk",
      "https://drive.google.com/file/d/1DHmBnq2qez_TprlQYKqRslmnnvIzd4dw/view?usp=drivesdk"
    ],
    "7": [
      "https://drive.google.com/file/d/1nS50auqSGIJa7m4_i5fHLDkENSy0S-cQ/view?usp=drivesdk",
      "https://drive.google.com/file/d/1NZfwezaoy-Vq3SrDckAFxZE5GGMsBR_b/view?usp=drivesdk"
    ]
  };

  const DB_NAME = 'offbrief-ipad-studio-v1';
  let database;
  let projects = [];
  let selectedId = null;
  let activeId = null;
  let currentTime = 0;
  let playing = false;
  let recording = false;
  let rafId = 0;
  let startedAt = 0;
  let audioSession = null;
  let saveTimer = null;
  let exportUrl = '';
  let exportFile = null;
  let progressTimer = null;
  let notice = '';
  const uid = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(36).slice(2);
  const safe = value =>
    String(value == null ? '' : value).replace(
      /[&<>"']/g,
      char =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char]
    );
  const $ = selector => root.querySelector(selector);
  const makeScene = (kind = 'photo', index = 1) => ({
    id: uid(),
    kind,
    name:
      kind === 'title'
        ? 'OFF BRIEF'
        : kind === 'bumper'
          ? 'OFF BRIEF · Intro'
          : 'Scene ' + String(index).padStart(2, '0'),
    duration: kind === 'bumper' ? 6 : kind === 'title' ? 3 : 6,
    motion: 'zoom',
    subtitle: '',
    imageBlob: null,
    voiceBlob: null,
  });
  const makeProject = name => ({
    id: uid(),
    name: name || 'The Viral Emergency',
    episodeNo: null,
    ratio: '16:9',
    quality: '720',
    musicBlob: null,
    musicName: '',
    musicVolume: 18,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    scenes: [makeScene()],
  });
  function makeSeasonEpisode(meta) {
    const p = makeProject(meta.title);
    p.episodeNo = meta.no;
    // Storyboards contain source scenes only. The real 5s universal intro
    // is handled by Final Cut after the two cold-open shots.
    p.scenes = [];
    for (let i = 1; i <= 10; i++) {
      const photo = makeScene('photo', i);
      photo.name = 'Scene ' + String(i).padStart(2, '0');
      p.scenes.push(photo);
    }
    return p;
  }
  function episodeFor(project) {
    return EPISODES.find(meta =>
      Number(project.episodeNo) === meta.no ||
      String(project.name || '').trim().toLowerCase() === meta.title.toLowerCase()
    );
  }
  function episodeKitHTML(meta) {
    if (!meta) return '';
    const introMedia = EPISODE_MEDIA[meta.no] || [];
    return '<section class="episode-kit">' +
      '<div><span class="eyebrow">SEASON 01 · EPISODE ' + String(meta.no).padStart(2,'0') + '</span>' +
      '<h3>Episode ready to assemble</h3>' +
      '<p>Photo storyboard only. The official 5-second video intro plays after cold-open shots F01 and F02 in Final Cut. Existing photos remain private until imported.</p></div>' +
      '<div class="episode-media-links">' +
      '<a class="episode-drive-link" href="https://drive.google.com/file/d/14oZBDmHZoUQK_iYHPhirAtvpSuTL3p64/view" target="_blank" rel="noopener noreferrer">Official universal intro · 5s</a>' +
      (introMedia[1] ? '<a class="episode-cover-link" href="' + safe(introMedia[1]) + '" target="_blank" rel="noopener noreferrer">Intro PNG</a>' : '') +
      '<a class="episode-cover-link" href="' + safe(meta.drive) + '" target="_blank" rel="noopener noreferrer">Original scene photos</a>' +
      '</div></section>';
  }
  const current = () => projects.find(p => p.id === selectedId);
  const active = () => (current()?.scenes || []).find(s => s.id === activeId);
  const duration = scenes =>
    scenes.reduce((sum, s) => sum + Number(s.duration || 0), 0);
  const readableTime = seconds => {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    return (
      String(Math.floor(s / 60)).padStart(2, '0') +
      ':' +
      String(s % 60).padStart(2, '0')
    );
  };
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore('projects', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function dbRequest(method, value) {
    return new Promise((resolve, reject) => {
      const tx = database.transaction('projects', 'readwrite');
      const request = tx.objectStore('projects')[method](value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function dataCopy(p) {
    return {
      id: p.id,
      name: p.name,
      episodeNo: p.episodeNo || null,
      ratio: p.ratio,
      quality: p.quality,
      musicBlob: p.musicBlob,
      musicName: p.musicName,
      musicVolume: p.musicVolume,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      scenes: p.scenes.map(s => ({
        id: s.id,
        kind: s.kind,
        name: s.name,
        duration: s.duration,
        motion: s.motion,
        subtitle: s.subtitle,
        imageBlob: s.imageBlob,
        voiceBlob: s.voiceBlob,
        voiceName: s.voiceName || '',
      })),
    };
  }
  function hydrate(p) {
    for (const s of p.scenes) {
      if (s.imageBlob && !s.imageUrl) {
        s.imageUrl = URL.createObjectURL(s.imageBlob);
        const image = new Image();
        image.onload = () => {
          s.image = image;
          drawCurrent();
        };
        image.src = s.imageUrl;
      }
    }
    return p;
  }
  function inform(message, isError = false) {
    notice = message;
    const n = $('#notice');
    if (n) {
      n.textContent = message;
      n.className = 'notice ' + (isError ? 'error' : '');
    }
  }
  function scheduleSave() {
    const label = $('#saveLabel');
    if (label) label.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNow(), 450);
  }
  async function saveNow() {
    const p = current();
    if (!p) return;
    clearTimeout(saveTimer);
    p.updatedAt = Date.now();
    try {
      await dbRequest('put', dataCopy(p));
      const label = $('#saveLabel');
      if (label) label.textContent = 'Saved on this iPad';
    } catch (err) {
      inform(
        'Could not save. Check free storage on your iPad. Export a backup soon.',
        true
      );
    }
  }
  async function load() {
    try {
      database = await openDB();
      projects = await dbRequest('getAll');
      const hadProjects = projects.length > 0;
      let defaultId = null;
      if (hadProjects) {
        projects.sort((a,b) => b.updatedAt - a.updatedAt);
        defaultId = projects[0].id;
      }
      for (const meta of EPISODES) {
        let p = projects.find(project => episodeFor(project)?.no === meta.no);
        if (!p) {
          p = makeSeasonEpisode(meta);
          projects.push(p);
          await dbRequest('put', dataCopy(p));
        } else {
          p.episodeNo = meta.no;
          // Do not silently add the outdated 6s built-in intro to stored projects.
          // Existing user scenes remain untouched; Final Cut controls the official intro.
        }
      }
      if (!projects.length) {
        const p = makeProject('New episode 01');
        projects.push(p);
        await dbRequest('put', dataCopy(p));
      }
      projects.forEach(hydrate);
      projects.sort((a,b) => {
        const an = episodeFor(a)?.no || 100;
        const bn = episodeFor(b)?.no || 100;
        return an === bn ? b.updatedAt - a.updatedAt : an - bn;
      });
      selectedId = defaultId || projects[0].id;
      activeId = current()?.scenes[0]?.id || null;
      render();
    } catch (err) {
      root.innerHTML =
        '<div class="storage-error"><h2>Storage unavailable</h2><p>Open this studio in Safari (not private browsing) and allow website storage.</p></div>';
    }
  }
  function render() {
    const p = current();
    if (!p) return;
    const s = active() || p.scenes[0];
    const episode = episodeFor(p);
    if (s) activeId = s.id;
    const total = duration(p.scenes);
    const width = p.ratio === '16:9' ? 960 : 540;
    const height = p.ratio === '16:9' ? 540 : 960;
    root.innerHTML = `
      <header class="topbar">
        <div class="brandmark"><span class="spark">✳</span><div><strong>OFF BRIEF<span class="dot">.</span></strong><small>THE LAUNCH ERA / VIDEO STUDIO</small></div></div>
        <div class="top-actions">
          <span class="save-status" id="saveLabel">Saved on this iPad</span>
          <button class="outline header-save" data-action="save" type="button">Save</button>
          <button class="primary" data-action="export" type="button" ${recording ? 'disabled' : ''}>${recording ? 'Rendering…' : 'Export video ↗'}</button>
        </div>
      </header>
      <div class="layout">
        <aside class="sidebar">
          <div class="eyebrow"><span>01 / LIBRARY</span><span class="tiny">PRIVATE · LOCAL</span></div>
          <h2>Your projects</h2>
          <button class="add-project" data-action="new-project" type="button"><span>＋</span> New episode</button>
          <div class="project-list">
            ${projects
              .map(
                pr => `
              <button class="project ${pr.id === p.id ? 'is-current' : ''}" data-action="select-project" data-id="${pr.id}" type="button">
                <span class="project-thumb">${pr.episodeNo ? String(pr.episodeNo).padStart(2, '0') : '✳'}</span><span class="project-name"><b>${safe(pr.name)}</b><small>${pr.scenes.length} scenes · ${readableTime(duration(pr.scenes))}</small></span>
              </button>`
              )
              .join('')}
          </div>
          <div class="sidebar-foot"><span class="sidebar-foot-tag">IPAD EDITION / V1</span><p>Made for creating without a computer. Your original photos stay on this device.</p></div>
        </aside>
        <main class="stage-section">
          <div class="workspace-head">
            <div><div class="eyebrow">02 / EDITOR &nbsp; <span class="live-indicator"></span> BROWSER BASED</div><input class="project-title" aria-label="Episode name" id="projectName" value="${safe(p.name)}" maxlength="80" /></div>
            <div class="controls-pill" role="group" aria-label="Video orientation">
              <button type="button" data-action="ratio" data-value="16:9" class="${p.ratio === '16:9' ? 'active' : ''}">16:9</button>
              <button type="button" data-action="ratio" data-value="9:16" class="${p.ratio === '9:16' ? 'active' : ''}">9:16</button>
            </div>
          </div>
          ${episodeKitHTML(episode)}
          <section class="preview-panel">
            <div class="preview-head"><span><i class="status-light"></i> LIVE PREVIEW</span><span>${p.ratio} · ${p.quality}p</span></div>
            <div class="canvas-shell ${p.ratio === '9:16' ? 'portrait' : ''}">
              <canvas id="preview" width="${width}" height="${height}" aria-label="Preview of your video"></canvas>
              <span class="canvas-watermark">PREVIEW ONLY</span>
            </div>
            <div class="transport">
              <button id="playToggle" data-action="play" class="play-btn" type="button" aria-label="${playing ? 'Pause' : 'Play'}">${playing ? 'Ⅱ' : '▶'}</button>
              <strong id="timeReadout">${readableTime(currentTime)}</strong>
              <input type="range" id="scrubber" min="0" max="${total}" step=".05" value="${Math.min(total, currentTime)}" aria-label="Video playhead" />
              <span class="duration-readout">${readableTime(total)}</span>
              <button class="outline compact" data-action="reset" type="button">↺</button>
            </div>
          </section>
          <section class="timeline">
            <div class="section-title"><div><span class="eyebrow">03 / STORYBOARD</span><h3>Your scenes <span class="count">${p.scenes.length}</span></h3></div><button class="subtle-button" type="button" data-action="add-photos">＋ Add photos</button></div>
            <div class="scene-list">
              ${p.scenes
                .map(
                  (sc, i) => `
                <div class="scene-card ${sc.id === activeId ? 'selected' : ''}" data-card="${sc.id}">
                  <button class="scene-pick" type="button" data-action="scene" data-id="${sc.id}">
                    <span class="scene-image">
                      ${sc.imageUrl ? `<img alt="" src="${sc.imageUrl}">` : `<span class="scene-placeholder">${sc.kind === 'bumper' ? 'OB' : sc.kind === 'title' ? 'Aa' : '＋'}</span>`}
                      <em>${String(i + 1).padStart(2, '0')}</em>
                    </span>
                    <span class="scene-desc"><strong>${safe(sc.name)}</strong><small>${sc.duration}s · ${sc.kind === 'bumper' ? 'Animated intro · Built in' : sc.kind === 'title' ? 'Title card' : sc.imageBlob ? 'Photo ready' : 'Add a photo'}</small></span>
                  </button>
                  <div class="scene-move"><button type="button" data-action="left" data-id="${sc.id}" aria-label="Move scene earlier" ${i === 0 ? 'disabled' : ''}>‹</button><button type="button" data-action="right" data-id="${sc.id}" aria-label="Move scene later" ${i === p.scenes.length - 1 ? 'disabled' : ''}>›</button></div>
                </div>`
                )
                .join('')}
              <div class="add-scene-card"><button type="button" data-action="add-photos"><b>＋</b><span>Import photos</span></button><button type="button" data-action="add-title"><b>Aa</b><span>Title card</span></button></div>
            </div>
            <p class="helper-line">This workspace keeps the photo storyboard. To assemble finished video clips with synced English voices and the official intro after F02, open Final Cut.</p>
          </section>
          <div class="notice" id="notice">${safe(notice)}</div>
        </main>
        <aside class="inspector">
          <div class="eyebrow">04 / DIRECTOR'S PANEL</div>
          <div class="inspector-head"><h2>Scene details</h2><span class="scene-index">${s ? String(p.scenes.findIndex(x => x.id === s.id) + 1).padStart(2, '0') : '—'}/${String(p.scenes.length).padStart(2, '0')}</span></div>
          ${
            s
              ? `
          <label class="field"><span>Scene title</span><input type="text" id="sceneName" maxlength="90" value="${safe(s.name)}" /></label>
          <label class="field"><span>Caption / on-screen text</span><textarea id="sceneSubtitle" rows="3" maxlength="260" placeholder="Write the text for this scene…">${safe(s.subtitle)}</textarea></label>
          <label class="field"><span>Motion</span><select id="sceneMotion">
            ${[
              ['zoom', 'Slow zoom in'],
              ['out', 'Slow zoom out'],
              ['left', 'Pan left'],
              ['right', 'Pan right'],
              ['still', 'Still frame'],
            ]
              .map(
                ([v, l]) =>
                  `<option value="${v}" ${s.motion === v ? 'selected' : ''}>${l}</option>`
              )
              .join('')}
          </select></label>
          <div class="duration-line"><label for="sceneDuration">Duration <b id="sceneSeconds">${s.duration}s</b></label><input id="sceneDuration" type="range" min="2" max="15" step="1" value="${s.duration}" /></div>
          <div class="upload-actions">
            ${s.kind !== 'title' && s.kind !== 'bumper' ? `<button class="upload-tile" type="button" data-action="replace-photo"><span>▧</span><b>${s.imageBlob ? 'Replace photo' : 'Add photo'}</b><small>JPG / PNG / HEIC*</small></button>` : `<div class="upload-tile title-tile"><span>Aa</span><b>${s.kind === 'bumper' ? 'Animated intro' : 'Editorial title'}</b><small>No photo required</small></div>`}
            <button class="upload-tile" type="button" data-action="add-voice"><span>◉</span><b>${s.voiceBlob ? 'Replace voice' : 'Add voice'}</b><small>${s.voiceName ? safe(s.voiceName) : 'M4A / MP3 / WAV'}</small></button>
          </div>
          ${s.voiceBlob ? `<button class="text-action" data-action="clear-voice" type="button">Remove voice from scene</button>` : ''}
          <button class="danger-link" type="button" data-action="delete-scene">Remove scene</button>`
              : ''
          }
          <div class="audio-panel">
            <div class="audio-heading"><span class="eyebrow">05 / SOUNDTRACK</span><span class="sound-icon">♫</span></div>
            <h3>Background music</h3><p>${p.musicName ? safe(p.musicName) : 'Add a track for your whole episode.'}</p>
            <button class="outline music-button" type="button" data-action="add-music">${p.musicBlob ? 'Change track' : '＋ Add music'}</button>
            ${p.musicBlob ? `<label class="duration-line music-volume">Volume <b id="musicPercent">${p.musicVolume}%</b><input type="range" id="musicVolume" min="0" max="100" step="1" value="${p.musicVolume}"></label><button class="text-action" type="button" data-action="clear-music">Remove soundtrack</button>` : ''}
          </div>
          <div class="export-panel"><div class="eyebrow">06 / OUTPUT</div><label class="field"><span>Resolution</span><select id="quality"><option value="720" ${p.quality === '720' ? 'selected' : ''}>720p · iPad friendly</option><option value="1080" ${p.quality === '1080' ? 'selected' : ''}>1080p · high quality</option></select></label>
            <button class="primary full-width" data-action="export" type="button" ${recording ? 'disabled' : ''}>${recording ? 'Exporting…' : 'Export video ↗'}</button>
            <p class="fineprint">Video exports in real time. Keep Safari open and your iPad awake. MP4 where supported; otherwise WebM.</p>
            <div id="exportProgress" class="export-progress" ${recording ? '' : 'hidden'}><div class="progress-track"><span id="progressFill"></span></div><small id="progressText">Preparing export…</small></div>
            <div id="exportActions" class="export-actions" ${exportUrl ? '' : 'hidden'}>
              <button type="button" class="outline full-width" data-action="download">Download exported video</button>
              <button type="button" class="outline full-width" data-action="share">Save or share on iPad</button>
            </div>
          </div>
          <button class="danger-link project-delete" data-action="delete-project" type="button">Delete this project</button>
        </aside>
      </div>
      <input id="addPhotosInput" type="file" accept="image/*,.heic,.heif" multiple hidden>
      <input id="replacePhotoInput" type="file" accept="image/*,.heic,.heif" hidden>
      <input id="voiceInput" type="file" accept="audio/*,.m4a,.mp3,.wav" hidden>
      <input id="musicInput" type="file" accept="audio/*,.m4a,.mp3,.wav" hidden>
    `;
    drawCurrent();
  }
  function imageCover(ctx, image, w, h, progress, motion) {
    const base = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const extra = motion === 'still' ? 1 : 1.15;
    const scale =
      base *
      (motion === 'zoom'
        ? 1 + progress * 0.15
        : motion === 'out'
          ? 1.15 - progress * 0.15
          : extra);
    const iw = image.naturalWidth * scale;
    const ih = image.naturalHeight * scale;
    let x = (w - iw) / 2,
      y = (h - ih) / 2;
    if (motion === 'left') x += (progress - 0.5) * Math.min(w * 0.14, iw - w);
    if (motion === 'right') x -= (progress - 0.5) * Math.min(w * 0.14, iw - w);
    ctx.drawImage(image, x, y, iw, ih);
  }
  function wrapLines(ctx, text, width, maxLines) {
    const lines = [];
    for (const paragraph of String(text).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const attempt = line ? line + ' ' + word : word;
        if (line && ctx.measureText(attempt).width > width) {
          lines.push(line);
          line = word;
        } else line = attempt;
      }
      if (line) lines.push(line);
    }
    return lines.slice(0, maxLines);
  }
  function drawBumper(ctx, canvas, scene, progress) {
    const w = canvas.width, h = canvas.height, t = Math.min(6, progress * 6);
    const scale = w / 1920;
    ctx.save();
    ctx.scale(scale, scale);
    const tall = h / scale;
    const black = '#191919', ivory = '#faf8f3', yellow = '#f2d85b';
    ctx.fillStyle = t >= 4.04 ? ivory : black;
    ctx.fillRect(0, 0, 1920, tall);
    ctx.textAlign = 'left';
    if (t < 2.65) {
      ctx.fillStyle = yellow;
      ctx.fillRect(0, 0, 1920, 24);
      ctx.font = '800 34px system-ui, sans-serif';
      ctx.fillText('THE CREATIVE HOUSE / INCOMING', 94, 125);
      const cards = t < 0.95 ? 1 : 3;
      for (let i = 0; i < cards; i++) {
        const x = 220 + i * 210, y = 265 + i * 91;
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate((i - 1) * (t > 1 ? 0.075 : 0));
        ctx.fillStyle = ivory;
        ctx.fillRect(0, 0, 1140, 240);
        ctx.fillStyle = black;
        ctx.font = '800 92px system-ui, sans-serif';
        ctx.fillText(i === 0 ? 'NEW BRIEF' : i === 1 ? 'URGENT UPDATE' : 'ONE MORE CHANGE', 45, 145);
        ctx.restore();
      }
    } else if (t < 4.04) {
      const entry = Math.min(1,(t-2.65)/0.28);
      ctx.fillStyle = yellow;
      ctx.fillRect(96, 130, 34 * entry, tall - 260);
      ctx.fillStyle = ivory;
      ctx.font = '900 246px system-ui, sans-serif';
      ctx.fillText('OFF', 156, 508);
      ctx.fillText('BRIEF', 156, 778);
      ctx.font = '700 38px system-ui, sans-serif';
      ctx.fillStyle = yellow;
      ctx.fillText('HERE WE GO AGAIN…', 166, 930);
    } else {
      ctx.fillStyle = yellow;
      ctx.fillRect(0, 0, 26, tall);
      ctx.fillStyle = black;
      ctx.fillRect(0, 0, 1920, 22);
      ctx.fillStyle = black;
      ctx.font = '700 32px system-ui, sans-serif';
      ctx.fillText('SEASON 01 · EPISODE INTRO', 112, 166);
      const title = (scene.subtitle || 'OFF BRIEF').toUpperCase();
      ctx.font = '900 145px system-ui, sans-serif';
      const lines = wrapLines(ctx, title, 1540, 3);
      lines.forEach((line,i)=>ctx.fillText(line, 105, 360 + i * 172));
      ctx.fillStyle = yellow;
      ctx.fillRect(107, 925, 1080, 19);
      ctx.fillStyle = black;
      ctx.font = '800 61px system-ui, sans-serif';
      ctx.fillText('OFF BRIEF', 112, 1030);
    }
    ctx.restore();
  }
  function drawScene(ctx, canvas, scene, progress, alpha) {
    const w = canvas.width,
      h = canvas.height;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (scene.kind === 'bumper') {
      drawBumper(ctx, canvas, scene, progress);
      ctx.restore();
      return;
    }
    ctx.fillStyle = scene.kind === 'title' ? '#f2d85b' : '#1b2023';
    ctx.fillRect(0, 0, w, h);
    if (scene.image && scene.image.complete && scene.image.naturalWidth)
      imageCover(ctx, scene.image, w, h, progress, scene.motion);
    if (scene.kind === 'title') {
      const fontSize = Math.round(w * 0.085);
      ctx.fillStyle = '#191919';
      ctx.textAlign = 'center';
      ctx.font = '700 ' + fontSize + 'px system-ui, sans-serif';
      const lines = wrapLines(ctx, scene.name, w * 0.82, 3);
      const blockH = lines.length * fontSize * 1.12;
      lines.forEach((line, i) =>
        ctx.fillText(
          line,
          w / 2,
          h / 2 - blockH / 2 + (i + 1) * fontSize * 1.04
        )
      );
      ctx.fillStyle = '#191919';
      ctx.font = '500 ' + Math.round(w * 0.022) + 'px system-ui, sans-serif';
      ctx.fillText('OFF BRIEF  /  VIDEO STUDIO', w / 2, h * 0.12);
    } else if (!scene.image) {
      ctx.fillStyle = '#46494b';
      ctx.textAlign = 'center';
      ctx.font = '600 ' + Math.round(w * 0.038) + 'px system-ui, sans-serif';
      ctx.fillText('ADD A PHOTO', w / 2, h / 2);
    }
    if (scene.subtitle) {
      const margin = Math.round(w * 0.06);
      const fontsize = Math.max(20, Math.round(w * 0.036));
      ctx.font = '600 ' + fontsize + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const lines = wrapLines(ctx, scene.subtitle, w - margin * 3, 4);
      const lineHeight = fontsize * 1.3;
      const blockHeight = lines.length * lineHeight + fontsize * 1.0;
      const top = h - blockHeight - Math.round(h * 0.055);
      ctx.fillStyle = 'rgba(12,15,17,.78)';
      ctx.fillRect(margin, top, w - margin * 2, blockHeight);
      ctx.fillStyle = '#fffef9';
      lines.forEach((line, i) =>
        ctx.fillText(line, w / 2, top + fontsize * 1.1 + i * lineHeight)
      );
    }
    ctx.restore();
  }
  function sceneAt(scenes, time) {
    let elapsed = 0;
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      if (time < elapsed + s.duration || i === scenes.length - 1) {
        return {
          scene: s,
          index: i,
          local: Math.max(0, time - elapsed),
          start: elapsed,
        };
      }
      elapsed += s.duration;
    }
    return null;
  }
  function drawFrame(canvas, time, scenes) {
    if (!canvas || !scenes?.length) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const frame = sceneAt(
      scenes,
      Math.min(time, Math.max(0, duration(scenes) - 0.001))
    );
    if (!frame) return;
    const { scene, index, local } = frame;
    ctx.fillStyle = '#16191b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (index > 0 && local < 0.45) {
      drawScene(ctx, canvas, scenes[index - 1], 1, 1);
      drawScene(
        ctx,
        canvas,
        scene,
        local / scene.duration,
        Math.min(1, local / 0.45)
      );
    } else drawScene(ctx, canvas, scene, local / scene.duration, 1);
  }
  function drawCurrent() {
    const canvas = $('#preview');
    const p = current();
    if (canvas && p) drawFrame(canvas, currentTime, p.scenes);
    const scrub = $('#scrubber');
    if (scrub) scrub.value = String(currentTime);
    const readout = $('#timeReadout');
    if (readout) readout.textContent = readableTime(currentTime);
  }
  function stopAudio() {
    if (!audioSession) return;
    for (const source of audioSession.sources) {
      try {
        source.stop();
      } catch (_) {}
    }
    audioSession.context.close().catch(() => {});
    audioSession = null;
  }
  async function setupAudio(scenes, p, skipSeconds = 0, exportStream = null) {
    const hasAudio = !!p.musicBlob || scenes.some(s => s.voiceBlob || s.kind === 'bumper');
    if (!hasAudio) return null;
    const AContext = window.AudioContext || window.webkitAudioContext;
    if (!AContext) throw new Error('This Safari version cannot mix audio.');
    const context = new AContext();
    const sources = [];
    const destination = exportStream
      ? context.createMediaStreamDestination()
      : null;
    const decode = async blob =>
      context.decodeAudioData(await blob.arrayBuffer());
    try {
      await context.resume();
      const startAt = context.currentTime + 0.12;
      const route = (node, volume = 1) => {
        const gain = context.createGain();
        gain.gain.value = volume;
        node.connect(gain);
        gain.connect(destination || context.destination);
      };
      if (p.musicBlob) {
        const buffer = await decode(p.musicBlob);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        route(source, (p.musicVolume || 0) / 100);
        source.start(startAt, Math.max(0, skipSeconds) % buffer.duration);
        sources.push(source);
      }
      let offset = 0;
      for (const scene of scenes) {
        if (scene.kind === 'bumper') {
          const hits = [
            [0.12, 950, 0.10, 0.024],
            [0.29, 1180, 0.12, 0.021],
            [1.05, 870, 0.10, 0.022],
            [1.72, 690, 0.12, 0.025],
            [2.72, 210, 0.36, 0.055],
            [3.04, 310, 0.24, 0.038],
            [4.04, 540, 0.20, 0.028],
            [4.25, 780, 0.22, 0.026]
          ];
          for (const [at, freq, length, volume] of hits) {
            const absoluteTime = offset + at;
            if (absoluteTime < skipSeconds) continue;
            const playAt = startAt + absoluteTime - skipSeconds;
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = freq < 400 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, playAt);
            gain.gain.setValueAtTime(0.0001, playAt);
            gain.gain.linearRampToValueAtTime(volume, playAt + 0.018);
            gain.gain.exponentialRampToValueAtTime(0.0001, playAt + length);
            osc.connect(gain);
            gain.connect(destination || context.destination);
            osc.start(playAt);
            osc.stop(playAt + length + 0.02);
            sources.push(osc);
          }
        }
        const clipStart = offset;
        offset += scene.duration;
        if (!scene.voiceBlob || offset <= skipSeconds) continue;
        const buffer = await decode(scene.voiceBlob);
        const source = context.createBufferSource();
        source.buffer = buffer;
        route(source, 0.95);
        const passed = Math.max(0, skipSeconds - clipStart);
        if (passed < buffer.duration) {
          source.start(startAt + Math.max(0, clipStart - skipSeconds), passed);
          sources.push(source);
        }
      }
      if (exportStream) {
        for (const track of destination.stream.getAudioTracks())
          exportStream.addTrack(track);
      }
      return { context, sources };
    } catch (err) {
      for (const source of sources) {
        try {
          source.stop();
        } catch (_) {}
      }
      await context.close().catch(() => {});
      throw new Error(
        'Could not read a voice or music file. Try M4A, MP3 or WAV.'
      );
    }
  }
  async function startPlay() {
    if (recording) return;
    if (playing) {
      pause();
      return;
    }
    const p = current();
    if (!p) return;
    if (currentTime >= duration(p.scenes)) currentTime = 0;
    try {
      audioSession = await setupAudio(p.scenes, p, currentTime);
    } catch (err) {
      inform(err.message, true);
      return;
    }
    playing = true;
    startedAt = performance.now() - currentTime * 1000;
    const button = $('#playToggle');
    if (button) {
      button.textContent = 'Ⅱ';
      button.setAttribute('aria-label', 'Pause');
    }
    const tick = () => {
      if (!playing) return;
      currentTime = Math.min(
        duration(p.scenes),
        (performance.now() - startedAt) / 1000
      );
      drawCurrent();
      if (currentTime >= duration(p.scenes)) {
        pause();
        currentTime = 0;
        drawCurrent();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(rafId);
    stopAudio();
    const button = $('#playToggle');
    if (button) {
      button.textContent = '▶';
      button.setAttribute('aria-label', 'Play');
    }
  }
  function allowedScenes(p) {
    return p.scenes.filter(s => s.kind === 'title' || s.kind === 'bumper' || !!s.imageBlob);
  }
  async function makeExport() {
    const p = current();
    if (!p || recording) return;
    pause();
    const scenes = allowedScenes(p);
    if (!scenes.length) {
      inform('Add at least one photo or a title card before exporting.', true);
      return;
    }
    if (
      typeof MediaRecorder === 'undefined' ||
      !HTMLCanvasElement.prototype.captureStream
    ) {
      inform(
        'Video export is not supported in this browser. Open this link directly in Safari on your iPad.',
        true
      );
      return;
    }
    recording = true;
    exportUrl = '';
    exportFile = null;
    render();
    const meter = $('#exportProgress');
    if (meter) meter.hidden = false;
    let recorder = null;
    let audio = null;
    let stream = null;
    try {
      const width =
        p.ratio === '16:9'
          ? p.quality === '1080'
            ? 1920
            : 1280
          : p.quality === '1080'
            ? 1080
            : 720;
      const height =
        p.ratio === '16:9'
          ? p.quality === '1080'
            ? 1080
            : 720
          : p.quality === '1080'
            ? 1920
            : 1280;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      stream = canvas.captureStream(24);
      const formats = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const mime = formats.find(m => MediaRecorder.isTypeSupported(m));
      if (!mime)
        throw new Error(
          'Safari does not offer a supported video export format.'
        );
      drawFrame(canvas, 0, scenes);
      audio = await setupAudio(scenes, p, 0, stream);
      const chunks = [];
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: p.quality === '1080' ? 6500000 : 3200000,
      });
      const startTime = performance.now();
      const length = duration(scenes);
      const result = new Promise((resolve, reject) => {
        recorder.ondataavailable = e => {
          if (e.data && e.data.size) chunks.push(e.data);
        };
        recorder.onerror = () =>
          reject(new Error('Recording stopped unexpectedly.'));
        recorder.onstop = () => {
          if (!chunks.length)
            reject(new Error('Safari did not produce a video file.'));
          else resolve(new Blob(chunks, { type: mime.split(';')[0] }));
        };
      });
      recorder.start(1000);
      let activeExport = true;
      const drive = () => {
        if (!activeExport) return;
        const elapsed = Math.min(
          length,
          (performance.now() - startTime) / 1000
        );
        drawFrame(canvas, elapsed, scenes);
        const fill = $('#progressFill'),
          text = $('#progressText');
        if (fill)
          fill.style.width = ((elapsed / length) * 100).toFixed(1) + '%';
        if (text)
          text.textContent =
            'Rendering ' +
            Math.round((elapsed / length) * 100) +
            '% · Keep this tab open';
        if (elapsed < length && recorder.state === 'recording')
          requestAnimationFrame(drive);
      };
      drive();
      await new Promise(resolve => setTimeout(resolve, length * 1000 + 100));
      activeExport = false;
      if (recorder.state === 'recording') recorder.stop();
      const blob = await result;
      if (blob.size < 1000)
        throw new Error('The exported video is empty. Try 720p.');
      exportUrl = URL.createObjectURL(blob);
      const extension = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
      const filename =
        (p.name || 'off-brief')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        p.ratio.replace(':', 'x') +
        '.' +
        extension;
      exportFile = new File([blob], filename, { type: blob.type });
      inform('Video is ready! Download it or use the iPad share sheet.');
    } catch (err) {
      inform(
        'Export failed: ' +
          (err?.message || 'unknown browser error') +
          ' Try 720p in Safari.',
        true
      );
    } finally {
      if (audio) {
        for (const src of audio.sources) {
          try {
            src.stop();
          } catch (_) {}
        }
        audio.context.close().catch(() => {});
      }
      if (stream) stream.getTracks().forEach(t => t.stop());
      recording = false;
      render();
    }
  }
  function choose(action) {
    const map = {
      'add-photos': '#addPhotosInput',
      'replace-photo': '#replacePhotoInput',
      'add-voice': '#voiceInput',
      'add-music': '#musicInput',
    };
    const input = $(map[action]);
    if (input) input.click();
  }
  async function onFiles(input) {
    const p = current(),
      s = active();
    if (!p || !input.files?.length) return;
    const files = Array.from(input.files);
    if (input.id === 'addPhotosInput') {
      if (
        p.scenes.length === 1 &&
        !p.scenes[0].imageBlob &&
        p.scenes[0].kind === 'photo' &&
        !p.scenes[0].subtitle
      )
        p.scenes = [];
      for (const file of files) {
        if (
          !file.type.startsWith('image/') &&
          !/\.(heic|heif)$/i.test(file.name)
        )
          continue;
        const scene = p.scenes.find(sc => sc.kind === 'photo' && !sc.imageBlob) || makeScene('photo', p.scenes.length + 1);
        if (!p.scenes.includes(scene)) p.scenes.push(scene);
        scene.name =
          file.name
            .replace(/\.[^.]+$/, '')
            .replace(/[_-]/g, ' ')
            .slice(0, 80) || scene.name;
        scene.imageBlob = file;
        hydrate({ scenes: [scene] });
        activeId = scene.id;
      }
    } else if (input.id === 'replacePhotoInput' && s) {
      s.imageBlob = files[0];
      s.image = null;
      if (s.imageUrl) URL.revokeObjectURL(s.imageUrl);
      s.imageUrl = '';
      hydrate({ scenes: [s] });
    } else if (input.id === 'voiceInput' && s) {
      s.voiceBlob = files[0];
      s.voiceName = files[0].name;
    } else if (input.id === 'musicInput') {
      p.musicBlob = files[0];
      p.musicName = files[0].name;
    }
    currentTime = 0;
    scheduleSave();
    render();
    inform('Media added. Changes save automatically on this iPad.');
  }
  async function createProject() {
    pause();
    const count = projects.length + 1;
    const p = makeProject('New episode ' + String(count).padStart(2, '0'));
    projects.unshift(p);
    selectedId = p.id;
    activeId = p.scenes[0].id;
    currentTime = 0;
    await saveNow();
    render();
    $('#projectName')?.focus();
    $('#projectName')?.select();
  }
  function relocate(id, direction) {
    const p = current(),
      index = p.scenes.findIndex(s => s.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= p.scenes.length) return;
    const scene = p.scenes.splice(index, 1)[0];
    p.scenes.splice(next, 0, scene);
    activeId = id;
    currentTime = 0;
    scheduleSave();
    render();
  }
  async function deleteProject() {
    const p = current();
    if (!p) return;
    if (
      !confirm(
        'Delete the episode "' +
          p.name +
          '"? This removes its local photos and audio from this studio.'
      )
    )
      return;
    pause();
    await dbRequest('delete', p.id);
    projects = projects.filter(x => x.id !== p.id);
    if (!projects.length) {
      const fresh = makeProject('New episode 01');
      projects.push(fresh);
    }
    selectedId = projects[0].id;
    activeId = projects[0].scenes[0]?.id || null;
    currentTime = 0;
    await saveNow();
    render();
    inform('Episode deleted.');
  }
  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');
    if (!button || recording) return;
    const action = button.dataset.action,
      id = button.dataset.id,
      p = current();
    if (!p) return;
    if (
      ['add-photos', 'replace-photo', 'add-voice', 'add-music'].includes(action)
    ) {
      choose(action);
      return;
    }
    if (action === 'save') {
      await saveNow();
      inform('Saved on this iPad.');
    }
    if (action === 'new-project') await createProject();
    if (action === 'select-project') {
      pause();
      selectedId = id;
      activeId = current().scenes[0]?.id || null;
      currentTime = 0;
      render();
    }
    if (action === 'delete-project') await deleteProject();
    if (action === 'ratio') {
      pause();
      p.ratio = button.dataset.value;
      scheduleSave();
      render();
    }
    if (action === 'scene') {
      pause();
      activeId = id;
      currentTime = 0;
      scheduleSave();
      render();
    }
    if (action === 'left') relocate(id, -1);
    if (action === 'right') relocate(id, 1);
    if (action === 'add-title') {
      const sc = makeScene('title', p.scenes.length + 1);
      p.scenes.push(sc);
      activeId = sc.id;
      currentTime = 0;
      scheduleSave();
      render();
    }
    if (action === 'delete-scene') {
      const sc = active();
      if (!sc || !confirm('Remove this scene?')) return;
      p.scenes = p.scenes.filter(x => x.id !== sc.id);
      if (!p.scenes.length) p.scenes = [makeScene()];
      activeId = p.scenes[0].id;
      currentTime = 0;
      scheduleSave();
      render();
    }
    if (action === 'play') await startPlay();
    if (action === 'reset') {
      pause();
      currentTime = 0;
      drawCurrent();
    }
    if (action === 'clear-voice') {
      const sc = active();
      if (sc) {
        sc.voiceBlob = null;
        sc.voiceName = '';
        scheduleSave();
        render();
      }
    }
    if (action === 'clear-music') {
      p.musicBlob = null;
      p.musicName = '';
      scheduleSave();
      render();
    }
    if (action === 'export') await makeExport();
    if (action === 'download' && exportUrl && exportFile) {
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = exportFile.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    if (action === 'share' && exportFile) {
      if (navigator.canShare && navigator.canShare({ files: [exportFile] })) {
        try {
          await navigator.share({ files: [exportFile], title: p.name });
        } catch (err) {
          if (err.name !== 'AbortError')
            inform('Use Download exported video instead.', true);
        }
      } else
        inform(
          'Use Download exported video, then open the file in Files.',
          true
        );
    }
  });
  root.addEventListener('input', event => {
    const el = event.target,
      p = current(),
      s = active();
    if (!p) return;
    if (el.id === 'projectName') {
      p.name = el.value;
      scheduleSave();
    }
    if (el.id === 'sceneName' && s) {
      s.name = el.value;
      scheduleSave();
      drawCurrent();
    }
    if (el.id === 'sceneSubtitle' && s) {
      s.subtitle = el.value;
      scheduleSave();
      drawCurrent();
    }
    if (el.id === 'sceneDuration' && s) {
      s.duration = Number(el.value);
      const seconds = $('#sceneSeconds');
      if (seconds) seconds.textContent = String(s.duration) + 's';
      const scrub = $('#scrubber');
      if (scrub) scrub.max = String(duration(p.scenes));
      const total = root.querySelector('.duration-readout');
      if (total) total.textContent = readableTime(duration(p.scenes));
      scheduleSave();
    }
    if (el.id === 'musicVolume') {
      p.musicVolume = Number(el.value);
      const label = $('#musicPercent');
      if (label) label.textContent = el.value + '%';
      scheduleSave();
    }
    if (el.id === 'scrubber') {
      pause();
      currentTime = Number(el.value);
      drawCurrent();
    }
  });
  root.addEventListener('change', async event => {
    const el = event.target,
      p = current(),
      s = active();
    if (!p) return;
    if (el.type === 'file') {
      await onFiles(el);
      return;
    }
    if (el.id === 'sceneMotion' && s) {
      s.motion = el.value;
      scheduleSave();
      drawCurrent();
    }
    if (el.id === 'quality') {
      p.quality = el.value;
      scheduleSave();
      render();
    }
    if (el.id === 'sceneDuration') {
      render();
    }
    if (['projectName', 'sceneName', 'sceneSubtitle'].includes(el.id)) {
      render();
    }
  });
  window.addEventListener('beforeunload', () => {
    pause();
  });
  load();
})();
