import './ai-motion.css';
(function setupOffBriefAIMotion(){
'use strict';
const root = document.getElementById('app');
const generatorUrl = "https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space";
const officialUrl = "https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster";
const prompts = [
  {
    "key": "nia",
    "name": "Nia · subtle acting",
    "text": "Animate the exact same animated character from the reference image. Preserve Nia's original face, hairstyle, blue blazer, proportions, and expressive eyes. Nia glances up from her laptop, raises one eyebrow with dry sarcasm, blinks naturally and makes one small hand gesture. Subtle breathing and realistic fabric movement. Stable medium shot, natural pacing, clean studio lighting. No extra characters, no face morphing, no clothing changes, no camera zoom, no text."
  },
  {
    "key": "ruby",
    "name": "Ruby · expressive acting",
    "text": "Animate the exact same animated character from the supplied image. Preserve Ruby's original face, red hair, glasses, outfit, and body proportions. Ruby leans toward the camera, smiles mischievously, blinks, turns her head slightly and gestures excitedly with her hands. Natural facial motion, smooth hair movement, realistic arm motion. Fixed camera, cinematic soft lighting. Do not alter identity, eyewear or character design. No duplicated arms, no camera zoom, no text."
  },
  {
    "key": "dialogue",
    "name": "Duo · conversation",
    "text": "Animate the same two established animated characters in the reference image with no identity changes. Nia in her blue blazer gives Ruby a skeptical side-eye, while Ruby with red hair and glasses gestures enthusiastically, then pauses. Their mouths and expressions move subtly as they react. Keep exact facial features, hairstyles, clothing and composition. One coherent 4-second scene, steady camera, smooth natural character movement. No extra people, no face or hand distortions, no zoom."
  },
  {
    "key": "products",
    "name": "Product · cinematic",
    "text": "Animate the actual product in the uploaded photograph without changing its shape, logo, material, colors, or branding. The product performs one graceful realistic movement as surrounding light and reflections shift naturally. Authentic object physics and shadows, high-end commercial cinematography, smooth continuous motion, fixed shot. Keep all printed details stable and legible. No deformation, no invented objects, no camera zoom, no fake new packaging."
  }
];
const escapeText = (input) => String(input ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let preset = 'nia';
let promptDraft = prompts[0].text;
let modal = null;
let database = null;
let clips = [];
let liveUrls = new Map();
const editorIsOpen = () => root.classList.contains('ai-editor-open');
const store = async () => {
  if (database) return database;
  database = await new Promise((resolve,reject)=>{
    const request = indexedDB.open('offbrief-generated-clips-v1',1);
    request.onupgradeneeded = () => request.result.createObjectStore('clips',{keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
};
async function transact(method, value) {
  const db = await store();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('clips','readwrite');
    const req = tx.objectStore('clips')[method](value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function announce(message,warning=false){
  const target = document.querySelector('#ai-local-notice');
  if(target) {target.textContent=message; target.classList.toggle('is-warning',warning);}
}
function createPanel(){
  const target = root.querySelector('.stage-section');
  if(!target || target.querySelector('.ai-workbench')) return;
  const section = document.createElement('section');
  section.className = 'ai-workbench';
  section.innerHTML = `
  <div class="ai-primary-label"><span class="ai-glint">✳</span> OFF BRIEF / AI MOTION MAKER <span class="ai-free-pill">FREE GPU · LIMITED</span></div>
  <div class="ai-intro">
    <div class="ai-intro-copy"><h2>Give your images<br><em>real movement.</em></h2><p>Turn your character or product photo into a genuinely generated AI video. Actions, facial expressions and physical movement — not a slideshow.</p>
    <div class="ai-hero-buttons">
      <button class="ai-cta" type="button" data-ai-action="open">✳ Animate an image with AI</button>
      <button class="ai-secondary" type="button" data-ai-action="switch-editor">Open photo editor</button>
    </div></div>
    <div class="ai-hero-art" aria-hidden="true">
      <div class="ai-slate-top"><span>AI CAMERA / 01</span><span>● REC</span></div>
      <div class="ai-main-symbol"><span class="ai-play-shape">▶</span><span class="ai-swirl">✳</span></div>
      <div class="ai-slate-bottom"><span>STILL FRAME</span><span>→</span><strong>MOVING SCENE</strong></div>
    </div>
  </div>
  <div class="ai-trail"><div><b>01</b><span>Upload character photo</span></div><div><b>02</b><span>Describe a real action</span></div><div><b>03</b><span>Generate and save MP4</span></div></div>
  <div class="ai-panel-head"><div><span class="eyebrow">DIRECTION / OFF BRIEF</span><h3>Character motion prompts</h3><p>Start with a direction and edit the movement for your scene.</p></div></div>
  <div class="ai-preset-bar" role="group" aria-label="Motion prompts">
    ${prompts.map(item => `<button class="ai-preset ${item.key===preset?'selected':''}" type="button" data-ai-action="preset" data-preset="${item.key}">${escapeText(item.name)}</button>`).join('')}
  </div>
  <label class="ai-prompt-label" for="ai-motion-prompt">Movement prompt · English</label>
  <textarea id="ai-motion-prompt" rows="5" spellcheck="false" aria-label="Movement prompt">${escapeText(promptDraft)}</textarea>
  <div class="ai-prompt-actions">
    <button class="ai-copy" type="button" data-ai-action="copy">Copy motion prompt</button>
    <button class="ai-link" type="button" data-ai-action="open">Use in AI generator ↗</button>
  </div>
  <div class="ai-divider"></div>
  <div class="ai-panel-head ai-clips-header"><div><span class="eyebrow">YOUR OUTPUTS / PRIVATE ON THIS DEVICE</span><h3>Generated video clips</h3><p>After the AI creates your video, download the MP4 and add it here to review your scenes.</p></div>
  <button class="ai-import" type="button" data-ai-action="import">＋ Import AI video</button></div>
  <input type="file" id="ai-import-input" accept="video/*,.mp4,.mov,.webm" multiple hidden>
  <div class="ai-clips-grid" id="ai-clips-list"><div class="ai-clip-empty">Your real AI-generated clips will appear here. No videos added yet.</div></div>
  <div id="ai-local-notice" aria-live="polite"></div>
  <div class="ai-footnotes"><p><strong>Free generation is not unlimited.</strong> Runs on the community Wan 2.2 Space by Hugging Face ZeroGPU. Free accounts have daily GPU quotas and queues. The model is hosted externally; do not upload private client material. If Safari blocks the embedded tool, open the original Space.</p><button class="ai-original-link" type="button" data-ai-action="external">Open original AI generator ↗</button></div>
  `;
  const marker = target.querySelector('.preview-panel');
  if(marker) target.insertBefore(section,marker); else target.appendChild(section);
  root.classList.add('ai-mode-enabled');
  if(!root.classList.contains('ai-editor-open'))root.classList.add('ai-first');
  renderClipList();
}
function renderClipList(){
  const parent = root.querySelector('#ai-clips-list');
  if(!parent) return;
  if(!clips.length){parent.innerHTML='<div class="ai-clip-empty">Your real AI-generated clips will appear here. No videos added yet.</div>';return;}
  parent.innerHTML = clips.map((clip,index)=>{
    const source = liveUrls.get(clip.id)||'';
    return `<article class="ai-clip"><video src="${source}" controls playsinline preload="metadata" aria-label="Clip ${index+1}: ${escapeText(clip.name)}"></video><div class="ai-clip-row"><div><b>${escapeText(clip.name)}</b><small>MP4 / VIDEO · ${(clip.bytes/1024/1024).toFixed(1)} MB</small></div><button type="button" data-ai-action="remove-clip" data-id="${clip.id}" aria-label="Delete this clip">×</button></div></article>`;
  }).join('');
}
async function loadClips(){
  try {
    clips = (await transact('getAll')).sort((a,b)=>a.createdAt-b.createdAt);
    clips.forEach(clip=>{if(!liveUrls.has(clip.id))liveUrls.set(clip.id,URL.createObjectURL(clip.blob));});
    renderClipList();
  } catch(error){announce('Could not load clips from Safari storage.',true);}
}
async function importClips(files){
  const chosen=Array.from(files||[]);
  if(!chosen.length)return;
  let inserted=0;
  for(const file of chosen){
    if(!file.type.startsWith('video/') && !/\.(mp4|mov|webm)$/i.test(file.name)) continue;
    if(file.size>120*1024*1024){announce('Clip too large for local iPad library: '+file.name,true);continue;}
    const clip={id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),name:file.name,bytes:file.size,blob:file,createdAt:Date.now()+inserted};
    try{await transact('put',clip);clips.push(clip);liveUrls.set(clip.id,URL.createObjectURL(file));inserted++;}
    catch(error){announce('Not enough Safari storage to save '+file.name+'. Keep your original MP4 in Files.',true);}
  }
  renderClipList();
  if(inserted)announce(inserted+' video clip(s) imported and saved locally.');
}
function setPrompt(key){
  const chosen=prompts.find(value=>value.key===key);
  if(!chosen)return;
  preset=key;
  promptDraft=chosen.text;
  const field=root.querySelector('#ai-motion-prompt');
  if(field)field.value=promptDraft;
  for(const button of root.querySelectorAll('[data-ai-action="preset"]'))button.classList.toggle('selected',button.dataset.preset===key);
}
function showModal(){
  if(!modal){
    modal=document.createElement('div');
    modal.className='ai-provider-modal';
    modal.hidden=true;
    modal.innerHTML=`<div class="ai-modal-top"><div class="ai-modal-title"><span>✳</span><div><b>AI Video Generator</b><small>WAN 2.2 · Hugging Face ZeroGPU</small></div></div><div class="ai-modal-top-actions"><button type="button" data-ai-action="copy">Copy prompt</button><a href="${officialUrl}" target="_blank" rel="noopener noreferrer">Open original ↗</a><button class="ai-modal-close" type="button" data-ai-action="close" aria-label="Close AI generator">×</button></div></div>
    <div class="ai-modal-note">Upload your photo in the generator, paste your movement prompt, then press Generate Video. The AI creates real motion. If the frame is blocked by Safari, use <a href="${officialUrl}" target="_blank" rel="noopener noreferrer">Open original</a>.</div>
    <iframe title="Wan 2.2 free AI image-to-video generator" class="ai-provider-frame" loading="eager" referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write; fullscreen"></iframe>`;
    document.body.appendChild(modal);
  }
  modal.hidden=false;document.body.classList.add('ai-modal-open');
  const frame=modal.querySelector('iframe');
  if(!frame.getAttribute('src'))frame.setAttribute('src',generatorUrl);
}
function hideModal(){if(modal)modal.hidden=true;document.body.classList.remove('ai-modal-open');}
async function copyPrompt(){
  const str=root.querySelector('#ai-motion-prompt')?.value||promptDraft;
  try{await navigator.clipboard.writeText(str);announce('Prompt copied. Paste it into the AI generator.');}
  catch(error){const ta=root.querySelector('#ai-motion-prompt');if(ta){ta.focus();ta.select();}announce('Select and copy the prompt above.',true);}
}
function switchEditor(){
  const willOpen=!editorIsOpen();
  root.classList.toggle('ai-editor-open',willOpen);
  root.classList.toggle('ai-first',!willOpen);
  const toggle=root.querySelector('[data-ai-action="switch-editor"]');
  if(toggle)toggle.textContent=willOpen?'Hide photo editor':'Open photo editor';
  if(willOpen)root.querySelector('.preview-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
}
root.classList.add('ai-mode-enabled');
const observer=new MutationObserver(createPanel);
observer.observe(root,{childList:true,subtree:false});
createPanel();loadClips();
document.addEventListener('click',async(event)=>{
  const button=event.target.closest('[data-ai-action]');
  if(!button)return;
  const action=button.dataset.aiAction;
  if(action==='open'){showModal();return;}
  if(action==='external'){window.open(officialUrl,'_blank','noopener,noreferrer');return;}
  if(action==='close'){hideModal();return;}
  if(action==='copy'){await copyPrompt();return;}
  if(action==='switch-editor'){switchEditor();return;}
  if(action==='preset'){setPrompt(button.dataset.preset);return;}
  if(action==='import'){root.querySelector('#ai-import-input')?.click();return;}
  if(action==='remove-clip'){
    const id=button.dataset.id;const clip=clips.find(c=>c.id===id);if(!clip)return;
    if(!window.confirm('Delete the saved clip '+clip.name+' from this iPad library?'))return;
    try{await transact('delete',id);clips=clips.filter(c=>c.id!==id);URL.revokeObjectURL(liveUrls.get(id));liveUrls.delete(id);renderClipList();announce('Clip removed from local library.');}
    catch(error){announce('Could not remove the clip. Please try again.',true);}
  }
});
document.addEventListener('input',(event)=>{if(event.target.id==='ai-motion-prompt')promptDraft=event.target.value;});
document.addEventListener('change',async(event)=>{
  if(event.target.id==='ai-import-input'){await importClips(event.target.files);event.target.value='';}
});
document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&modal&&!modal.hidden)hideModal();});
})();