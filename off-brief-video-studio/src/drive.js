import './drive.css';
(function driveIntegration(){
'use strict';
const core=window.OBProduction;
if(!core)return;
const dirs={1:'1SOjQOVRq2HoFczfVANGPWNggM0FtaPMX',2:'1H9ZVmc1t3wPrR81J2l497hpkjCn8WGan',3:'1XDkFyE5RF6ryWUi1_U_juPcrpkCxTz9K',4:'1uW3IIoSLqUKoF_m-w_FIMsNMuufh3Pas',5:'1NqeHhEpQyPLUNYOhk0A4CKufywz3Z2Pz',6:'1N_TxxJn5XVk5DZqGHnj-QX9TmtbV8Kqm',7:'1nQo8EOZEFOeqLZWbbQBr0DOp5ZtG6b9f',8:'1SgkBevCmcO91Xpx0wtK516vi_JRV3lhA',10:'1jNTiE5VonaHUQ6QlXMNQmOMqf3mzmqiQ'};
let oauthId=localStorage.getItem('offbrief_google_web_client_id')||'';
let customFolders={};
try{customFolders=JSON.parse(localStorage.getItem('offbrief_google_folders')||'{}');}catch(_){}
let season2Root=localStorage.getItem('offbrief_season2_folder')||'';
let token='',warning='',scriptPromise=null,running=false;
const origin=window.location.origin;
const el=id=>document.getElementById(id);
const escape=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const connected=()=>!!token;
const folder=id=>customFolders[id]||dirs[id]||'';
const folderURL=id=>id?'https://drive.google.com/drive/folders/'+id:'';
function normalize(s){
 const value=String(s||'').trim();
 if(/^[A-Za-z0-9_-]{18,}$/.test(value))return value;
 return (value.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]{18,})/)||[])[1]||'';
}
function setMessage(value){warning=value;const msg=el('ob-drive-message');if(msg)msg.textContent=value;}
function paint(){
 const target=el('ob-drive-controls');if(!target)return;
 const ep=core.episodes.find(x=>x.id===core.currentEpisode());
 target.innerHTML=`<div class="ob-drive-status"><b>${connected()?'✓ Connected with read-only permission':'○ Not connected yet'}</b><small>The separate app needs your Google authorization. Its connection is not shared with ChatGPT.</small></div>
 <div class="ob-drive-form">
 <label>Google OAuth Web client ID <small>Public client ID, not a password or secret; needed for a separately hosted website</small>
  <input id="ob-drive-client-id" type="text" autocapitalize="off" autocomplete="off" value="${escape(oauthId)}" placeholder="1234567-xxxxxxxx.apps.googleusercontent.com"/></label>
 <button data-drive-action="connect" type="button" class="ob-black-button">${connected()?'Reauthorize':'Connect Google Drive'}</button>
 ${connected()?'<button data-drive-action="disconnect" type="button" class="ob-neutral">Disconnect</button>':''}
 <div class="ob-drive-help"><b>Google authorization setup (one time)</b><p>Enable Google Drive API on a Google Cloud project, create an OAuth Web client and allow <code>${escape(origin)}</code> as an Authorized JavaScript origin. If the OAuth consent app is in testing, add your email as a test user. Then paste the public Client ID above and select Connect.</p><a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Open Google Cloud credentials ↗</a></div>
 <label>Episode folder: Season ${ep.season}, Episode ${ep.number} <small>Photos F01 through F10 — private folder link</small>
  <input id="ob-drive-episode-folder" type="text" value="${escape(folderURL(folder(ep.id)))}" placeholder="https://drive.google.com/drive/folders/..."/></label>
 <button type="button" class="ob-neutral" data-drive-action="save-folder">Save folder</button>
 <label>Season 2 parent folder (optional) <small>Subfolders named Episode 01–08 will be matched automatically</small>
  <input id="ob-drive-season2-folder" type="text" value="${escape(folderURL(season2Root))}" placeholder="Season 2 folder link"/></label>
 <button type="button" class="ob-neutral" data-drive-action="save-season2">Save Season 2 folder</button>
 <button type="button" class="ob-black-button" data-drive-action="sync" ${connected()?'':'disabled'}>Sync current episode photos ↻</button>
 <p id="ob-drive-message" aria-live="polite">${escape(warning)}</p></div>`;
}
function ensureScript(){
 if(window.google?.accounts?.oauth2)return Promise.resolve();
 if(scriptPromise)return scriptPromise;
 scriptPromise=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
  s.onload=()=>window.google?.accounts?.oauth2?resolve():reject(new Error('Google Identity is unavailable'));
  s.onerror=()=>reject(new Error('Safari blocked Google sign-in script'));document.head.appendChild(s);
 }).catch(err=>{scriptPromise=null;throw err;});
 return scriptPromise;
}
async function connect(){
 oauthId=el('ob-drive-client-id')?.value.trim()||'';
 if(!/^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/.test(oauthId)){setMessage('A registered Google OAuth Web client ID is required. Configure the public client ID first.');return;}
 localStorage.setItem('offbrief_google_web_client_id',oauthId);
 try{
  await ensureScript();
  window.google.accounts.oauth2.initTokenClient({
   client_id:oauthId,scope:'https://www.googleapis.com/auth/drive.readonly',
   callback:res=>{
    if(!res?.access_token){setMessage('Google sign-in was cancelled or did not grant access.');return;}
    token=res.access_token;setMessage('Drive connected. Ready to sync private images.');paint();
    sync(core.currentEpisode(),true);
   }
  }).requestAccessToken();
 }catch(err){setMessage(err.message||'Unable to connect to Google.');}
}
async function request(path){
 if(!token)throw Error('Authorize Drive first');
 const response=await fetch('https://www.googleapis.com/drive/v3/'+path,{headers:{Authorization:'Bearer '+token},cache:'no-store'});
 if(response.status===401){token='';throw Error('Google session expired. Reconnect.');}
 if(!response.ok)throw Error('Drive HTTP '+response.status);
 return response;
}
async function list(folderId){
 const items=[];let page='';
 do{
  const qs=new URLSearchParams({q:"'"+folderId+"' in parents and trashed = false",fields:'nextPageToken,files(id,name,mimeType)',pageSize:'200'});
  if(page)qs.set('pageToken',page);
  const data=await(await request('files?'+qs)).json();
  items.push(...(data.files||[]));page=data.nextPageToken||'';
 }while(page);
 return items;
}
async function findFrames(folderId){
 const q=[{id:folderId,level:0}],seen=new Set(),photos=[];
 while(q.length&&seen.size<24){
  const entry=q.shift();if(!entry||seen.has(entry.id))continue;
  seen.add(entry.id);
  for(const file of await list(entry.id)){
   if(file.mimeType==='application/vnd.google-apps.folder'){
    if(entry.level<2&&!/preview|no originales|vista previa/i.test(file.name))q.push({id:file.id,level:entry.level+1});
   }else if(/^image\//.test(file.mimeType||''))photos.push(file);
  }
 }
 const frames=new Map();
 for(const file of photos){
  if(/extra|preview|[_-]H0?[1-9]/i.test(file.name))continue;
  const found=file.name.match(/(?:^|[_-])F(0[1-9]|10)(?:[_.-]|$)/i);
  if(!found)continue;
  const slot=Number(found[1]);if(!frames.has(slot))frames.set(slot,file);
 }
 return frames;
}
async function discoverSeasonTwo(){
 if(!season2Root)return;
 const nodes=await list(season2Root);
 for(const folderItem of nodes){
  if(folderItem.mimeType!=='application/vnd.google-apps.folder')continue;
  const match=folderItem.name.match(/(?:episode|episodio|capítulo|capitulo)\s*[-_ ]*0?([1-8])\b/i);
  if(!match)continue;
  const id=8+Number(match[1]);
  if(!customFolders[id])customFolders[id]=folderItem.id;
 }
 localStorage.setItem('offbrief_google_folders',JSON.stringify(customFolders));
}
async function sync(epId,automatic=false){
 if(!connected()||running)return;
 const ep=core.episodes.find(x=>x.id===Number(epId));if(!ep)return;
 let dir=folder(ep.id);
 if(!dir&&ep.season===2&&season2Root){try{await discoverSeasonTwo();dir=folder(ep.id);}catch(err){setMessage(err.message);return;}}
 if(!dir){setMessage('No Drive folder found for this episode. Set a folder link first.');return;}
 running=true;setMessage('Reading private originals for '+ep.title+'…');
 try{
  const frames=await findFrames(dir);
  if(!frames.size){setMessage('No F01–F10 photos found. Check the folder and file names.');return;}
  let added=0,skipped=0,failed=0;
  for(let frame=1;frame<=10;frame++){
   const src=frames.get(frame);if(!src)continue;
   const key=core.mediaKey(ep.id,frame,'photo');
   if(core.getAsset(key)){skipped++;continue;}
   try{
    const blob=await(await request('files/'+encodeURIComponent(src.id)+'?alt=media')).blob();
    if(blob.size>25000000)throw Error('File too large');
    await core.saveAsset(key,new File([blob],src.name,{type:src.mimeType||'image/png'}));
    core.getAsset(key)?added++:failed++;
   }catch(error){failed++;}
  }
  core.render();
  setMessage('Drive: '+added+' photo(s) imported, '+skipped+' preserved, '+failed+' failed. Originals remain private.');
  if(!automatic)core.notice('Drive synchronization completed: '+added+' new photos.');
 }catch(err){setMessage('Sync error: '+err.message);}
 finally{running=false;paint();}
}
function disconnect(){
 token='';
 setMessage('Drive disconnected. Local photos and clips are preserved.');paint();
}
document.addEventListener('click',async event=>{
 const control=event.target.closest('[data-drive-action]');if(!control)return;
 const action=control.dataset.driveAction;
 if(action==='connect')await connect();
 if(action==='disconnect')disconnect();
 if(action==='sync')await sync(core.currentEpisode(),false);
 if(action==='save-folder'){
  const dir=normalize(el('ob-drive-episode-folder')?.value);
  if(!dir){setMessage('Paste a valid Google Drive folder link.');return;}
  customFolders[core.currentEpisode()]=dir;
  localStorage.setItem('offbrief_google_folders',JSON.stringify(customFolders));
  setMessage('Episode folder saved privately on this iPad.');paint();
 }
 if(action==='save-season2'){
  const input=el('ob-drive-season2-folder')?.value||'';
  if(input&&!normalize(input)){setMessage('Paste a valid Season 2 folder link.');return;}
  season2Root=normalize(input);
  localStorage.setItem('offbrief_season2_folder',season2Root);
  if(connected()&&season2Root){try{await discoverSeasonTwo();}catch(err){setMessage(err.message);}}
  else setMessage('Season 2 parent folder saved.');
  paint();
 }
});
window.OBDrive={paint,connected,sync};
paint();
})();