
import './production.css';
import { mountConversationMixer } from './conversation-mixer.js';
import { CANON_EPISODES, CANON_CAST, canonicalShot, masterAnimationPrompt, hydrateCanonicalNote } from './canonical-helpers.js';
import {castCharacters,guestCharacters,seasonTwoTitles} from './season-two-cast.js';

(function bootOffBriefProduction() {
  'use strict';

  const episodes = CANON_EPISODES.map((original, index) => ({
    id: index + 1,
    season: original.season,
    number: original.episode,
    title: original.title,
    count: original.scenes.length,
    source: 'Short format · three approved shots · Flow → Higgsfield',
  }));
  const originalSpeakers = CANON_CAST;
  const episode8DriveFrameIds = [
    null,
    '1bPAXSCJ-jj3Rg_U_Xt4HHpA944XGplxG',
    '14b1s9LcytGjqQAOsj9sWiio2346-ic_n',
    '1qT3OCOEA7tCR0y9H4OiN84myH1I6i3AN',
    '1ZL1G5Va3I-GARYJ09HQbOZrpSB-aCnsN',
    '1bpfKuBuN2AnNFCf3B7U_1bxrlCwi2N6L',
    '1RdC7ZgxVVdt8sRworj4K_V-FMZx8xCx6',
    '1wxUwcyI__S2_FfjqiGVBdT6GPW6ElMQ1',
    '1XTFD7y52jWq6aM4mE5rZoam6dLQzu2lL',
    '1mgEPKUAWUznfXJre13Fti1J7WWYG5BM0',
    '1gRndn7bF8WPm3SIlISE2DFUboN1nt9zh'
  ];


  const videoProviders = [
    {id:'flow',name:'1 · Google Flow',free:'Create and approve the 16:9 still',url:'https://labs.google/fx/tools/flow',description:'Use all six OFF BRIEF master references. Generate the composition only: no dialogue, motion, titles or captions.'},
    {id:'higgsfield',name:'2 · Higgsfield',free:'Animate the approved still',url:'https://higgsfield.ai/',description:'Upload the exact Flow still, add the scene motion and use the exact English line for lip sync.'}
  ];
  const voiceProviders = [
    {id:'ttsmp3ai',name:'ttsMP3 AI Voices',free:'1,000 caracteres / día',url:'https://ttsmp3.com/ai',description:'Supports Voice Instructions for consistent character delivery. MP3 files can be used commercially; manual access only.'},
    {id:'ttsmp3',name:'ttsMP3',free:'3,000 caracteres / día (voces normales)',url:'https://ttsmp3.com/',description:'MP3 para YouTube monetizado; el modo de voz IA tiene una cuota menor.'},
    {id:'ttsmaker',name:'TTSMaker',free:'Plan gratuito con límite semanal',url:'https://ttsmaker.com/',description:'Genera y descarga voz; revisa las condiciones de la voz elegida.'},
    {id:'kokoro',name:'Kokoro TTS',free:'Modelo Apache 2.0; demo compartida',url:'https://huggingface.co/spaces/hexgrad/Kokoro-TTS',description:'Voces naturales sin licencia comercial restrictiva del modelo.'},
    {id:'chatterbox',name:'Chatterbox',free:'Código abierto; demo compartida',url:'https://huggingface.co/spaces/ResembleAI/Chatterbox',description:'Voces expresivas. Usa referencias propias o autorizadas.'}
  ];
  const voiceTemplates = {"Nia":{"voice":"Kore","instructions":"Identity: Nia, an adult creative studio cofounder who manages clients and deadlines.\nAffect: Grounded, observant, sophisticated, with a dry sarcastic edge.\nTone: Controlled, decisive and witty, with understated emphasis when something goes wrong.\nEmotion: Confident and practical; occasionally incredulous, never melodramatic.\nPronunciation: Native conversational US English. Crisp consonants, measured natural pauses; pronounce OFF BRIEF as two distinct English words."},"Ruby":{"voice":"Zephyr","instructions":"Identity: Ruby, an imaginative and funny adult creative director.\nAffect: Warm, effervescent, curious and a little chaotic, with authentic spontaneity.\nTone: Bright, animated, friendly and conversational; energy rises when she gets an idea.\nEmotion: Joyful and adventurous with natural reactions, gentle vulnerability when sincere.\nPronunciation: Natural conversational US English; playful rhythmic emphasis without exaggerated cartoon squealing."},"Mateo":{"voice":"Charon","instructions":"Identity: Mateo, a perceptive adult male writer with a quiet, ironic delivery.\nAffect: Understated, reflective, low-key and dryly hilarious.\nTone: Even, slightly low and deliberate; leave a short beat before clever punchlines.\nEmotion: Reserved amusement, subtle frustration, occasional warmth.\nPronunciation: Clear US English, distinct phrasing and unhurried timing; never perform an imitation of a famous comedian."},"Jules":{"voice":"Laomedeia","instructions":"Identity: Jules, an optimistic adult production coordinator and logistics expert.\nAffect: Fast-thinking, reassuring, lively, agile and human.\nTone: Upbeat and efficient, naturally quick when juggling schedules, not rushed or breathless.\nEmotion: Cheerful confidence with momentary panic that she tries to hide.\nPronunciation: Natural contemporary English, precise names, times and practical directions."},"Nova":{"voice":"Despina","instructions":"Identity: Nova, a calm and meticulous adult video editor and sound designer.\nAffect: Quiet, thoughtful, dryly funny, technically precise.\nTone: Lower-energy, smooth, intimate and slightly deadpan with sharply timed punchlines.\nEmotion: Composed, observant, occasionally annoyed by disorganized sound or edits.\nPronunciation: Clean contemporary US English with natural measured pauses; speak technical terms accurately."},"Simone":{"voice":"Aoede","instructions":"Identity: Simone, a charismatic adult PR and talent specialist.\nAffect: Confident, inviting, socially magnetic and quick with ideas.\nTone: Warm and polished with lively, persuasive momentum; friendly rather than salesy.\nEmotion: Optimistic delight, a touch of dramatic overconfidence, sincere care.\nPronunciation: Expressive fluent US English, fluid sentences and confident proper-name pronunciation."},"Val":{"voice":"Erinome","instructions":"Identity: Val, a decisive adult cinematographer who notices every detail in the light.\nAffect: Practical, direct, intense and visually exacting.\nTone: Clear, cool and assertive, with a deliberate pause before sharp visual instructions.\nEmotion: Focused urgency on set, dry satisfaction after a perfect take.\nPronunciation: Sharp contemporary US English; pronounce camera and lighting terms cleanly."},"Imani":{"voice":"Gacrux","instructions":"Identity: Imani, an experienced adult executive producer and negotiator.\nAffect: Poised, authoritative, unflappable and subtly funny.\nTone: Mature, strong, deliberate and firm without harshness.\nEmotion: Calm control, concern for scope and budget, occasional understated amusement.\nPronunciation: Articulate native US English, precise numbers, approvals and deadlines."},"June":{"voice":"Vindemiatrix","instructions":"Identity: June, an empathetic adult interviewer and documentary storyteller.\nAffect: Gentle, attentive, curious and observant.\nTone: Soft, warm and clear, giving room for other people to speak.\nEmotion: Sincere interest and quiet empathy; never overly sentimental.\nPronunciation: Natural gentle US English with thoughtful breathing and conversational pacing."},"Sage":{"voice":"Autonoe","instructions":"Identity: Sage, an adult set stylist and color designer who is passionate about detail.\nAffect: Creative, assured, opinionated and witty.\nTone: Expressive yet controlled; emphatic on color, materials and visual decisions.\nEmotion: Playful certainty, mild aesthetic horror at wrong colors, genuine excitement about a good result.\nPronunciation: Bright natural US English, clean emphasis on design words, no caricature."},"Arden":{"voice":"Alnilam","instructions":"Identity: Arden, a fictional adult marketing executive from Northlight.\nAffect: Professional, matter-of-fact and calmly authoritative.\nTone: Concise, measured, senior-level and confident.\nEmotion: Focused and respectful, understated encouragement.\nPronunciation: Clear neutral US English; speak company and project names accurately."},"Mrs. Vell":{"voice":"Sulafat","instructions":"Identity: Mrs. Vell, a mature adult boutique owner in the OFF BRIEF fictional world.\nAffect: Warm, assured, gracious and observant.\nTone: Welcoming, textured and gently amused.\nEmotion: Patient confidence with subtle delight.\nPronunciation: Natural English, careful distinct speech without a forced accent."},"Bookstore Owner":{"voice":"Callirrhoe","instructions":"Identity: A fictional adult independent bookstore owner giving an authentic interview.\nAffect: Everyday warmth, humility and light humor.\nTone: Conversational, grounded and unpolished in a believable way.\nEmotion: Genuine relief and pride, never scripted excitement.\nPronunciation: Everyday fluent English with natural pauses and ordinary language."},"Interviewee 1":{"voice":"Leda","instructions":"Identity: A fictional adult customer being interviewed on camera.\nAffect: Friendly but slightly camera-conscious.\nTone: Natural and relaxed, not an advertising announcer.\nEmotion: Cautious enthusiasm and honest hesitation.\nPronunciation: Clear English with normal conversational pacing."},"Interviewee 2":{"voice":"Achird","instructions":"Identity: A fictional adult customer being interviewed on camera.\nAffect: Good-humored and genuine.\nTone: Easygoing, casual and lightly amused.\nEmotion: Curious skepticism turning into everyday appreciation.\nPronunciation: Natural English with normal pauses and relaxed emphasis."},"Interviewee 3":{"voice":"Pulcherrima","instructions":"Identity: A fictional adult customer being interviewed on camera.\nAffect: Thoughtful, personable and a little nervous.\nTone: Soft and sincere, as if speaking without rehearsing.\nEmotion: Authentic cautious warmth, never salesy.\nPronunciation: Natural clear English, gentle pauses, avoid forced accents."}};
  const state = {
    view:'episodes',episode:1,scene:1,
    records:{},assets:{},urls:{},notice:'',
    voiceSettings:{Nia:{provider:'kokoro',voice:''},Ruby:{provider:'kokoro',voice:''},Narrator:{provider:'ttsmp3',voice:''}}
  };
  const base = document.getElementById('app');
  if(!base) return;
  const workspace = document.createElement('div');
  workspace.id='ob-production-root';
  document.body.appendChild(workspace);
  const returnButton=document.createElement('button');
  returnButton.id='ob-return-hub';
  returnButton.textContent='← OFF BRIEF · Episodes';
  returnButton.type='button';
  returnButton.addEventListener('click',()=>showProduction(true));
  document.body.appendChild(returnButton);
  const safe = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sceneKey = (episode,scene) => String(episode)+'-'+String(scene).padStart(2,'0');
  const mediaKey = (episode,scene,kind,lineId='') => [episode,scene,kind,lineId].join(':');
  const currentEpisode = () => episodes[state.episode-1]||episodes[0];
  const note = (episode = state.episode, scene = state.scene) => {
    const key = sceneKey(episode, scene);
    const existing = state.records[key];
    const result = hydrateCanonicalNote(existing, episode, scene, lineId =>
      Boolean(state.assets[mediaKey(episode, scene, 'audio', lineId)])
    );
    state.records[key] = result;
    return result;
  };
  let database;
  function db() {
    if(database) return Promise.resolve(database);
    return new Promise((resolve,reject)=>{
      const r=indexedDB.open('offbrief-production-short-v1',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('records',{keyPath:'id'});
      r.onsuccess=()=>{database=r.result;resolve(database);};
      r.onerror=()=>reject(r.error);
    });
  }
  async function transact(method,record){
    const storage=await db();
    return new Promise((resolve,reject)=>{
      const t=storage.transaction('records','readwrite');
      const req=t.objectStore('records')[method](record);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function init(){
    try{
      const all=await transact('getAll');
      for(const item of all){
        if(item.type==='note') state.records[item.id.slice(5)]=item.value;
        else if(item.type==='media')state.assets[item.id.slice(6)]={blob:item.blob,name:item.name};
        else if(item.type==='voices')state.voiceSettings=item.value;
        else if(item.type==='seasonTitle'){const ep=episodes.find(x=>x.id===item.episode);if(ep&&ep.season===2)ep.title=item.value;}
      }
    } catch(error) {state.notice='El guardado local no está disponible en este navegador.';}
    for (const character of originalSpeakers) {
      if (!state.voiceSettings[character]) {
        state.voiceSettings[character] = { provider: 'kokoro', voice: '' };
      }
    }
    showProduction(true);
  }
  function getAsset(key){return state.assets[key]||null;}
  function getUrl(key) {
    const media=getAsset(key);
    if(!media) return '';
    if(!state.urls[key])state.urls[key]=URL.createObjectURL(media.blob);
    return state.urls[key];
  }
  function episodeCount(episode){return episodes.find(item=>item.id===Number(episode))?.count||3;}
  function mediaCount(episode){let count=0;for(let s=1;s<=episodeCount(episode);s++)if(getAsset(mediaKey(episode,s,'clip'))) count++;return count;}
  function photoCount(episode){let count=0;for(let s=1;s<=episodeCount(episode);s++)if(getAsset(mediaKey(episode,s,'photo'))) count++;return count;}
  function audioCount(episode,scene) {
    return note(episode,scene).dialogues.filter(line=>getAsset(mediaKey(episode,scene,'audio',line.id))).length;
  }
  function completed(episode,scene) {
    const n=note(episode,scene);
    const texts=n.dialogues.filter(l=>l.text.trim());
    return Boolean(getAsset(mediaKey(episode,scene,'clip'))&&texts.length&&texts.every(l=>getAsset(mediaKey(episode,scene,'audio',l.id))));
  }
  function minutes(episode){const total=episodeCount(episode);const list=Array.from({length:total},(_,i)=>note(episode,i+1).duration).filter(v=>v!==''&&Number(v)>0);return list.length?list.reduce((sum,value)=>sum+Number(value),0)+'s defined · '+(total-list.length)+' pending':'Durations not yet verified';}
  function notice(message){state.notice=message;const n=document.getElementById('ob-notice');if(n)n.textContent=message;}
  let saveTimer;
  const sceneSaveTimers = new Map();
  function scheduleSave() {
    const key = sceneKey(state.episode, state.scene);
    const data = JSON.parse(JSON.stringify(state.records[key]));
    clearTimeout(sceneSaveTimers.get(key));
    const indicator = document.getElementById('ob-save');
    if (indicator) indicator.textContent = 'Saving…';
    const timer = setTimeout(async () => {
      sceneSaveTimers.delete(key);
      try {
        await transact('put', { id: 'note:' + key, type: 'note', value: data });
        const label = document.getElementById('ob-save');
        if (label) label.textContent = 'Saved on iPad';
      } catch (error) {
        notice('Could not save this scene; check available storage.');
      }
    }, 350);
    sceneSaveTimers.set(key, timer);
  }
  async function saveAsset(key,file){
    if(!file)return;
    const allowed=/^(image|video|audio)\//.test(file.type)||/\.(heic|heif|png|jpe?g|mp4|mov|webm|mp3|wav|m4a|aac)$/i.test(file.name);
    if(!allowed){notice('Select a supported image, audio or video file.');return;}
    try{
      await transact('put',{id:'media:'+key,type:'media',blob:file,name:file.name});
      if(state.urls[key]){URL.revokeObjectURL(state.urls[key]);delete state.urls[key];}
      state.assets[key]={blob:file,name:file.name};
    }catch(error){notice('Could not store '+file.name+'. Safari storage might be full.');}
  }
  async function deleteAsset(key){
    const data=getAsset(key);if(!data||!window.confirm('Remove '+data.name+' from the local scene?'))return;
    try{await transact('delete','media:'+key);delete state.assets[key];if(state.urls[key]){URL.revokeObjectURL(state.urls[key]);delete state.urls[key];}render();}
    catch(error){notice('Unable to remove the file.');}
  }
  function photoNumber(filename){
    const matches=filename.match(/(?:^|[-_])F0?([1-9]|10)(?:[-_.]|$)/i);
    if(matches)return Number(matches[1]);
    const alternative=filename.match(/(?:^|[-_])S0?([1-9]|10)(?:[-_.]|$)/i);
    return alternative?Number(alternative[1]):null;
  }
  async function batchImport(files){
    const photos=Array.from(files).filter(f=>f.type.startsWith('image/')||/\.(heic|heif|png|jpe?g)$/i.test(f.name));
    const total=episodeCount(state.episode);
    if(!photos.length){notice('Choose 1–'+total+' approved stills for this episode.');return;}
    const numbered=new Map();
    const rest=[];
    for(const file of photos){
      const n=photoNumber(file.name);
      if(n&&n<=total&&!numbered.has(n)&&!/extra|preview|[_-]h\d/i.test(file.name)) numbered.set(n,file);
      else rest.push(file);
    }
    const used=new Set(numbered.values());
    const ordered=photos.filter(f=>!used.has(f) && !/extra|preview|[_-]h\d/i.test(f.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
    for(let i=1;i<=total&&ordered.length;i++)if(!numbered.has(i))numbered.set(i,ordered.shift());
    let saved=0;
    for(const [slot,file] of numbered){await saveAsset(mediaKey(state.episode,slot,'photo'),file);saved++;}
    state.scene=1;render();notice(saved+' approved still(s) placed automatically in the '+total+' shot slots.');
  }
  function showProduction(show){
    document.body.classList.toggle('ob-production-active',show);
    if(show){render();window.scrollTo(0,0);}
  }
  function sideBar(){
return `<aside class="ob-side">
 <div class="ob-logo"><div class="ob-mark">OB<span>▶</span></div><div><b>OFF BRIEF<span class="ob-yellow">.</span></b><small>VIDEO PRODUCTION</small></div></div>
 <div class="ob-menu-label">WORKSPACE</div>
 <nav class="ob-main-menu">
  <button data-view="episodes" class="${state.view==='episodes'?'current':''}">▦ <span>Episodes & scenes</span></button>
  <button data-view="video" class="${state.view==='video'?'current':''}">✳ <span>AI video generators</span></button>
  <button data-view="voice" class="${state.view==='voice'?'current':''}">♫ <span>AI voices</span></button>
  <button data-view="library" class="${state.view==='library'?'current':''}">▤ <span>Photo library</span></button>
  <button data-view="drive" class="${state.view==='drive'?'current':''}">◈ <span>Connect Google Drive</span></button>
 </nav>
 <section class="ob-season-group">
  <div class="ob-menu-label">SEASON 01 <span>SHORT FORMAT</span></div>
  <div class="ob-episode-buttons">${episodes.map(e=>`<button data-episode="${e.id}" class="${state.view==='episodes'&&state.episode===e.id?'current':''}">
   <span class="ob-ep-index">${String(e.number).padStart(2,'0')}</span><span class="ob-ep-name"><b>${safe(e.title)}</b><small>${photoCount(e.id)}/${e.count} stills · ${mediaCount(e.id)}/${e.count} videos</small></span></button>`).join('')}
  </div></section>
 <section class="ob-season-group ob-season-hold"><div class="ob-menu-label">SEASON 02 <span>ON HOLD</span></div><p>Continue after Season 1 is approved.</p></section>
 <div class="ob-side-bottom"><b>Private on this iPad</b><p>Original images stay in Google Drive until you authorize a read-only sync.</p></div></aside>`;
}
  function heading(){
    const label={episodes:'EPISODE PRODUCTION',video:'REAL AI MOTION',voice:'CHARACTER VOICES',library:'ORIGINAL PHOTO LIBRARY',drive:'PRIVATE DRIVE'}[state.view];
    const title=state.view==='episodes'?currentEpisode().title:state.view==='video'?'AI video engines':state.view==='voice'?'Voice direction':state.view==='drive'?'Drive connection':'Production library';
    return `<header class="ob-header"><div class="ob-heading"><span>${label} / SEASON ${String(currentEpisode().season).padStart(2,'0')}</span><h1>${safe(title)}</h1></div><div class="ob-heading-right"><small id="ob-save">Saved on iPad</small><button data-action="backup" class="ob-neutral">Export shot list</button><button data-action="old" class="ob-plain">Older editor ↗</button></div></header>`;
  }
  const episode2Review = [
    null,
    { id: '1IRJAJ1r_6Z8t9-TWsYn1TcmxPiTsisgy', status: 'draft', reason: 'Current take F01 saved. The prompt specifies a lone cream cup on ivory seamless background; this image includes extra styling props and equipment, so review before approval.' },
    { id: '1TRUbmvypr-ZVFXjO9CAsnDaZn2zwA7hn', status: 'draft', reason: 'Current take F02 saved with Ruby, Val, Sage and Mateo. Check that Ruby reaches toward the cup while Val guards the camera.' },
    { id: '1a9s0q7_svRhEAIleu6OfV3nj27uMSfa-', status: 'draft', reason: 'Current take F03 saved with Nia, Ruby, Val, Sage and Mateo. Nia must show the one-page client brief, and each character must match the action.' },
    { id: '18HJY1SiwuMBPhxI6TKvgG115x73ecyQF', status: 'draft', reason: 'Current take F04 saved with Val and Ruby. Verify Val is adjusting the focus ring and Ruby is watching the monitor, not simply posing.' },
    { id: '1Oyjis2X1PkLX9M3fpQSn-uaHiRErbBrs', status: 'draft', reason: 'Current take F05 saved with Val and Sage. The prompt requires Sage moving a rectangular gold reflector while Val evaluates the cup lighting; this needs correction.' },
    { id: '1tcd5_QnSWwt0QS0dQ9RSwkMxlxKZ1Pld', status: 'draft', reason: 'Current take F06 saved. Ruby stands on a safe step with arms raised, Nia stands calmly nearby, and Val and Sage consult notes. Verify wardrobe and character continuity.' },
    { id: '1mvU9i3-bhrXsxvhl0Pxi2lsNiMDbnX8z', status: 'draft', reason: 'Current take F07 saved. Ruby shows the cup entrance and Val marks the camera position; remove extra on-screen text before final approval.' },
    { id: '1xU8QkoErzwMGu9zLVZc4eG1ML2JdCRNl', status: 'draft', reason: 'Current corrected-hand F08 saved and reframed 16:9. One hand holds the cup correctly, but falling paperwork requested in the script is missing.' },
    { id: '14W5r545IvrPQUGNCkTiLEEIK0WACU31b', status: 'draft', reason: 'Current take F09 saved. Script requires Nia and Ruby reacting with dread to a new client note, but this image shows celebration; redo before approval.' },
    { id: '1Pif5nM1rKrsCbbygNr4_NZZ8cTHnPyrr', status: 'draft', reason: 'Current take F10 saved with Val, Sage and Mateo looking worried. Verify original identities and the exact final-shot framing.' }
  ];
  function slotPhoto(e,sc){
    const k=mediaKey(e,sc,'photo'),image=getUrl(k);
    return `<span class="ob-thumb">${image?`<img src="${image}" alt="Scene ${sc} imported photo"/>`:'<span>▧</span>'}</span>`;
  }
  function sceneStrip(){
    const total=currentEpisode().count;
    const e=state.episode;
    return `<section class="ob-scene-strip"><div class="ob-strip-head"><div><span class="ob-eyebrow">STORYBOARD</span><h2>${total} shots <small>· setup / turn / payoff</small></h2></div><label class="ob-import-batch">＋ Import ${total} approved stills<input type="file" data-batch accept="image/*,.heic,.heif" multiple hidden/></label></div>
    <div class="ob-scene-scroll">${Array.from({length:total},(_,i)=>i+1).map(s=>{
      const pic=!!getAsset(mediaKey(e,s,'photo')),clip=!!getAsset(mediaKey(e,s,'clip'));
      const review=e===10?episode2Review[s]:null;
      const photoStatus=pic?'Photo imported':review?.status==='approved'?'PNG in Drive · ready to import':review?.status==='draft'?'Draft in Drive · review':'Photo pending';
      return `<button class="ob-scene-tile ${state.scene===s?'active':''}" data-scene="${s}" type="button">
        <span class="ob-shot-number">SCENE ${String(s).padStart(2,'0')}</span>${slotPhoto(e,s)}
        <span class="ob-shot-status">${safe(photoStatus)}<b>${clip?'● AI VIDEO':'○ No video'}</b></span></button>`;
    }).join('')}</div><p class="ob-tip">Generate one approved 16:9 still per shot in Flow. Files named S01, S02 and S03 are placed automatically. Then animate each still in Higgsfield.</p></section>`;
  }
  function assetBox(kind,title,accept){
    const k=mediaKey(state.episode,state.scene,kind),file=getAsset(k),url=getUrl(k);
    const review = kind === 'photo' && state.episode === 10 ? episode2Review[state.scene] : null;
    const frameId = kind !== 'photo' ? null : state.episode === 8 ? episode8DriveFrameIds[state.scene] : review?.id || null;
    const label = review?.status === 'draft' ? 'View current F'+String(state.scene).padStart(2,'0')+' PNG in private Drive' : 'View approved PNG in private Drive';
    const frameLink = frameId ? '<a class="ob-neutral" href="https://drive.google.com/file/d/' + frameId + '/view" target="_blank" rel="noopener noreferrer">' + label + '</a>' : '';
    const reviewNote = review ? '<p class="ob-muted"><strong>' + (review.status === 'approved' ? 'Approved reference · Drive' : review.status === 'missing' ? 'Not generated' : 'Draft · needs review') + '</strong> — ' + safe(review.reason) + '</p>' : '';
    const player=url?(kind==='photo'?'<img class="ob-asset-preview" alt="Original photo" src="'+url+'"/>':'<video class="ob-asset-preview" controls playsinline preload="metadata" src="'+url+'"></video>'):'<div class="ob-asset-placeholder">'+(kind==='photo'?'▧':'▶')+'<span>'+ (kind==='photo'?'Photo not imported':'AI video not imported')+'</span></div>';
    return `<div class="ob-assetbox"><div class="ob-asset-top"><b>${safe(title)}</b><span>${file?'READY':'PENDING'}</span></div>${player}${frameLink}
    ${reviewNote}<div class="ob-asset-bottom"><small title="${safe(file?.name)}">${safe(file?.name||'No file yet')}</small><label class="ob-upload">${file?'Replace':'Upload'}<input type="file" accept="${safe(accept)}" data-media="${safe(k)}" hidden/></label>${file?'<button class="ob-del" data-remove="'+safe(k)+'" aria-label="Delete media">×</button>':''}</div></div>`;
  }
  function audioBox(line){
    const k=mediaKey(state.episode,state.scene,'audio',line.id),file=getAsset(k),url=getUrl(k);
    return `<div class="ob-audio-row"><span class="ob-audio-icon">♫</span><div class="ob-audio-core"><b>Audio file · ${safe(line.character)}</b>${url?'<audio controls preload="metadata" src="'+url+'"></audio>':'<small>No recorded/generated voice yet</small>'}</div><label class="ob-upload">${file?'Replace':'Add audio'}<input type="file" accept="audio/*,.m4a,.mp3,.wav,.aac" data-media="${safe(k)}" hidden/></label>${file?'<button class="ob-del" data-remove="'+safe(k)+'" aria-label="Remove voice file">×</button>':''}</div>`;
  }
  function dialogueBox(line){
 const config=state.voiceSettings[line.character]||(state.voiceSettings[line.character]={provider:'kokoro',voice:''});
 const engine=voiceProviders.find(p=>p.id===config.provider)||voiceProviders.find(p=>p.id==='ttsmp3ai');
 const template=voiceTemplates[line.character]||{instructions:'',voice:''};
 const isTTS=engine.id==='ttsmp3ai';
 return `<div class="ob-voice-line"><div class="ob-line-header"><label><select data-choose-speaker="${safe(line.id)}" aria-label="Voice character">${originalSpeakers.map(c=>'<option value="'+safe(c)+'" '+(c===line.character?'selected':'')+'>'+safe(c)+'</option>').join('')}</select><span>VOICE TRACK</span></label>
 <span>${safe(engine.name)} · ${safe(config.voice||('Suggested: '+(template.voice||'Choose a voice')))}</span></div>
 <textarea rows="3" data-dialogue="${safe(line.id)}" placeholder="Approved dialogue for ${safe(line.character)}">${safe(line.text)}</textarea>
 <label class="ob-voice-delivery">Acting direction for this line (optional)<input type="text" data-line-delivery="${safe(line.id)}" placeholder="e.g., quietly skeptical, then surprised" value="${safe(line.delivery||'')}"/></label>
 <div class="ob-line-actions"><button class="ob-neutral" type="button" data-copy="${safe(line.id)}">Copy dialogue</button>
 <button class="ob-neutral" type="button" data-action="copy-voice-line" data-line="${safe(line.id)}">Copy voice + acting instructions</button>
 <a href="${safe(isTTS?'https://ttsmp3.com/ai':engine.url)}" target="_blank" rel="noopener noreferrer" class="ob-black-button">Generate voice ↗</a></div>
 ${audioBox(line)}</div>`;
}

  function sceneEditor(){
    const n=note();
    const original=canonicalShot(state.episode,state.scene);
    return `<div class="ob-caveat"><strong>SHORT EPISODE · 3-SHOT CUT</strong><p>${safe(original?.beat||'Scene')} · ${safe(original?.frameId||'Frame pending')} · ${safe(original?.camera||'Original composition')}</p><small>Dialogue from the original Studio, separated into individual character voice tracks. Custom changes and local media are preserved.</small></div><div class="ob-two-cols"><section class="ob-sheet"><div class="ob-sheet-title"><div><span class="ob-eyebrow">SCENE ${String(state.scene).padStart(2,'0')} · VISUAL</span><h2>Image → moving video</h2></div><span class="ob-step">01</span></div>
      <div class="ob-media-pair">${assetBox('photo','Original reference','image/*,.heic,.heif')}${assetBox('clip','AI-generated motion','video/*,.mp4,.webm,.mov')}</div>
      <label class="ob-field-label">Master AI animation prompt · editable</label><textarea class="ob-notearea" data-field="motion" rows="9" placeholder="Describe the real movement you want: Nia reacts to Ruby, eyebrow raise, subtle hand gesture…">${safe(n.motion)}</textarea>
      <div class="ob-inline-actions"><button class="ob-neutral" data-action="copy-prompt">Copy edited prompt</button><button class="ob-neutral" data-action="copy-master">Copy original master</button><button class="ob-black-button" data-view="video">Choose AI video engine ↗</button></div>
      <div class="ob-duration-line"><label>Scene duration <input type="number" min="1" max="300" step="0.5" placeholder="Unverified" value="${safe(n.duration)}" data-field="duration"/></label><small>Seconds · not guessed from the old private Studio</small></div>
      <label class="ob-field-label">Director's notes</label><textarea class="ob-notearea" rows="3" data-field="notes" placeholder="Camera, acting, sound design, continuity, costume…">${safe(n.notes)}</textarea>
    </section><section class="ob-sheet"><div class="ob-sheet-title"><div><span class="ob-eyebrow">SCENE ${String(state.scene).padStart(2,'0')} · SOUND</span><h2>Voices & dialogue</h2></div><span class="ob-step">02</span></div>
    <p class="ob-muted">Each scene has its own character dialogue and audio underneath. Use a consistent AI voice for every character.</p>
    <div class="ob-lines">${n.dialogues.length?n.dialogues.map(dialogueBox).join(''):'<p class="ob-muted">Silent cinematic reaction in the original cut; no invented character dialogue.</p>'}</div><button class="ob-add-line" data-action="add-line">＋ Add dialogue turn</button></section></div>`;
  }
  function episodeView(){
const e=currentEpisode();
return `<div class="ob-ep-summary">
 <div><span>SEASON ${String(e.season).padStart(2,'0')} · EPISODE ${String(e.number).padStart(2,'0')} · ${e.count} SHOTS</span>
 <p><b>${photoCount(e.id)}/${e.count} approved stills</b> · <b>${mediaCount(e.id)}/${e.count} Higgsfield videos</b> · ${minutes(e.id)}</p>
 <small class="ob-episode-source">${safe(e.source)}</small></div>
 <span class="ob-auth-note">Exact English dialogue and shot direction are loaded. Keep the same master references in every Flow generation.</span>
 </div>
 ${e.season===2?`<div class="ob-season-title-editor"><label>Episode title (edit only if verified)</label><input type="text" data-season-title="${e.id}" value="${safe(e.title)}" maxlength="110"/></div>`:''}
 <section class="ob-caveat" aria-label="OFF BRIEF universal intro">
  <strong>OFF BRIEF · UNIVERSAL INTRO · 5 SECONDS</strong>
  <p>Use the same official Nia &amp; Ruby clip in every episode, after the opening cold-open scene and before the rest of the story.</p>
  <a class="ob-neutral" href="https://drive.google.com/file/d/14oZBDmHZoUQK_iYHPhirAtvpSuTL3p64/view?usp=drivesdk" target="_blank" rel="noopener noreferrer">▶ Ver y descargar intro oficial de 5 s</a>
  <p><small>Shared asset in private Drive. To include it in a final episode video, import the MP4 into that project's timeline; this link does not auto-insert it.</small></p>
</section>
 <div class="ob-drive-quick-actions"><a class="ob-neutral" href="https://drive.google.com/drive/folders/1XOVFoZgeb2G-15avFrDypv6mAP6gVo3e" target="_blank" rel="noopener noreferrer">Open 6 master references</a><a class="ob-neutral" href="https://drive.google.com/file/d/1LBR4hfl4yZwhQf3DxBAdn3IG1eF96ITX/view" target="_blank" rel="noopener noreferrer">Open short scripts</a><button class="ob-neutral" type="button" data-action="drive-sync">↻ Sync approved stills</button><button class="ob-plain" type="button" data-view="drive">Connect Drive / folders</button></div>
 ${sceneStrip()}${sceneEditor()}`;
}
  function providerCard(p){
    return `<article class="ob-provider"><div><span class="ob-provider-asterisk">✳</span><small>EXTERNAL PROVIDER</small></div><h3>${safe(p.name)}</h3><strong>${safe(p.free)}</strong><p>${safe(p.description)}</p><a class="ob-black-button" href="${safe(p.url)}" target="_blank" rel="noopener noreferrer">Open generator ↗</a></article>`;
  }
  function videoView(){return `<div class="ob-section-intro"><span class="ob-eyebrow">FIXED WORKFLOW · SAME CHARACTERS</span><h2>Flow first. Higgsfield second.</h2><p>Flow creates the approved still using all six master references. Higgsfield animates that exact still and adds the exact English line. Do not regenerate the character between steps.</p></div><div class="ob-provider-grid">${videoProviders.map(providerCard).join('')}</div><div class="ob-caveat"><strong>One episode = three separate clips.</strong><p>Approve S01 before making S02. Import the three finished Higgsfield clips into the matching episode and assemble them with the existing OFF BRIEF intro.</p></div>`;}
  function voiceView(){
 const known=[...castCharacters,...guestCharacters];
 const members=originalSpeakers.map(name=>known.find(person=>person.name===name)||{name,role:'OFF BRIEF lead',trait:'Use the approved character voice and performance',avatar:0});
 return `<div class="ob-section-intro"><span class="ob-eyebrow">OFF BRIEF / VOICE DIRECTION</span><h2>Give every character a voice identity.</h2>
 <p>Each original character has an editable acting brief, a recommended AI voice, and a permanent voice setting. Copy the instructions to ttsMP3 AI <strong>Add Instructions</strong>, paste one dialogue line at a time, and import the resulting MP3 underneath its scene.</p></div>
 <div class="ob-voice-explain"><b>AI Voices · 1,000 free characters/day at ttsMP3</b><span>Voice Instructions work in the <strong>AI Voices</strong> generator, not the regular Amazon Polly converter. Generated audio can be used on YouTube. External generation is manual; no secret API or credit bypass.</span><a href="https://ttsmp3.com/ai" target="_blank" rel="noopener noreferrer">Open ttsMP3 AI ↗</a></div>
 <div class="ob-cast-grid ob-voice-grid">${members.map((person,i)=>{
  const config=state.voiceSettings[person.name]||(state.voiceSettings[person.name]={provider:'kokoro',voice:''});
  const def=voiceTemplates[person.name]||{voice:'',instructions:''};
  const photo=person.name==='Ruby'?`<img class="ob-cast-reference" src="https://raw.githubusercontent.com/thelaunchera/todavia-estoy-a-tiempo/main/estudio-control/public/youtube/characters/ruby.webp" alt="Ruby original reference"/>`:person.avatar>0?`<div class="ob-cast-reference" role="img" aria-label="${safe(person.name)} original reference" style="background-image:url('https://raw.githubusercontent.com/thelaunchera/todavia-estoy-a-tiempo/main/estudio-control/public/youtube/season-2/cast-grid.webp');background-size:300% 300%;background-position:${((person.avatar-1)%3)*50}% ${Math.floor((person.avatar-1)/3)*50}%"></div>`:`<div class="ob-cast-icon">${safe(person.name[0])}</div>`;
  return `${i===castCharacters.length?'<h3 class="ob-cast-divider">Guest speaking roles</h3>':''}<article class="ob-cast-card ob-voice-director-card">
   ${photo}<div class="ob-voice-card-content"><div class="ob-voice-card-heading"><div><h3>${safe(person.name)}</h3><p>${safe(person.role)}</p></div><span class="ob-voice-recommendation">Suggested AI voice: <b>${safe(def.voice||'Choose')}</b></span></div>
   <div class="ob-voice-options"><label>Voice provider<select data-voice-provider="${safe(person.name)}">${voiceProviders.map(p=>`<option value="${p.id}" ${p.id===config.provider?'selected':''}>${safe(p.name)}</option>`).join('')}</select></label>
   <label>Permanent voice preset<input type="text" data-voice-name="${safe(person.name)}" placeholder="Save a voice name" value="${safe(config.voice||'')}"/></label></div>
   <label class="ob-voice-instructions-label">Voice Instructions · identity / affect / tone / emotion / pronunciation<textarea data-voice-instructions="${safe(person.name)}" rows="8" spellcheck="false">${safe(config.instructions??def.instructions)}</textarea></label>
   <div class="ob-voice-buttons"><button type="button" class="ob-neutral" data-action="voice-recommend" data-character="${safe(person.name)}">Use suggested AI voice</button>
   <button type="button" class="ob-black-button" data-action="copy-voice-instructions" data-character="${safe(person.name)}">Copy Voice Instructions</button>
   <a href="https://ttsmp3.com/ai" target="_blank" rel="noopener noreferrer" class="ob-neutral">Generate MP3 ↗</a></div>
   </div></article>`;
 }).join('')}</div>
 <div class="ob-module-heading"><b>Other free voice generators</b><span>Provider quotas and available voices can change</span></div><div class="ob-provider-grid">${voiceProviders.map(providerCard).join('')}</div>`;
}

  function libraryView(){
return `<div class="ob-section-intro"><span class="ob-eyebrow">MASTER REFERENCES · PRIVATE DRIVE</span><h2>Season 1 short production</h2><p>Use the same six approved references for all 24 Flow stills: Nia full body and close-up, Ruby full body and close-up, the duo, and the studio. Season 2 remains on hold until Season 1 is approved.</p><p><a class="ob-black-button" href="https://drive.google.com/drive/folders/1XOVFoZgeb2G-15avFrDypv6mAP6gVo3e" target="_blank" rel="noopener noreferrer">Open master references ↗</a></p></div>
 <div class="ob-library-grid">${episodes.map(e=>`<button data-episode="${e.id}" class="ob-library-card">
   <span>S01 / E${String(e.number).padStart(2,'0')}</span>
   <b>${safe(e.title)}</b><small>${safe(e.source)} · ${photoCount(e.id)}/${e.count} imported</small><strong>Open episode ↗</strong></button>`).join('')}</div><div class="ob-caveat"><strong>SEASON 02 · ON HOLD</strong><p>Continue only after Season 1 has been approved.</p></div>`;
}
  function driveView(){
return `<section class="ob-drive-panel"><div class="ob-eyebrow">GOOGLE DRIVE / AUTHORIZATION</div><h2>Import your original scenes</h2>
 <div id="ob-drive-controls">Loading connection options…</div>
 <p class="ob-drive-note">Import only the three approved stills named S01, S02 and S03 from the chosen private episode folder. No image is made publicly accessible. Never paste passwords or client secrets here.</p></section>`;
}
  function render(){
 if(!document.body.classList.contains('ob-production-active'))return;
 workspace.innerHTML=`<div class="ob-app">${sideBar()}<main class="ob-main">${heading()}<div class="ob-body">${state.view==='episodes'?episodeView():state.view==='video'?videoView():state.view==='voice'?voiceView():state.view==='drive'?driveView():libraryView()}<p class="ob-notice" id="ob-notice" aria-live="polite">${safe(state.notice)}</p></div></main></div>`;
 if (state.view === 'episodes') mountConversationMixer(workspace, { note: note(), season: currentEpisode().season, episode: currentEpisode().number, scene: state.scene, audioFor: id => getAsset(mediaKey(state.episode, state.scene, 'audio', id)), persist: scheduleSave });
 window.OBDrive?.paint();
}
  function updateFromForm(element){
    const n=note();
    if(element.dataset.field){n[element.dataset.field]=element.value;scheduleSave();}
    if(element.dataset.dialogue){const line=n.dialogues.find(l=>l.id===element.dataset.dialogue);if(line){line.text=element.value;scheduleSave();}}
  }
  async function writeVoiceSettings(){
    try{await transact('put',{id:'voice-defaults',type:'voices',value:state.voiceSettings});notice('Character voice settings saved on this iPad.');}
    catch(error){notice('Could not save voice settings.');}
  }
  function copy(text){if(!text){notice('Add some text first.');return;}const finish=()=>notice('Text copied; paste it into the AI generator.');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(finish,()=>notice('Use long press to select and copy the text.'));else notice('Use long press to select and copy the text.');}
  function backup(){
    const doc={
      series:'OFF BRIEF Season 1 short format',createdAt:new Date().toISOString(),episodeTitles:episodes.map(e=>e.title),
      warning:'This is a shot-list backup, NOT a backup of image/video/audio files.',
      scenes:episodes.map(e=>({episode:e.id,title:e.title,shots:Array.from({length:e.count},(_,i)=>({scene:i+1,...note(e.id,i+1)}))}))
    };
    const blob=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'});
    const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download='OFF_BRIEF_S1_short_scene_plan.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
    notice('Downloaded shot list (does not include media files).');
  }
  workspace.addEventListener('click',async(event)=>{
    const action=event.target.closest('button,[data-view],a');
    if(!action)return;
    if(action.dataset.episode){state.episode=Number(action.dataset.episode);state.scene=1;state.view='episodes';render();window.scrollTo(0,0);if(window.OBDrive?.connected())window.OBDrive.sync(state.episode,true);return;}
    if(action.dataset.scene){state.scene=Number(action.dataset.scene);render();return;}
    if(action.dataset.view){state.view=action.dataset.view;render();window.scrollTo(0,0);return;}
    if(action.dataset.remove){await deleteAsset(action.dataset.remove);return;}
    if(action.dataset.copy){const line=note().dialogues.find(l=>l.id===action.dataset.copy);copy(line?.text||'');return;}
    if(action.dataset.action==='copy-prompt'){copy(note().motion);return;}
    if(action.dataset.action==='copy-master'){copy(masterAnimationPrompt(state.episode,state.scene));return;}
    if(action.dataset.action==='copy-voice-instructions'){const character=action.dataset.character;const config=state.voiceSettings[character]||{};copy(config.instructions??voiceTemplates[character]?.instructions??'');return;}
    if(action.dataset.action==='voice-recommend'){const character=action.dataset.character,rec=voiceTemplates[character];if(!rec)return;const profile=state.voiceSettings[character]||(state.voiceSettings[character]={});profile.provider='ttsmp3ai';profile.voice=rec.voice;await writeVoiceSettings();render();notice('Suggested voice selected for '+character+'. Listen to it before committing to the character.');return;}
    if(action.dataset.action==='copy-voice-line'){const line=note().dialogues.find(l=>l.id===action.dataset.line);if(!line)return;const config=state.voiceSettings[line.character]||{};const instructions=(config.instructions??voiceTemplates[line.character]?.instructions??'')+(line.delivery?.trim()?'\nFor this line only: '+line.delivery.trim(): '');copy(instructions);return;}
    if(action.dataset.action==='add-line'){
      const n=note();n.dialogues.push({id:'line-'+Date.now().toString(36),character:'Narrator',text:''});scheduleSave();render();return;
    }
    if(action.dataset.action==='backup'){backup();return;}
    if(action.dataset.action==='drive-sync'){if(window.OBDrive?.connected())await window.OBDrive.sync(state.episode,false);else{state.view='drive';render();}return;}
    if(action.dataset.action==='old'){showProduction(false);return;}
  });
  workspace.addEventListener('input',event=>{
    const target=event.target;
    if(target.dataset.field||target.dataset.dialogue) updateFromForm(target);
    if(target.dataset.voiceName){state.voiceSettings[target.dataset.voiceName].voice=target.value;clearTimeout(saveTimer);saveTimer=setTimeout(writeVoiceSettings,400);}
    if(target.dataset.voiceInstructions){const who=target.dataset.voiceInstructions;const obj=state.voiceSettings[who]||(state.voiceSettings[who]={provider:'ttsmp3ai',voice:''});obj.instructions=target.value;clearTimeout(saveTimer);saveTimer=setTimeout(writeVoiceSettings,550);}
    if(target.dataset.lineDelivery){const line=note().dialogues.find(l=>l.id===target.dataset.lineDelivery);if(line){line.delivery=target.value;scheduleSave();}}
  });
  workspace.addEventListener('change',async(event)=>{
    const target=event.target;
    if(target.dataset.chooseSpeaker){const line=note().dialogues.find(x=>x.id===target.dataset.chooseSpeaker);if(line){line.character=target.value;scheduleSave();render();}return;}
    if(target.dataset.media){await saveAsset(target.dataset.media,target.files?.[0]);render();return;}
    if(target.hasAttribute('data-batch')){await batchImport(target.files);render();return;}
    if(target.dataset.voiceProvider){state.voiceSettings[target.dataset.voiceProvider].provider=target.value;await writeVoiceSettings();render();return;}
    if(target.dataset.seasonTitle){const ep=episodes.find(e=>e.id===Number(target.dataset.seasonTitle));if(ep&&ep.season===2){ep.title=target.value;await transact('put',{id:'title-'+ep.id,type:'seasonTitle',episode:ep.id,value:ep.title});render();}return;}
  });
  window.addEventListener('beforeunload',()=>{Object.values(state.urls).forEach(url=>URL.revokeObjectURL(url));});
  window.OBProduction={episodes,state,saveAsset,getAsset,mediaKey,render,notice,currentEpisode:()=>state.episode};
  init();
})();
