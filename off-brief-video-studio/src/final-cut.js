
import { CANON_EPISODES } from './canonical-production.js';
import { generateGoogleFlowPrompt } from './flow-production.js';

(function initializeFinalCut() {
  'use strict';

  const INTRO_SRC = import.meta.env.BASE_URL + 'resources/offbrief-official-universal-intro.mp4';
  const DRIVE_PREVIEWS = 'https://drive.google.com/drive/folders/1kDgbf_uyAPfpZMxSXyITVL3dQMGlsU3m';
  const OFF_BRIEF_CHANNEL_URL = 'https://www.youtube.com/@Offbriefchannel';
  const DB_NAME = 'offbrief-finalcut-v1';
  const CANVASES = {
    'S01E01': '067b23ca-021e-41ed-9f1f-7f5459eb140e',
    'S01E02': '009905ec-685b-4650-8dac-d8844035f7a8',
    'S01E03': '4594c16d-17ba-44bd-a511-6638eb1a1e21',
    'S01E04': '7f68fce8-e169-4833-a4ad-0c4593b095f4',
    'S01E05': '487e26c6-02a4-480b-aeaa-cf82d9c79017',
    'S01E06': '9a5d6f7b-9375-4035-a8ed-8aa6023f2ac6',
    'S01E07': '0af1b541-559d-4fbe-9a78-dd40da5848a7',
    'S01E08': '0fe6be96-d01e-4a9c-9eea-9006a825a2aa',
    'S02E01': 'f1db0e03-b877-45cb-b68d-641c5b4737ac'
  };
  const keyFor = episode => 'S' + String(episode.season).padStart(2, '0') + 'E' + String(episode.episode).padStart(2, '0');
  const catalog = CANON_EPISODES.filter(e => Array.isArray(e.scenes) && e.scenes.length > 0);
  const byKey = new Map(catalog.map(e => [keyFor(e), e]));
  let selected = catalog.length ? keyFor(catalog[0]) : '';
  let record = null;
  let db = null;
  let activeScene = 0;
  let activeTake = 0;
  // Mobile tool selection is UI-only: never changes saved episode or media.
  let mobilePanel = 'clips';
  try {
    const rememberedPanel = sessionStorage.getItem('offbrief-mobile-panel');
    if (['clips','audio','effects','flow','script','export'].includes(rememberedPanel)) mobilePanel = rememberedPanel;
  } catch (_) {}

  let exportQuality = '1080';
  let status = '';
  let busy = false;
  let previewUrl = '';
  let exportUrl = '';
  let exportName = '';
  let previewActive = false;
  let cancelPlayback = null;
  let activeSoundSession = null;

  const root = document.createElement('section');
  root.id = 'offbrief-final-cut';
  root.setAttribute('aria-label', 'OFF BRIEF Final Cut');
  const app = document.getElementById('app');
  app.parentNode.insertBefore(root, app.nextSibling);

  const nav = document.createElement('nav');
  nav.className = 'fc-mode-nav';
  nav.setAttribute('aria-label', 'OFF BRIEF workspaces');
  nav.innerHTML = '<span class="fc-mode-brand"><b>OFF BRIEF</b><span class="fc-mode-subtitle"> / VIDEO STUDIO</span></span><div><button type="button" data-workspace="final">Video editor</button><button type="button" data-workspace="legacy">Storyboards</button></div>';
  document.body.insertBefore(nav, app);

  const escapeHtml = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const seconds = s => {
    const t = Math.max(0, Math.floor(Number(s) || 0));
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  };
  const meta = () => byKey.get(selected);
  const frames = () => (meta()?.scenes || []).slice().sort((a, b) => Number(a.scene) - Number(b.scene));
  const frameKey = (f, i) => f.frameId || 'F' + String(i + 1).padStart(2, '0');
  const currentClips = () => record?.clips || {};
  // Supports older saved one-clip objects and newer arrays of scene parts.
  const partList = item => Array.isArray(item) ? item.filter(p => !!p?.blob) : item?.blob ? [item] : [];
  const sceneParts = (f, i) => partList(currentClips()[frameKey(f, i)]);
  const selectedParts = () => { const f = frames()[activeScene]; return f ? sceneParts(f, activeScene) : []; };
  const clipCount = () => frames().filter((f,i) => sceneParts(f,i).length > 0).length;
  const pieceCount = () => frames().reduce((n,f,i) => n + sceneParts(f,i).length, 0);
  const partsLength = parts => parts.reduce((n,p) => n + (Number(p.duration) || 0), 0);
  const effectFor = frameId => record?.transitions?.[frameId] || null;
  const effectSeconds = effect => effect?.type && effect.type !== 'none'
    ? Math.max(0.3,Math.min(3.5,Number(effect.duration)||0.8)) : 0;
  const totalSeconds = () => frames().reduce((n,f,i) => {
    const parts=sceneParts(f,i);
    return n+partsLength(parts)+(parts.length?effectSeconds(effectFor(frameKey(f,i))):0);
  },5);
  const plannedSeconds = () => frames().reduce((n,f) => n + (Number(f.plannedDuration)||0), 5);
  const currentFrame = () => frames()[activeScene];
  const canExport = () => frames().length === 10 && clipCount() === 10;
  const audioCues = () => Array.isArray(record?.sounds) ? record.sounds : [];
  const savedLabel = () => record?.savedAt ? new Date(record.savedAt).toLocaleString() : 'Not saved yet';

  const getDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('cuts')) req.result.createObjectStore('cuts', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const readCut = id => new Promise((resolve, reject) => {
    const req = db.transaction('cuts', 'readonly').objectStore('cuts').get(id);
    req.onsuccess = () => resolve(req.result || {id, clips:{}, savedAt:0});
    req.onerror = () => reject(req.error);
  });
  const saveCut = () => new Promise((resolve, reject) => {
    const tx = db.transaction('cuts', 'readwrite');
    record.savedAt = Date.now();
    tx.objectStore('cuts').put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  const inform = (message, error = false) => {
    status = message;
    const el = root.querySelector('#fc-notice');
    if (el) {
      el.textContent = message;
      el.className = 'fc-notice' + (error ? ' fc-error' : '');
    }
  };
  const stopPreview = () => {
    previewActive = false;
    if (cancelPlayback) cancelPlayback();
    cancelPlayback = null;
    if(activeSoundSession){activeSoundSession.stop();activeSoundSession=null;}
    const fxCanvas=root.querySelector('#fc-fx-preview');
    if(fxCanvas)fxCanvas.classList.remove('fc-fx-active');
    const el = root.querySelector('#fc-video');
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
  };
  const mode = tab => {
    const final = tab !== 'legacy';
    app.hidden = final;
    root.hidden = !final;
    nav.querySelectorAll('[data-workspace]').forEach(el => {
      el.classList.toggle('is-active', el.dataset.workspace === (final ? 'final' : 'legacy'));
    });
    try { sessionStorage.setItem('offbrief-workspace-mode', final ? 'final' : 'legacy'); } catch (_) {}
  };
  nav.addEventListener('click', e => {
    const button = e.target.closest('[data-workspace]');
    if (!button) return;
    stopPreview();
    mode(button.dataset.workspace);
    window.scrollTo({top:0, behavior:'smooth'});
  });

  const selectEpisode = async key => {
    if (!byKey.has(key) || busy) return;
    stopPreview();
    selected = key;
    activeScene = 0;
    activeTake = 0;
    try {
      record = await readCut(selected);
      status = '';
      render();
    } catch (err) {
      inform('Could not open your local episode. Check browser storage.', true);
    }
  };

  const videoLength = file => new Promise((resolve, reject) => {
    const player = document.createElement('video');
    const url = URL.createObjectURL(file);
    let completed = false;
    const finish = (value, error) => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      player.removeAttribute('src');
      player.load();
      URL.revokeObjectURL(url);
      error ? reject(new Error(error)) : resolve(value);
    };
    const timeout = setTimeout(() => finish(null, 'Could not read this video. Please use a playable MP4 or MOV.'), 18000);
    player.preload = 'metadata';
    player.onloadedmetadata = () => {
      const len = Number(player.duration);
      if (Number.isFinite(len) && len > 0) finish(len, null);
      else finish(null, 'Video has an invalid duration. Please export a standard MP4.');
    };
    player.onerror = () => finish(null, 'Video not supported by this browser. Convert to an H.264 MP4 first.');
    player.src = url;
    player.load();
  });

  const addFiles = async (files, explicitSlot = null, importMode = 'append') => {
    if (!files.length || !record || busy) return;
    busy = true;
    inform('Checking the clips and their scene numbers…');
    const scenes = frames();
    const old = {...currentClips()};
    let added = 0;
    try {
      const nextClips = {...currentClips()};
      let cursor = 0;
      const ordered = explicitSlot === null
        ? files.slice().sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric:true}))
        : files;
      for (const file of ordered) {
        if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm)$/i.test(file.name))
          throw new Error('Import an MP4, MOV or WebM video.');
        const ep = file.name.match(/S(\d{1,2})[-_ ]?E(\d{1,2})/i);
        if (ep) {
          const fromName = 'S'+ep[1].padStart(2,'0')+'E'+ep[2].padStart(2,'0');
          if (fromName !== selected) throw new Error('Wrong episode: '+file.name+' belongs to '+fromName+'. Existing clips were not touched.');
        }
        const match = file.name.match(/(?:^|[^a-z0-9])(?:f|shot|scene)[-_ ]?0?(\d{1,2})(?:[^0-9]|$)/i);
        let index = explicitSlot === null ? (match ? Number(match[1])-1 : -1) : explicitSlot;
        if (explicitSlot === null && (index < 0 || index >= scenes.length)) {
          while (cursor < scenes.length && partList(nextClips[frameKey(scenes[cursor], cursor)]).length) cursor++;
          index = cursor++;
        }
        if (index < 0 || index >= scenes.length) throw new Error('Clip has no valid scene number F01–F10: '+file.name);
        const key = frameKey(scenes[index], index);
        const previous = partList(nextClips[key]);
        const duration = await videoLength(file);
        const item = {blob:file, fileName:file.name, duration, importedAt:Date.now()};
        nextClips[key] = explicitSlot !== null && importMode === 'replace' ? [item] : [...previous, item];
        added++;
        activeScene = index;
        activeTake = nextClips[key].length-1;
      }
      record.clips = nextClips;
      await saveCut();
      if(exportUrl) URL.revokeObjectURL(exportUrl);
      exportUrl = '';
      exportName = '';
      inform(added+' video part(s) saved on this device. Existing parts remain unless replaced explicitly.');
    } catch (err) {
      record.clips = old;
      inform(err?.name === 'QuotaExceededError'
        ? 'Not enough device storage. Existing clips were preserved; keep copies in Drive.'
        : String(err?.message || err), true);
    } finally {
      busy = false;
      render();
    }
  };


  const sourceIn = clip => Math.max(0, Number(clip?.inPoint)||0);
  const sourceOut = clip => sourceIn(clip) + Math.max(0, Number(clip?.duration)||0);
  const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));
  const splitSelected = async () => {
    const original=selectedClip();
    if(!original||busy)return;
    const cut=Number(root.querySelector('#fc-split-point')?.value);
    if(!Number.isFinite(cut)||cut<=0.15||cut>=original.duration-0.15) {
      inform('Choose a cut point inside the clip, at least 0.15 seconds from each edge.',true);
      return;
    }
    stopPreview();
    const key=frameKey(currentFrame(),activeScene);
    const current=selectedParts();
    const before=currentClips()[key];
    const now=sourceIn(original);
    const one={...original,inPoint:now,duration:Number(cut.toFixed(3)),splitPart:'A'};
    const two={...original,inPoint:now+cut,duration:Number((original.duration-cut).toFixed(3)),splitPart:'B'};
    record.clips[key]=[...current.slice(0,activeTake),one,two,...current.slice(activeTake+1)];
    try {
      await saveCut();
      activeTake+=1;
      if(exportUrl)URL.revokeObjectURL(exportUrl);
      exportUrl='';exportName='';
      inform('Split saved: two editable sections from the same original MP4. Neither the video nor its sound was altered.');
    } catch(err) {
      record.clips[key]=before;
      inform('Could not save split. Existing clip was preserved.',true);
    }
    render();
  };
  const playRange = async (video,clip,options={}) => {
    const start=sourceIn(clip);
    const end=clip?sourceOut(clip):null;
    if(start>0.02&&Number.isFinite(end)){
      if(Math.abs(video.currentTime-start)>0.025){
        await new Promise((resolve,reject)=>{
          const t=setTimeout(()=>{video.removeEventListener('seeked',ready);reject(new Error('Seeking to cut point took too long'));},15000);
          const ready=()=>{clearTimeout(t);video.removeEventListener('seeked',ready);resolve();};
          video.addEventListener('seeked',ready,{once:true});
          try{video.currentTime=start;}catch(e){clearTimeout(t);reject(e);}
        });
      }
    }
    return new Promise((resolve,reject)=>{
      let settled=false;
      const clear=()=>{video.removeEventListener('timeupdate',check);video.removeEventListener('ended',finish);video.removeEventListener('error',fail);video.removeEventListener('emptied',finish);};
      const finish=()=>{if(settled)return;settled=true;clear();video.pause();resolve();};
      const fail=()=>{if(settled)return;settled=true;clear();reject(new Error('Video clip could not play.'));};
      const check=()=>{if(end!==null&&video.currentTime>=end-0.035)finish();};
      video.addEventListener('timeupdate',check);
      video.addEventListener('ended',finish);
      video.addEventListener('error',fail);
      video.addEventListener('emptied',finish);
      if(options.registerStop)options.registerStop(finish);
      video.play().then(()=>{if(options.onStarted)options.onStarted();}).catch(err=>{clear();reject(err);});
    });
  };
  const selectedClip = () => {
    const parts = selectedParts();
    return parts[Math.min(activeTake, parts.length-1)] || null;
  };
  const openPreview = async (kind = 'clip') => {
    stopPreview();
    const video=root.querySelector('#fc-video');
    if(!video)return;
    let url, clip=null;
    if(kind==='intro')url=INTRO_SRC;
    else {
      clip=selectedClip();
      if(!clip?.blob){inform('This scene needs a video before it can be previewed.',true);return;}
      previewUrl=URL.createObjectURL(clip.blob);
      url=previewUrl;
    }
    video.src=url;
    video.controls=true;
    video.playsInline=true;
    video.load();
    try {
      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error('Clip could not load')),20000);
        video.onloadedmetadata=()=>{clearTimeout(timeout);resolve();};
        video.onerror=()=>{clearTimeout(timeout);reject(new Error('Video cannot be decoded'));};
      });
      const step=kind==='intro'?fullSequence().find(s=>s.type==='intro')
        :fullSequence().find(s=>s.type==='clip'&&s.frameId===frameKey(currentFrame(),activeScene)&&s.takeIndex===activeTake);
      if(step) {
        activeSoundSession=await createSoundSession();
        await playRange(video,clip,{onStarted:()=>activeSoundSession?.schedule(step)});
      } else await playRange(video,clip);
    } catch(err){inform('Clip preview failed: '+String(err.message||err),true);}
    finally{video.onloadedmetadata=null;video.onerror=null;if(activeSoundSession){activeSoundSession.stop();activeSoundSession=null;}}
  };
  const fullSequence = () => {
    const output = [];
    let time = 0;
    frames().forEach((shot, i) => {
      if (i === 2) {
        output.push({type:'intro',label:'OFF BRIEF · Official intro',duration:5,startSeconds:time});
        time += 5;
      }
      const parts=sceneParts(shot,i);
      parts.forEach((clip,j)=>{
        const duration=Math.max(0,Number(clip.duration)||0);
        output.push({
          type:'clip',frameId:frameKey(shot,i),
          takeIndex:j,label:(shot.title||'Scene '+(i+1))+' · part '+(j+1),
          startSeconds:time,duration,clip
        });
        time += duration;
      });
      const effect=effectFor(frameKey(shot,i));
      if(parts.length && effectSeconds(effect)>0){
        const duration=effectSeconds(effect);
        output.push({
          type:'beat',frameId:frameKey(shot,i),label:'Transition after '+frameKey(shot,i),
          duration,startSeconds:time,fx:{...effect,duration}
        });
        time+=duration;
      }
    });
    return output;
  };
  const soundAbsoluteStart = (cue,sequence) => {
    if(cue.anchor==='episode')return Math.max(0,Number(cue.start)||0);
    const first=sequence.find(x=>x.type==='clip'&&x.frameId===cue.frameId);
    return first ? first.startSeconds+Math.max(0,Number(cue.start)||0) : Infinity;
  };
  const createSoundSession = async (ctx=null,output=null) => {
    const cues=audioCues();
    if(!cues.length)return null;
    const AudioConstructor=window.AudioContext||window.webkitAudioContext;
    if(!AudioConstructor)throw new Error('This browser cannot decode external audio tracks.');
    const ownsContext=!ctx;
    const context=ctx||new AudioConstructor();
    if(context.state==='suspended')await context.resume();
    const route=output||context.destination;
    const entries=[];
    for(const cue of cues){
      if(!cue.blob)continue;
      try{
        const bytes=await cue.blob.arrayBuffer();
        const buffer=await context.decodeAudioData(bytes);
        entries.push({cue,buffer});
      }catch(err){
        if(ownsContext)await context.close().catch(()=>{});
        throw new Error('Audio '+cue.fileName+' could not be decoded; import MP3, WAV or M4A.');
      }
    }
    const sequence=fullSequence();
    const playing=[];
    const engine={
      stop(){
        while(playing.length){try{playing.pop().stop();}catch(_){}}
        if(ownsContext)context.close().catch(()=>{});
      },
      schedule(step){
        const start=Number(step.startSeconds)||0;
        const end=start+Number(step.duration||0);
        if(end<=start)return;
        for(const entry of entries){
          const {cue,buffer}=entry;
          const cueStart=soundAbsoluteStart(cue,sequence);
          const clipStart=Math.max(start,cueStart);
          const clipEnd=Math.min(end,cueStart+buffer.duration);
          const overlap=clipEnd-clipStart;
          if(!Number.isFinite(overlap)||overlap<=0.02)continue;
          const node=context.createBufferSource();
          const gain=context.createGain();
          node.buffer=buffer;
          gain.gain.value=clamp(Number(cue.volume??0.7),0,1);
          node.connect(gain);gain.connect(route);
          const delay=Math.max(0,clipStart-start);
          const sourceOffset=Math.max(0,clipStart-cueStart);
          node.start(context.currentTime+delay,sourceOffset,Math.min(overlap,buffer.duration-sourceOffset));
          playing.push(node);
          node.onended=()=>{const at=playing.indexOf(node);if(at>=0)playing.splice(at,1);};
        }
      }
    };
    return engine;
  };
  const playCut = async () => {
    if(!pieceCount()){inform('Import at least one clip before previewing the assembly.',true);return;}
    stopPreview();
    const video=root.querySelector('#fc-video');
    if(!video)return;
    previewActive=true;
    let stopped=false,finishCurrent=null;
    cancelPlayback=()=>{stopped=true;video.pause();if(finishCurrent)finishCurrent();};
    try {
      activeSoundSession=await createSoundSession();
      let lastStill=null;
      for(const step of fullSequence()){
        if(stopped)break;
        if(step.type==='beat'){
          const canvas=root.querySelector('#fc-fx-preview');
          if(!canvas){inform('Transition preview canvas unavailable.',true);break;}
          inform('Transition: '+step.fx.type+' · '+step.duration.toFixed(1)+' seconds');
          let ctx=null;
          try{
            const AudioConstructor=window.AudioContext||window.webkitAudioContext;
            if(step.fx.accent&&AudioConstructor){
              ctx=new AudioConstructor();
              await ctx.resume();
              accentBeat(ctx,ctx.destination,step);
            }
            await animateBeat(canvas,step,lastStill,{
              preview:true,
              registerStop:fn=>{finishCurrent=fn;},
              onStarted:()=>activeSoundSession?.schedule(step)
            });
          }finally{
            finishCurrent=null;
            if(ctx)ctx.close().catch(()=>{});
          }
          continue;
        }
        const url=step.type==='intro'?INTRO_SRC:URL.createObjectURL(step.clip.blob);
        inform('Playing '+step.label);
        video.src=url;video.controls=true;video.playsInline=true;video.load();
        try{
          await new Promise((resolve,reject)=>{
            const timer=setTimeout(()=>reject(new Error('Clip did not load in time')),20000);
            video.onloadedmetadata=()=>{clearTimeout(timer);resolve();};
            video.onerror=()=>{clearTimeout(timer);reject(new Error('Source is unavailable'));};
          });
          await playRange(video,step.clip,{registerStop:fn=>{finishCurrent=fn;},onStarted:()=>activeSoundSession?.schedule(step)});
          lastStill=snapshotFrame(video);
        }catch(err){
          if(!stopped)inform('Preview interrupted: '+String(err.message||err),true);
          stopped=true;
        }finally{
          finishCurrent=null;video.onloadedmetadata=null;video.onerror=null;
          if(step.type!=='intro')URL.revokeObjectURL(url);
        }
      }
      if(!stopped)inform(canExport()?'Full edit preview finished.':'Partial preview finished. Missing scenes were skipped.');
    }finally{
      if(activeSoundSession){activeSoundSession.stop();activeSoundSession=null;}
      previewActive=false;cancelPlayback=null;
    }
  };
  const drawVideo = (ctx, canvas, video) => {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#191919';
    ctx.fillRect(0,0,w,h);
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return;
    const scale = Math.min(w/video.videoWidth,h/video.videoHeight);
    const dw = video.videoWidth * scale, dh = video.videoHeight * scale;
    ctx.drawImage(video,(w-dw)/2,(h-dh)/2,dw,dh);
  };

  const exportCut = async () => {
    if (busy) return;
    if (!canExport()) { inform('Final export requires all 10 rendered MP4 scene clips. Missing shots are never replaced with stills.', true); return; }
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      inform('This browser cannot record a video canvas. Use a newer Safari or a desktop browser for final export.', true);
      return;
    }
    const type = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(v => MediaRecorder.isTypeSupported(v));
    if (!type) { inform('This browser does not support a playable export format. Keep your source clips and export on another device.', true); return; }
    busy = true;
    stopPreview();
    if (exportUrl) URL.revokeObjectURL(exportUrl);
    exportUrl = '';
    let capture = null, context = null, video = null, recorder = null, raf = 0, finished = null;
    const resolution = exportQuality;
    const width = resolution === '1080' ? 1920 : 1280;
    const height = resolution === '1080' ? 1080 : 720;
    try {
      inform('Preparing final video with the original clip audio. Keep this tab open.');
      const canvas = document.createElement('canvas');
      canvas.width=width; canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});
      if (!ctx) throw new Error('Cannot initialize video rendering.');
      video = document.createElement('video');
      video.playsInline = true;
      video.preload = 'auto';
      video.crossOrigin='anonymous';
      video.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(video);
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('This browser cannot mix the voice tracks.');
      context = new AudioContextClass();
      const audioOut = context.createMediaStreamDestination();
      const audioSource = context.createMediaElementSource(video);
      audioSource.connect(audioOut);
      await context.resume();
      const exportSoundSession=await createSoundSession(context,audioOut);
      activeSoundSession=exportSoundSession;
      capture=canvas.captureStream(30);
      audioOut.stream.getAudioTracks().forEach(track=>capture.addTrack(track));
      const chunks=[];
      finished = new Promise((resolve,reject)=>{
        recorder=new MediaRecorder(capture,{mimeType:type,videoBitsPerSecond:resolution==='1080'?7500000:3800000});
        recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
        recorder.onerror=()=>reject(new Error('Recording failed; please use another supported browser.'));
        recorder.onstop=()=>chunks.length?resolve(new Blob(chunks,{type:type.split(';')[0]})):reject(new Error('Export ended with no video data.'));
      });
      drawVideo(ctx,canvas,video);
      recorder.start(1000);
      let shotIndex=0;
      const allSteps = fullSequence();
      let lastStill=null;
      for (const step of allSteps) {
        shotIndex++;
        if(step.type==='beat'){
          inform('Rendering transition '+shotIndex+'/'+allSteps.length+' · '+step.fx.type);
          accentBeat(context,audioOut,step);
          await animateBeat(canvas,step,lastStill,{onStarted:()=>activeSoundSession?.schedule(step)});
          continue;
        }
        const url=step.type==='intro'?INTRO_SRC:URL.createObjectURL(step.clip.blob);
        video.src=url;
        video.load();
        await new Promise((resolve,reject)=>{
          const tm=setTimeout(()=>reject(new Error('Video did not load: '+step.label)),25000);
          video.onloadeddata=()=>{clearTimeout(tm);resolve();};
          video.onerror=()=>{clearTimeout(tm);reject(new Error('Cannot decode: '+step.label));};
        });
        if(step.clip&&sourceIn(step.clip)>0.02){
          await new Promise((resolve,reject)=>{
            const timer=setTimeout(()=>reject(new Error('Could not seek to split point')),15000);
            const ready=()=>{clearTimeout(timer);video.removeEventListener('seeked',ready);resolve();};
            video.addEventListener('seeked',ready,{once:true});
            video.currentTime=sourceIn(step.clip);
          });
        }
        drawVideo(ctx,canvas,video);
        inform('Rendering '+shotIndex+'/'+allSteps.length+' · '+step.label+' — keep the tab open');
        let running=true;
        const paint=()=>{if(!running)return;drawVideo(ctx,canvas,video);raf=requestAnimationFrame(paint);};
        paint();
        try {
          await playRange(video,step.clip,{onStarted:()=>activeSoundSession?.schedule(step)});
          lastStill=snapshotFrame(video);
        } finally {
          running=false;
          cancelAnimationFrame(raf);
          video.onended=null;
        }
        if(step.type!=='intro') URL.revokeObjectURL(url);
      }
      if (recorder.state==='recording') recorder.stop();
      const blob=await finished;
      if(blob.size<1000) throw new Error('Export is too small to be valid.');
      exportUrl=URL.createObjectURL(blob);
      const suffix=type.startsWith('video/mp4')?'mp4':'webm';
      exportName='OFFBRIEF_'+selected+'_FINAL_CUT_'+resolution+'p.'+suffix;
      inform('Export ready with video and audio. Download and verify it before publishing on YouTube.');
    } catch (err) {
      if (recorder?.state==='recording') recorder.stop();
      inform('Export not completed: '+String(err?.message||err),true);
    } finally {
      cancelAnimationFrame(raf);
      if(video){video.pause();video.remove();}
      if(activeSoundSession){activeSoundSession.stop();activeSoundSession=null;}
      if(context)context.close().catch(()=>{});
      if(capture)capture.getTracks().forEach(t=>t.stop());
      busy=false;
      render();
    }
  };


  const snapshotFrame = video => {
    if(!video || video.readyState < 2 || !video.videoWidth)return null;
    const frame=document.createElement('canvas');
    frame.width=960;frame.height=540;
    const c=frame.getContext('2d',{alpha:false});
    drawVideo(c,frame,video);
    return frame;
  };

  // Extra original graphics for editorial pauses. Shared by preview and video export.
  const drawNewPause = (ctx,canvas,step,progress,still) => {
    const fx=step.fx||{},type=fx.type;
    if(!['zoom','glitch','flash','wipe','slide','stamp','typing','countdown','ticker'].includes(type))return false;
    const w=canvas.width,h=canvas.height,p=clamp(progress,0,1);
    const amount=clamp(Number(fx.strength??55)/100,0.1,1);
    const ease=1-Math.pow(1-p,3);
    const dark='#191919',yellow='#F2D85B',ivory='#FAF8F3',blue='#8CB7CC';
    const captions={zoom:'DID THAT JUST HAPPEN?',glitch:'TECHNICAL DIFFICULTIES',flash:'OH NO.',wipe:'NEXT CONCEPT',slide:'BEHIND THE SCENES',stamp:'WAIT. WHAT?',typing:'ONE SECOND...',countdown:'COMING UP',ticker:'BREAKING CREATIVE NEWS'};
    const title=String(fx.title||captions[type]).slice(0,70).toUpperCase();
    const fill=(color,x=0,y=0,a=w,b=h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,a,b);};
    const image=(scale=1,dx=0)=>{
      if(!still){fill(ivory);return;}
      const dw=w*scale,dh=h*scale;
      ctx.drawImage(still,(w-dw)/2+dx,(h-dh)/2,dw,dh);
    };
    const txt=(value,x,y,size,color,max=w*0.86,center=false)=>{
      ctx.font='900 '+Math.round(size)+'px Arial, sans-serif';
      ctx.textAlign=center?'center':'left';
      ctx.fillStyle=color;
      ctx.fillText(value,x,y,max);
    };
    fill(dark);
    if(type==='zoom'){
      image(1+amount*0.18*ease);
      fill('rgba(25,25,25,0.6)',0,h*0.73,w,h*0.27);
      fill(yellow,w*0.07,h*0.775,w*0.10,h*0.009);
      txt(title,w*0.07,h*0.90,h*0.075,yellow);
    } else if(type==='glitch'){
      image(1.012);
      if(still){
        for(let j=0;j<9;j++){
          const y=j*h/9,shift=Math.sin(p*15+j*7.3);
          if(shift>0.1){
            ctx.save();ctx.beginPath();ctx.rect(0,y,w,h/9);ctx.clip();
            ctx.globalAlpha=0.75;
            ctx.drawImage(still,shift*amount*w*0.05,0,w,h);
            ctx.restore();
          }
        }
      }
      fill('rgba(25,25,25,0.65)',0,h*0.77,w,h*0.23);
      fill(blue,w*0.07,h*0.8,w*0.7*ease,h*0.009);
      txt(title,w*0.07,h*0.90,h*0.06,ivory);
    } else if(type==='flash'){
      image();
      // Single gentle pulse instead of rapid flashing.
      fill('rgba(250,248,243,'+(0.11+0.65*Math.sin(Math.PI*p)*amount)+')');
      fill(yellow,0,h*0.39,w*Math.min(1,p*5),h*0.20);
      txt(title,w*0.07,h*0.53,h*0.09,dark);
    } else if(type==='wipe'||type==='slide'){
      image();
      const x=w*(1-ease);
      fill(type==='wipe'?ivory:dark,x,0,w-x,h);
      fill(yellow,x,h*0.06,w*0.025,h*0.88);
      if(p>0.22){
        txt('OFF BRIEF',w*0.07,h*0.24,h*0.055,type==='wipe'?dark:yellow);
        txt(title,w*0.07,h*0.57,h*0.09,type==='wipe'?dark:ivory);
      }
    } else if(type==='stamp'){
      image();
      fill('rgba(25,25,25,0.36)');
      ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-0.13);
      ctx.fillStyle=yellow;ctx.beginPath();
      const scale=Math.min(1,p*5);
      ctx.ellipse(0,0,w*0.34*scale,h*0.23*scale,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=dark;ctx.lineWidth=w*0.005;ctx.stroke();
      txt(title,0,h*0.03,h*0.093,dark,w*0.62,true);
      ctx.restore();
    } else if(type==='typing'){
      fill(ivory);fill(yellow,w*0.07,h*0.13,w*0.1,h*0.01);
      txt('OFF BRIEF',w*0.07,h*0.23,h*0.055,dark);
      fill(dark,w*0.06,h*0.35,w*0.88,h*0.30);
      txt(title.slice(0,Math.floor(title.length*Math.min(1,p*1.55))),w*0.09,h*0.55,h*0.08,yellow,w*0.80);
    } else if(type==='countdown'){
      fill(dark);
      const num=Math.max(1,3-Math.floor(Math.min(p,0.999)*3));
      txt(String(num),w/2,h*0.66,h*0.43,yellow,w*0.7,true);
      txt(title,w/2,h*0.87,h*0.064,ivory,w*0.8,true);
    } else if(type==='ticker'){
      image();fill('rgba(25,25,25,0.4)');
      fill(dark,0,h*0.70,w,h*0.3);
      fill(yellow,0,h*0.70,w,h*0.075);
      txt('OFF BRIEF / NEWS FLASH',w*0.06,h*0.76,h*0.043,dark);
      txt(title,w*(0.05+(1-p)*0.20),h*0.91,h*0.073,ivory,w*0.9);
    }
    return true;
  };
  const drawBeat = (ctx,canvas,step,progress,still) => {
    const w=canvas.width,h=canvas.height;
    const fx=step.fx||{};
    const kind=fx.type||'fade';
    const title=(fx.title || (kind==='freeze'?'AWKWARD PAUSE':'UP NEXT')).trim().slice(0,70);
    const p=clamp(progress,0,1);
    const ivory='#FAF8F3',yellow='#F2D85B',dark='#191919';
    if(drawNewPause(ctx,canvas,step,progress,still))return;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle=dark;ctx.fillRect(0,0,w,h);
    const drawStill=(scale=1)=>{
      if(!still){ctx.fillStyle=ivory;ctx.fillRect(0,0,w,h);return;}
      const dw=w*scale,dh=h*scale;
      ctx.drawImage(still,(w-dw)/2,(h-dh)/2,dw,dh);
    };
    if(kind==='fade'){
      drawStill();
      ctx.fillStyle='rgba(25,25,25,'+Math.min(1,p*2.6)+')';
      ctx.fillRect(0,0,w,h);
      return;
    }
    if(kind==='freeze'){
      drawStill(1+0.035*p);
      ctx.fillStyle='rgba(25,25,25,0.58)';
      ctx.fillRect(0,h*0.77,w,h*0.23);
      ctx.fillStyle=yellow;
      ctx.fillRect(w*0.07,h*0.79,w*0.06,h*0.009);
      ctx.font='800 '+Math.round(h*0.07)+'px Arial, sans-serif';
      ctx.textAlign='left';
      ctx.fillText(title.toUpperCase(),w*0.07,h*0.9,w*0.87);
      return;
    }
    const yellowCard=kind==='chapter';
    ctx.fillStyle=yellowCard?ivory:dark;
    ctx.fillRect(0,0,w,h);
    const inset=w*0.075;
    ctx.fillStyle=yellow;
    ctx.fillRect(inset,h*0.16,w*0.08,h*0.012);
    ctx.fillStyle=yellowCard?dark:yellow;
    ctx.textAlign='left';
    ctx.font='800 '+Math.round(h*0.044)+'px Arial, sans-serif';
    ctx.fillText('OFF BRIEF',inset,h*0.28,w*0.8);
    const label=title.toUpperCase();
    const words=label.split(/\s+/);
    const lines=[];let line='';
    for(const word of words){
      if((line+' '+word).length>22 && line){lines.push(line);line=word;}
      else line=line?line+' '+word:word;
    }
    if(line)lines.push(line);
    ctx.font='900 '+Math.round(h*0.105)+'px Arial, sans-serif';
    ctx.fillStyle=yellowCard?dark:ivory;
    (lines.slice(0,3)).forEach((v,i)=>ctx.fillText(v,inset,h*(0.49+i*0.125),w*0.85));
    ctx.fillStyle=yellow;
    const width=Math.max(12,w*0.65*Math.min(1,p*2));
    ctx.fillRect(inset,h*0.83,width,h*0.012);
    ctx.fillStyle=yellowCard?'#625f58':'#D9D3C4';
    ctx.font='500 '+Math.round(h*0.029)+'px Arial, sans-serif';
    ctx.fillText('A NEW MOMENT · THE STORY CONTINUES',inset,h*0.93,w*0.85);
  };
  const accentBeat = (ctx,dest,step) => {
    if(!step.fx?.accent || !ctx)return;
    const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+0.015;
    osc.type='sine';
    osc.frequency.setValueAtTime(step.fx.type==='freeze'?540:680,t);
    osc.frequency.exponentialRampToValueAtTime(300,t+0.085);
    gain.gain.setValueAtTime(0.001,t);
    gain.gain.exponentialRampToValueAtTime(0.09,t+0.018);
    gain.gain.exponentialRampToValueAtTime(0.001,t+0.13);
    osc.connect(gain);gain.connect(dest||ctx.destination);
    osc.start(t);osc.stop(t+0.14);
  };
  const animateBeat = (canvas,step,still,options={}) => new Promise(resolve=>{
    const ctx=canvas.getContext('2d',{alpha:false});
    const duration=Math.max(0.3,Number(step.duration)||0.8)*1000;
    let frame=0,done=false;
    const start=performance.now();
    if(options.preview)canvas.classList.add('fc-fx-active');
    if(options.onStarted)options.onStarted();
    const stop=()=>{
      if(done)return;
      done=true;
      cancelAnimationFrame(frame);
      if(options.preview)canvas.classList.remove('fc-fx-active');
      resolve();
    };
    if(options.registerStop)options.registerStop(stop);
    const tick=now=>{
      if(done)return;
      const elapsed=now-start;
      drawBeat(ctx,canvas,step,elapsed/duration,still);
      if(elapsed>=duration)stop();
      else frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
  });
  const updateTransition = async (prop,value) => {
    if(busy)return;
    const current=currentFrame(),key=frameKey(current,activeScene);
    const previous=record.transitions||{};
    const before=previous[key]||{type:'none',duration:0.8,title:'',accent:false};
    let after={...before,[prop]:value};
    if(prop==='type'){
      if(value==='freeze')after={...after,duration:0.9,title:after.title||'AWKWARD PAUSE'};
      if(value==='chapter')after={...after,duration:1.4,title:after.title||'COMING UP'};
      if(value==='black')after={...after,duration:1.0,title:after.title||'NEXT SCENE'};
      if(value==='fade')after={...after,duration:0.5,title:''};
      const presets={
        zoom:[0.8,'DID THAT JUST HAPPEN?'],glitch:[0.65,'TECHNICAL DIFFICULTIES'],
        flash:[0.5,'OH NO.'],wipe:[1.0,'NEXT CONCEPT'],
        slide:[0.9,'BEHIND THE SCENES'],stamp:[0.8,'WAIT. WHAT?'],
        typing:[1.4,'ONE SECOND...'],countdown:[1.8,'COMING UP'],
        ticker:[1.2,'BREAKING CREATIVE NEWS']
      };
      if(presets[value]){
        const [duration,title]=presets[value];
        after={...after,duration,title:after.title||title,strength:Number(after.strength??55)};
      }
    }
    record.transitions={...previous,[key]:after};
    if(value==='none'&&prop==='type')delete record.transitions[key];
    try{
      await saveCut();
      if(exportUrl)URL.revokeObjectURL(exportUrl);
      exportUrl='';exportName='';
      inform(after.type==='none'?'Transition removed.':'Transition saved after '+key+'. The original video stays unchanged.');
    }catch(err){
      record.transitions=previous;
      inform('Could not save transition. Your earlier edit is unchanged.',true);
    }
    render();
  };
  const transitionPanelHTML = () => {
    const key=frameKey(currentFrame(),activeScene);
    const fx=effectFor(key)||{type:'none',duration:0.8,title:'',accent:false};
    const active=fx.type!=='none',secondsLong=effectSeconds(fx);
    const types=[
      ['none','Straight cut'],['fade','Soft fade'],['freeze','Comedy freeze'],
      ['chapter','Chapter card'],['black','Dark pause'],
      ['zoom','Punch zoom'],['glitch','Mini glitch'],['flash','Soft flash'],
      ['wipe','Ivory wipe'],['slide','Side slide'],['stamp','Reaction stamp'],
      ['typing','Type-on title'],['countdown','3 · 2 · 1'],['ticker','News ticker']
    ];
    return '<div class="fc-effects-editor"><div class="fc-kicker">PAUSES & TRANSITIONS</div>'+
      '<h3>Make the beat land.</h3><p>Place an animated transition after all clips in '+escapeHtml(key)+', before the next scene. Designed for comedic timing and small presentation breaks.</p>'+
      '<div class="fc-fx-picker">'+types.map(([type,label])=>'<button type="button" class="'+(fx.type===type?'selected':'')+'" data-fc="fx-type" data-type="'+type+'">'+label+'</button>').join('')+'</div>'+
      (active?'<div class="fc-fx-config"><label for="fc-fx-duration">Pause: <output id="fc-fx-time">'+secondsLong.toFixed(1)+'</output> sec</label><input id="fc-fx-duration" type="range" min="0.3" max="3.5" step="0.1" value="'+secondsLong+'">'+
      (fx.type==='fade'?'':'<label for="fc-fx-title">Title / comic moment</label><input id="fc-fx-title" type="text" maxlength="70" placeholder="e.g. CONCEPT 01 · THE PITCH" value="'+escapeHtml(fx.title||'')+'">')+
      '<label for="fc-fx-strength">Effect intensity: <output id="fc-fx-strength-output">'+Math.round(clamp(Number(fx.strength??55),10,100))+'</output>%</label>'+
      '<input id="fc-fx-strength" type="range" min="10" max="100" step="5" value="'+Math.round(clamp(Number(fx.strength??55),10,100))+'">'+
      '<label class="fc-fx-accent"><input id="fc-fx-accent" type="checkbox" '+(fx.accent?'checked':'')+'> Add a subtle original sound accent</label>'+
      '<div class="fc-fx-actions"><button type="button" data-fc="fx-preview">Preview this pause</button><span>'+secondsLong.toFixed(1)+'s added to the edit</span></div></div>':
      '<div class="fc-fx-none">No extra pause after this scene. Tap an effect to add one.</div>')+
      '<small>Use Comedy freeze for awkward moments; Chapter card for a class-style section break. Each episode has its own saved transitions.</small></div>';
  };
  const previewTransition = async () => {
    const key=frameKey(currentFrame(),activeScene);
    const fx=effectFor(key);
    if(!effectSeconds(fx))return;
    const video=root.querySelector('#fc-video');
    let snap=snapshotFrame(video);
    stopPreview();
    const canvas=root.querySelector('#fc-fx-preview');
    if(!canvas)return;
    const step={type:'beat',fx,duration:effectSeconds(fx),startSeconds:0,label:'Preview pause'};
    let ctx=null;
    try{
      const AudioConstructor=window.AudioContext||window.webkitAudioContext;
      if(fx.accent&&AudioConstructor){ctx=new AudioConstructor();await ctx.resume();accentBeat(ctx,ctx.destination,step);}
      await animateBeat(canvas,step,snap,{preview:true});
      inform('Pause preview complete. This effect will appear after '+key+' in the assembled episode.');
    }catch(err){inform('Could not preview the effect: '+String(err.message||err),true);}
    finally{if(ctx)ctx.close().catch(()=>{});canvas.classList.remove('fc-fx-active');}
  };
  const audioLength = file => new Promise((resolve,reject)=>{
    const a=document.createElement('audio'),url=URL.createObjectURL(file);
    const timer=setTimeout(()=>finish(null,new Error('Audio file took too long to load')),20000);
    let done=false;
    const finish=(value,error)=>{
      if(done)return;done=true;clearTimeout(timer);
      a.removeAttribute('src');a.load();URL.revokeObjectURL(url);
      error?reject(error):resolve(value);
    };
    a.preload='metadata';
    a.onloadedmetadata=()=>Number.isFinite(a.duration)&&a.duration>0?finish(a.duration):finish(null,new Error('Audio has an invalid duration'));
    a.onerror=()=>finish(null,new Error('Cannot open audio; use MP3, WAV or M4A.'));
    a.src=url;a.load();
  });
  const importSound = async file => {
    if(!file||busy)return;
    if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|aac|ogg)$/i.test(file.name)){
      inform('Choose an audio file: MP3, WAV, M4A, AAC or OGG.',true);return;
    }
    const scope=root.querySelector('#fc-sound-scope')?.value||'scene';
    const kind=root.querySelector('#fc-sound-kind')?.value||'voice';
    busy=true;
    try{
      const duration=await audioLength(file);
      const old=audioCues().slice();
      const cue={
        id:'sound-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),
        blob:file,fileName:file.name,kind,
        anchor:scope,frameId:scope==='scene'?frameKey(currentFrame(),activeScene):null,
        start:0,volume:kind==='music'?0.2:0.75,duration
      };
      record.sounds=[...old,cue];
      try{
        await saveCut();
        inform('Sound added and saved locally. Set its start time and volume below.');
      }catch(err){record.sounds=old;throw err;}
    }catch(err){
      inform(err?.name==='QuotaExceededError'
        ? 'Not enough space to save this audio. Other clips and tracks are unchanged.'
        : 'Audio import failed: '+String(err?.message||err),true);
    }finally{busy=false;render();}
  };
  const updateSound = async (id,property,value) => {
    if(busy)return;
    const old=audioCues();
    const cue=old.find(x=>x.id===id);
    if(!cue)return;
    const updated=old.map(x=>x.id!==id?x:{...x,[property]:value});
    record.sounds=updated;
    try{
      await saveCut();
      inform('Sound settings saved. Playback and export use the updated timing.');
    }catch(err){record.sounds=old;inform('Could not save audio settings.',true);}
    render();
  };
  const removeSound = async id => {
    if(busy)return;
    const old=audioCues();
    if(!old.find(x=>x.id===id))return;
    if(!confirm('Remove this sound from the edit? The original file will not be deleted.'))return;
    stopPreview();
    record.sounds=old.filter(x=>x.id!==id);
    try{await saveCut();inform('Sound removed from this edit.');}
    catch(err){record.sounds=old;inform('Could not save removal.',true);}
    render();
  };
  const soundEditorHTML = () => {
    const cues=audioCues();
    const visible=cues.filter(c=>c.anchor==='episode'||c.frameId===frameKey(currentFrame(),activeScene));
    return '<div class="fc-sound-editor"><div class="fc-kicker">SOUND / AUDIO TRACKS</div><h3>Voices, music & effects</h3><p>Layer audio over the existing sound of your Higgsfield video. These tracks are non-destructive.</p>'+
      '<div class="fc-sound-add"><label>Track type<select id="fc-sound-kind"><option value="voice">Voice</option><option value="music">Background music</option><option value="sfx">Sound effect</option></select></label><label>Placement<select id="fc-sound-scope"><option value="scene">Selected scene</option><option value="episode">Entire episode</option></select></label></div>'+
      '<label class="fc-sound-upload" for="fc-sound-file">＋ Add audio file (MP3 / WAV / M4A)</label><input type="file" id="fc-sound-file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg" hidden>'+
      (visible.length?'<div class="fc-sound-list">'+visible.map(c=>{
        const volume=Math.round(clamp(Number(c.volume??0.7),0,1)*100);
        const limit=c.anchor==='scene'?Math.max(5,Number(currentFrame()?.plannedDuration||30)+20):300;
        return '<div class="fc-sound-track"><div class="fc-sound-name"><b>'+escapeHtml(c.kind.toUpperCase())+' · '+escapeHtml(c.fileName)+'</b><button type="button" data-fc="remove-sound" data-id="'+escapeHtml(c.id)+'">Remove</button></div><small>'+(c.anchor==='episode'?'Full episode':'Scene '+escapeHtml(c.frameId))+' · '+seconds(c.duration)+'</small>'+
          '<label>Start '+Number(c.start||0).toFixed(1)+'s <input type="number" min="0" max="'+limit+'" step="0.1" data-fc-sound-setting="start" data-id="'+escapeHtml(c.id)+'" value="'+Number(c.start||0).toFixed(1)+'"></label>'+
          '<label>Volume '+volume+'% <input type="range" min="0" max="100" step="5" data-fc-sound-setting="volume" data-id="'+escapeHtml(c.id)+'" value="'+volume+'"></label></div>';
      }).join('')+'</div>':'<div class="fc-sound-empty">No added audio tracks for this scene yet. The original clip audio is kept.</div>')+
      '<small>Scene tracks start relative to the first part of that scene. Episode tracks start at the beginning of the timeline. Sound tracks are saved on this device, not uploaded to Drive.</small></div>';
  };
  const scriptText = f => {
    const lines=(f.dialogue||[]).map(d=>(d.character||'Character')+': '+d.text);
    return lines.join('\n') || 'No dialogue in this shot.';
  };
  const render = () => {
    if(!record){root.innerHTML='<p>Opening Final Cut…</p>';return;}
    const ep=meta();
    const shots=frames();
    const clip=selectedClip();
    const takes=selectedParts();
    const count=clipCount();
    const pieces=pieceCount();
    const actual=totalSeconds();
    const expected=plannedSeconds();
    const shotSeconds=partsLength(takes);
    const canvasLink=CANVASES[selected]?'https://higgsfield.ai/canvas/'+CANVASES[selected]:'https://higgsfield.ai/';
    root.innerHTML = '<div class="fc-shell">' +
      '<div class="fc-header"><div class="fc-kicker">PRIVATE PRODUCTION / FINAL CUT</div><div class="fc-header-row"><div><h1>From Google Flow to <em>YouTube.</em></h1><p>Render original scenes in Google Flow, then edit them here with sound, split, pauses, and the approved intro.</p></div>' +
      '<div class="fc-links"><a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(canvasLink)+'">Higgsfield reference</a><a target="_blank" rel="noopener noreferrer" href="'+DRIVE_PREVIEWS+'">Drive previews</a><a target="_blank" rel="noopener noreferrer" href="'+OFF_BRIEF_CHANNEL_URL+'">OFF BRIEF YouTube</a></div></div></div>' +
      '<div class="fc-layout"><aside class="fc-side"><label for="fc-episode" class="fc-label">SEASON / EPISODE</label><select id="fc-episode">'+catalog.map(m=>'<option value="'+keyFor(m)+'" '+(selected===keyFor(m)?'selected':'')+'>'+keyFor(m).replace('S','Season ').replace('E',' · Episode ')+' — '+escapeHtml(m.title)+'</option>').join('')+'</select>' +
      '<div class="fc-progress"><strong>'+count+'<span>/10</span></strong><p>story scenes ready · '+pieces+' video parts</p><div class="fc-meter"><span style="width:'+(count*10)+'%"></span></div><small>Saved locally on this device. No render credits are spent here.</small></div>' +
      '<div class="fc-rules"><h3>Episode order</h3><div>01 · Comedic cold open (F01–F02)</div><div class="fc-yellow">02 · Official intro (5 sec)</div><div>03 · Story and payoff (F03–F10)</div><p>The official intro is already installed. Do not upload an old 6-second bumper.</p></div>' +
      '<label class="fc-upload-all" for="fc-all-files"><b>Import Google Flow videos</b><span>MP4 / MOV with scene labels F01–F10. You can add several parts per scene.</span></label><input type="file" id="fc-all-files" accept="video/*,.mp4,.mov,.m4v,.webm" multiple hidden>' +
      '<div class="fc-link-note"><b>Original sources</b><a href="'+escapeHtml(ep.drive||'https://drive.google.com/drive/folders/1Ym_Tqov970lP2K_4trIBr4dpj1FhGRIh')+'" target="_blank" rel="noopener noreferrer">Open scene photo folder</a></div></aside>' +
      '<div class="fc-middle"><div class="fc-section-head"><div><span class="fc-kicker">01 / STORY ORDER</span><h2>'+escapeHtml(ep.title)+'</h2></div><span>'+seconds(actual)+' actual / '+seconds(expected)+' scripted</span></div>' +
      '<div class="fc-runtime"><b>'+pieces+' video parts</b><span>'+(actual<90?'This cut is shorter than the original 90–120 second script. Add more Higgsfield parts to each scene.':'Check timing, action and voices against the script.')+'</span></div>' +
      '<div class="fc-shot-grid">'+shots.map((f,i)=>{
        const k=frameKey(f,i), parts=sceneParts(f,i), ok=parts.length>0;
        const role=i<2?'COLD OPEN':(f.beat||'STORY');
        const html='<button class="fc-shot '+(activeScene===i?'selected ':'')+(ok?'has-video':'is-missing')+'" data-fc="shot" data-index="'+i+'" type="button"><span class="fc-shot-num">'+k.replace(/^.*F/,'F')+'</span><span class="fc-shot-label"><b>'+escapeHtml(f.title||'Scene '+(i+1))+'</b><small>'+escapeHtml(role)+' · '+(ok?parts.length+' video part(s) · '+seconds(partsLength(parts)):'awaiting Higgsfield MP4')+'</small></span><span class="fc-check">'+(ok?'✓':'＋')+'</span></button>';
        return i===2?'<div class="fc-intro-rail"><span>OFF BRIEF · OFFICIAL VIDEO INTRO</span><b>5 sec · audio included</b><button type="button" data-fc="intro">Preview intro</button></div>'+html:html;
      }).join('')+'</div>' +
      '<div class="fc-preview"><div class="fc-section-head"><div><span class="fc-kicker">02 / REVIEW</span><h2>Preview before export</h2></div><span>16:9 · voice + effects</span></div><div class="fc-preview-stage"><video id="fc-video" controls playsinline preload="metadata"></video><canvas id="fc-fx-preview" width="1280" height="720" aria-hidden="true"></canvas></div><div class="fc-preview-actions"><button type="button" data-fc="preview-shot" '+(!takes.length?'disabled':'')+'>Play selected part</button><button type="button" data-fc="play-cut" '+(!pieces?'disabled':'')+'>'+(canExport()?'Preview whole episode':'Preview assembled scenes')+'</button></div></div></div>' +
      '<aside class="fc-inspector"><div class="fc-kicker">03 / DIRECTOR NOTES</div><h2>'+escapeHtml(currentFrame()?.title||'Scene')+'</h2><p class="fc-beat">'+escapeHtml(currentFrame()?.beat||'')+'</p><div class="fc-detail"><b>Shot direction</b><p>'+escapeHtml(currentFrame()?.action||'')+'</p></div><div class="fc-detail"><b>Original dialogue</b><pre>'+escapeHtml(scriptText(currentFrame()||{}))+'</pre></div><div class="fc-detail"><b>Scene runtime</b><p>'+shotSeconds.toFixed(1)+' sec imported / '+Number(currentFrame()?.plannedDuration||0).toFixed(1)+' sec scripted</p></div>' +
      '<div class="fc-flow-workflow"><div class="fc-kicker">GOOGLE FLOW / APPROVED SCENE</div><h3>Animate the next take</h3><p>Upload the approved still to Google Flow and paste these original script directions. Keep titles and pauses in Final Cut.</p><div class="fc-flow-actions"><a href="https://flow.google.com" target="_blank" rel="noopener noreferrer">Open Google Flow</a><button type="button" data-fc="copy-flow-prompt">Copy Flow scene prompt</button></div><textarea id="fc-flow-prompt" class="fc-flow-copy-fallback" hidden readonly aria-label="Flow prompt"></textarea><small>Use F01–F10 in filenames. Connected takes use A, B, C. Original media stays in your private Drive; this app does not auto-generate videos inside Flow.</small></div>' +
      '<label class="fc-import-bulk" for="fc-all-files">＋ Import finished Google Flow clips</label>' +
      '<label class="fc-upload-single" for="fc-single-file">'+(takes.length?'Replace all parts of this scene':'Import first scene video')+'</label><input id="fc-single-file" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" hidden>'+
      '<label class="fc-upload-extra" for="fc-extra-file">＋ Add another part (keep existing)</label><input id="fc-extra-file" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" hidden>'+
      (clip&&clip.duration>0.4?'<div class="fc-split"><div class="fc-kicker">CUT / SPLIT VIDEO</div><p>Split the selected part without editing the original file or its audio.</p><label for="fc-split-point">Cut at <output id="fc-split-output">'+(clip.duration/2).toFixed(2)+'</output> seconds within this part</label><input type="range" id="fc-split-point" min="0.15" max="'+(clip.duration-0.15).toFixed(3)+'" step="0.05" value="'+(clip.duration/2).toFixed(2)+'"><div class="fc-split-actions"><button type="button" data-fc="split-at-playhead">Use playhead</button><button type="button" data-fc="split-video">Split here</button></div></div>':'')+
      (takes.length?'<div class="fc-part-list">'+takes.map((part,i)=>'<div class="fc-file '+(i===activeTake?'is-selected':'')+'"><button type="button" class="fc-part-pick" data-fc="take" data-index="'+i+'"><b>Part '+(i+1)+' · '+escapeHtml(part.fileName)+'</b><span>'+seconds(part.duration)+' · sound preserved</span></button><button type="button" data-fc="remove-take" data-index="'+i+'">Remove</button></div>').join('')+'</div>':'<p class="fc-muted">No rendered videos have been imported for this scene.</p>')+
      transitionPanelHTML()+
      soundEditorHTML()+
      '<div class="fc-export"><div class="fc-kicker">04 / FINAL EXPORT</div><label for="fc-quality">Resolution</label><select id="fc-quality"><option value="1080" '+(exportQuality==='1080'?'selected':'')+'>1080p · YouTube</option><option value="720" '+(exportQuality==='720'?'selected':'')+'>720p · smaller file</option></select><button type="button" data-fc="export" '+(!canExport()||busy?'disabled':'')+'>Export completed episode</button>'+
      '<small>Export requires footage for all 10 scenes; each may have multiple parts. Original spoken audio stays with the clips. MP4 where supported; otherwise WebM. Keep Safari open.</small>' +
      (exportUrl?'<a class="fc-download" href="'+exportUrl+'" download="'+escapeHtml(exportName)+'">Download '+escapeHtml(exportName)+'</a>':'')+'</div></aside></div>' +
      '<nav class="fc-mobile-dock" aria-label="Mobile editing tools">' +
        [['clips','Clips'],['audio','Audio'],['effects','Pauses'],['flow','Flow'],['script','Script'],['export','Export']].map(([key,label])=>
          '<button type="button" data-fc-panel="'+key+'" aria-selected="'+(mobilePanel===key)+'" class="'+(mobilePanel===key?'active':'')+'">'+label+'</button>'
        ).join('')+
      '</nav>' +
      '<div class="fc-footer"><span id="fc-notice" class="fc-notice">'+escapeHtml(status)+'</span><small>Saved: '+escapeHtml(savedLabel())+' · Powered by The Launch Era</small></div></div>';
    root.dataset.mobilePanel = mobilePanel;
  };

  root.addEventListener('click', async e => {
    const panelButton=e.target.closest('[data-fc-panel]');
    if (panelButton) {
      const next=panelButton.dataset.fcPanel;
      if (!['clips','audio','effects','flow','script','export'].includes(next)) return;
      mobilePanel=next;
      try { sessionStorage.setItem('offbrief-mobile-panel',next); } catch (_) {}
      root.dataset.mobilePanel=next;
      root.querySelectorAll('[data-fc-panel]').forEach(button=>{
        const active=button.dataset.fcPanel===next;
        button.classList.toggle('active',active);
        button.setAttribute('aria-selected',String(active));
      });
      const inspector=root.querySelector('.fc-inspector');
      if (inspector && window.matchMedia('(max-width: 700px)').matches) {
        inspector.scrollIntoView({block:'nearest',behavior:'smooth'});
      }
      return;
    }
    const b=e.target.closest('[data-fc]');
    if(!b || busy) return;
    const action=b.dataset.fc;
    if(action==='shot'){stopPreview();activeScene=Number(b.dataset.index);activeTake=0;render();}
    if(action==='take'){stopPreview();activeTake=Number(b.dataset.index);render();}
    if(action==='copy-flow-prompt'){
      const prompt=generateGoogleFlowPrompt(meta(),currentFrame(),selected);
      try {
        await navigator.clipboard.writeText(prompt);
        inform('Flow prompt copied. Paste it alongside the original approved scene image.');
      } catch(err) {
        const field=root.querySelector('#fc-flow-prompt');
        if(field){field.hidden=false;field.value=prompt;field.focus();field.select();}
        inform('Clipboard unavailable; copy the selected prompt manually from the text field.',true);
      }
      return;
    }
    if(action==='split-video'){await splitSelected();return;}
    if(action==='fx-type'){await updateTransition('type',b.dataset.type);return;}
    if(action==='fx-preview'){await previewTransition();return;}
    if(action==='remove-sound'){await removeSound(b.dataset.id);return;}
    if(action==='split-at-playhead'){
      const player=root.querySelector('#fc-video');
      const slider=root.querySelector('#fc-split-point');
      if(!player||!slider||!selectedClip())return;
      const cut=clamp(player.currentTime-sourceIn(selectedClip()),0.15,selectedClip().duration-0.15);
      slider.value=cut.toFixed(2);
      const output=root.querySelector('#fc-split-output');if(output)output.textContent=cut.toFixed(2);
      inform('Cut point moved to '+cut.toFixed(2)+' seconds inside this part.');
      return;
    }
    if(action==='intro')openPreview('intro');
    if(action==='preview-shot')openPreview('clip');
    if(action==='play-cut')playCut();
    if(action==='export')exportCut();
    if(action==='remove-take'){
      const index=Number(b.dataset.index);
      const parts=selectedParts();
      if(!parts[index]||!confirm('Remove only this video part? The Higgsfield original stays untouched.'))return;
      stopPreview();
      const key=frameKey(currentFrame(),activeScene);
      const next=parts.filter((_,i)=>i!==index);
      if(next.length)record.clips[key]=next;else delete record.clips[key];
      activeTake=Math.max(0,Math.min(activeTake,next.length-1));
      if(exportUrl)URL.revokeObjectURL(exportUrl);
      exportUrl='';
      try{await saveCut();inform('Part removed locally.');}catch(err){inform('Could not save removal.',true);}
      render();
      return;
    }
    if(action==='remove-clip'){
      if(!confirm('Remove this local video from the episode? Your original Higgsfield file will not be deleted.'))return;
      const key=frameKey(currentFrame(),activeScene);
      delete record.clips[key];
      try{await saveCut();inform('Scene removed locally.');}catch(err){inform('Could not save the change.',true);}
      render();
    }
  });
  root.addEventListener('input',e=>{
    if(e.target?.id==='fc-fx-duration'){
      const out=root.querySelector('#fc-fx-time');
      if(out)out.textContent=Number(e.target.value).toFixed(1);
    }
    if(e.target?.id==='fc-fx-strength'){
      const out=root.querySelector('#fc-fx-strength-output');
      if(out)out.textContent=Math.round(Number(e.target.value));
    }
    if(e.target?.id==='fc-split-point'){
      const output=root.querySelector('#fc-split-output');
      if(output)output.textContent=Number(e.target.value).toFixed(2);
    }
  });
  root.addEventListener('change', async e=>{
    const input=e.target;
    if(input.id==='fc-episode'){await selectEpisode(input.value);return;}
    if(input.id==='fc-all-files'){await addFiles(Array.from(input.files||[]));input.value='';return;}
    if(input.id==='fc-single-file'){await addFiles(Array.from(input.files||[]),activeScene,'replace');input.value='';}
    if(input.id==='fc-extra-file'){await addFiles(Array.from(input.files||[]),activeScene,'append');input.value='';}
    if(input.id==='fc-quality'){exportQuality=input.value;}
    if(input.id==='fc-fx-duration'){await updateTransition('duration',Number(input.value));return;}
    if(input.id==='fc-fx-strength'){await updateTransition('strength',clamp(Number(input.value),10,100));return;}
    if(input.id==='fc-fx-title'){await updateTransition('title',input.value.slice(0,70));return;}
    if(input.id==='fc-fx-accent'){await updateTransition('accent',input.checked);return;}
    if(input.id==='fc-sound-file'){await importSound(input.files?.[0]);input.value='';return;}
    if(input.dataset.fcSoundSetting){
      const property=input.dataset.fcSoundSetting;
      const value=property==='volume'?clamp(Number(input.value)/100,0,1):Math.max(0,Number(input.value)||0);
      await updateSound(input.dataset.id,property,value);
      return;
    }
  });
  window.addEventListener('pagehide',stopPreview);
  (async ()=>{
    try {
      db=await getDB();
      record=await readCut(selected);
      render();
      let lastMode='final';
      try{lastMode=sessionStorage.getItem('offbrief-workspace-mode')||'final';}catch(_){}
      mode(lastMode);
    } catch(err) {
      root.innerHTML='<div class="fc-shell fc-error">Final Cut cannot open browser storage. Use Safari outside Private Browsing.</div>';
      mode('final');
    }
  })();
})();
