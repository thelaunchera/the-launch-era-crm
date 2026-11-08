/**
 * OFF BRIEF · Portable backup across the old AppDeploy and new GitHub-hosted
 * origins. No cloud transfer: TAR is assembled in the browser with Blob slices.
 * Save the resulting file somewhere safe before switching addresses.
 */
(function portableOffBriefBackup() {
  'use strict';
  const SCHEMA='offbrief-portable-v1';
  const SOURCES=[
    {db:'offbrief-ipad-studio-v1',store:'projects'},
    {db:'offbrief-finalcut-v1',store:'cuts'},
    {db:'offbrief-generated-clips-v1',store:'clips'}
  ];
  const LOCAL_KEYS=['offbrief_google_folders','offbrief_season2_folder'];
  const $=sel=>document.querySelector(sel);
  const info=(msg,warning=false)=>{
    const n=$('#ob-backup-notice');
    if(n){n.textContent=msg;n.classList.toggle('warning',warning);}
  };
  const openDb=spec=>new Promise((resolve,reject)=>{
    const request=indexedDB.open(spec.db,1);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains(spec.store))
        request.result.createObjectStore(spec.store,{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  const listRecords=async spec=>{
    const db=await openDb(spec);
    try {
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(spec.store,'readonly');
        const req=tx.objectStore(spec.store).getAll();
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error);
      });
    } finally {db.close();}
  };
  const bytes=(text)=>new TextEncoder().encode(text);
  const writeAscii=(arr,start,size,str)=>{
    const chars=bytes(str);
    if(chars.length>size)throw new Error('Archive filename is too long.');
    arr.set(chars,start);
  };
  const octal=(v,len)=>Math.floor(v).toString(8).padStart(len-1,'0')+'\0';
  const tarHeader=(name,size)=>{
    const h=new Uint8Array(512);
    writeAscii(h,0,100,name);
    writeAscii(h,100,8,'0000644\0');
    writeAscii(h,108,8,'0000000\0');
    writeAscii(h,116,8,'0000000\0');
    writeAscii(h,124,12,octal(size,12));
    writeAscii(h,136,12,octal(Math.floor(Date.now()/1000),12));
    for(let i=148;i<156;i++)h[i]=32;
    h[156]='0'.charCodeAt(0);
    writeAscii(h,257,6,'ustar\0');
    writeAscii(h,263,2,'00');
    let sum=0;for(const b of h)sum+=b;
    writeAscii(h,148,8,sum.toString(8).padStart(6,'0')+'\0 ');
    return h;
  };
  const makeTar=items=>{
    const pieces=[];
    let total=1024;
    for(const {name,blob} of items){
      if(blob.size > Number.MAX_SAFE_INTEGER)throw new Error('File too large to back up.');
      pieces.push(tarHeader(name,blob.size),blob);
      const pad=(512-blob.size%512)%512;
      if(pad)pieces.push(new Uint8Array(pad));
      total+=512+blob.size+pad;
    }
    pieces.push(new Uint8Array(1024));
    return new Blob(pieces,{type:'application/x-tar'});
  };
  const pack=async()=>{
    const media=[];
    const seen=new WeakSet();
    const encode=value=>{
      if(value instanceof Blob){
        const path='media/'+String(media.length+1).padStart(7,'0')+'.bin';
        media.push({name:path,blob:value});
        return {__offbriefMedia:path,type:value.type||'application/octet-stream',
          fileName:value instanceof File?value.name:null,
          lastModified:value instanceof File?value.lastModified:null};
      }
      if(value instanceof Date)return {__offbriefDate:value.toISOString()};
      if(Array.isArray(value))return value.map(encode);
      if(value&&typeof value==='object'){
        if(seen.has(value))throw new Error('A circular object cannot be archived.');
        seen.add(value);
        const obj={};
        for(const [key,entry] of Object.entries(value))obj[key]=encode(entry);
        seen.delete(value);
        return obj;
      }
      return value;
    };
    const stores=[];
    for(const spec of SOURCES){
      info('Reading '+spec.db+' …');
      const rows=await listRecords(spec);
      stores.push({db:spec.db,store:spec.store,records:rows.map(encode)});
    }
    const local={};
    for(const key of LOCAL_KEYS){
      try{const value=localStorage.getItem(key);if(value!=null)local[key]=value;}catch(_){}
    }
    const manifest={
      schema:SCHEMA,createdAt:new Date().toISOString(),
      origin:location.origin,
      warning:'PRIVATE OFF BRIEF PROJECT DATA — original photos, videos and voice recordings may be included.',
      stores,localStorage:local
    };
    const items=[{name:'manifest.json',blob:new Blob([JSON.stringify(manifest)],{type:'application/json'})},...media];
    return {file:makeTar(items),counts:stores.map(x=>x.db+' · '+x.records.length),mediaCount:media.length};
  };
  const readAscii=(buf,start,len)=>{
    const part=buf.slice(start,start+len);
    const end=part.indexOf(0);
    return new TextDecoder('utf-8').decode(end<0?part:part.slice(0,end)).trim();
  };
  const unpack=async file=>{
    let offset=0,manifest=null;
    const blobs=new Map();
    if(file.size<1536)throw new Error('The archive is too small or invalid.');
    while(offset+512<=file.size){
      const head=new Uint8Array(await file.slice(offset,offset+512).arrayBuffer());
      if(head.every(x=>x===0))break;
      const name=readAscii(head,0,100);
      const size=parseInt(readAscii(head,124,12),8);
      if(!name||!Number.isSafeInteger(size)||size<0||offset+512+size>file.size)
        throw new Error('Damaged TAR archive; no projects have been changed.');
      const slice=file.slice(offset+512,offset+512+size);
      if(name==='manifest.json')manifest=JSON.parse(await slice.text());
      else if(/^media\/\d{7}\.bin$/.test(name))blobs.set(name,slice);
      offset+=512+Math.ceil(size/512)*512;
    }
    if(!manifest||manifest.schema!==SCHEMA||!Array.isArray(manifest.stores))
      throw new Error('This is not an OFF BRIEF Portable Backup.');
    return {manifest,blobs};
  };
  const restore=async (manifest,blobs)=>{
    const decode=value=>{
      if(Array.isArray(value))return value.map(decode);
      if(value&&typeof value==='object'){
        if(value.__offbriefMedia){
          const media=blobs.get(value.__offbriefMedia);
          if(!media)throw new Error('Missing backup video or audio: '+value.__offbriefMedia);
          if(value.fileName&&typeof File==='function')
            return new File([media],value.fileName,{type:value.type||'',lastModified:value.lastModified||Date.now()});
          return media.slice(0,media.size,value.type||'');
        }
        if(value.__offbriefDate)return new Date(value.__offbriefDate);
        const out={};
        for(const [key,v] of Object.entries(value))out[key]=decode(v);
        return out;
      }
      return value;
    };
    const validated=[];
    for(const spec of SOURCES){
      const source=manifest.stores.find(r=>r.db===spec.db&&r.store===spec.store);
      if(!source)continue;
      if(!Array.isArray(source.records))throw new Error('Invalid saved record list.');
      validated.push({spec,records:source.records.map(decode).filter(x=>x&&typeof x.id==='string')});
    }
    for(const {spec,records} of validated){
      info('Importing '+spec.db+' — '+records.length+' records …');
      const db=await openDb(spec);
      try{
        await new Promise((resolve,reject)=>{
          const tx=db.transaction(spec.store,'readwrite');
          const store=tx.objectStore(spec.store);
          for(const record of records){
            const lookup=store.get(record.id);
            lookup.onsuccess=()=>{
              const old=lookup.result;
              const oldTime=Number(old?.savedAt||old?.updatedAt||0);
              const incomingTime=Number(record.savedAt||record.updatedAt||0);
              if(!old||incomingTime>=oldTime)store.put(record);
            };
          }
          tx.oncomplete=resolve;
          tx.onerror=()=>reject(tx.error);
          tx.onabort=()=>reject(tx.error||new Error('Import aborted.'));
        });
      } finally {db.close();}
    }
    for(const key of LOCAL_KEYS) {
      const value=manifest.localStorage?.[key];
      if(typeof value==='string')try{localStorage.setItem(key,value);}catch(_){}
    }
    return validated.map(x=>x.spec.store+': '+x.records.length).join(', ');
  };
  const safeFileName='OFFBRIEF_STUDIO_FULL_BACKUP_'+new Date().toISOString().slice(0,10)+'.tar';
  const download=async blob=>{
    if(window.showSaveFilePicker){
      try{
        const handle=await window.showSaveFilePicker({
          suggestedName:safeFileName,types:[{description:'OFF BRIEF Backup',accept:{'application/x-tar':['.tar']}}]
        });
        const stream=await handle.createWritable();await stream.write(blob);await stream.close();return;
      }catch(err){if(err.name==='AbortError')return;}
    }
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=safeFileName;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  };
  const initialize=()=>{
    const nav=document.querySelector('.fc-mode-nav');
    if(!nav)return;
    const row=nav.querySelector('div');
    if(!row||row.querySelector('#ob-open-backup'))return;
    const trigger=document.createElement('button');
    trigger.id='ob-open-backup';trigger.type='button';
    trigger.textContent='Backup & Move';
    row.appendChild(trigger);
    const dialog=document.createElement('dialog');dialog.id='ob-backup-dialog';
    dialog.innerHTML=
      '<div class="ob-backup-head"><div><span>OFF BRIEF / PRIVATE DATA</span><h2>Backup & transfer</h2></div><button type="button" id="ob-close-backup" aria-label="Close backup dialog">×</button></div>'+
      '<p>Move ALL locally saved storyboards, photos, generated clips, imported MP4s, split edits, voices, sounds and pauses to your new studio. Nothing is uploaded to a server.</p>'+
      '<div class="ob-backup-choice"><h3>1 · Back up this device</h3><p>Download a portable TAR archive. Keep it safely in Files or Google Drive before switching websites.</p><button type="button" id="ob-export-backup">Download complete backup</button></div>'+
      '<div class="ob-backup-choice"><h3>2 · Restore on the new website</h3><p>Open Backup & Move on your new Video Studio address and select the same TAR file. Imported projects merge by ID without clearing existing work.</p><label for="ob-import-file" class="ob-import-label">Choose backup TAR file</label><input id="ob-import-file" type="file" accept=".tar,application/x-tar" hidden></div>'+
      '<p id="ob-backup-notice" role="status">Your existing data stays on this device until you export it.</p><small>Private video projects can produce large backups. Keep your iPhone/iPad awake during transfer. Do not send the backup to anyone else.</small>';
    document.body.appendChild(dialog);
    trigger.addEventListener('click',()=>dialog.showModal());
    dialog.querySelector('#ob-close-backup').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    const exportButton=dialog.querySelector('#ob-export-backup');
    exportButton.addEventListener('click',async()=>{
      exportButton.disabled=true;
      try{
        const {file,counts,mediaCount}=await pack();
        info('Backup assembled: '+counts.join(' • ')+'; '+mediaCount+' media files. Saving…');
        await download(file);
        info('Backup generated ('+(file.size/1048576).toFixed(1)+' MB). Confirm it appears in Files before changing websites.');
      }catch(err){info('Backup failed: '+String(err?.message||err),true);}
      finally{exportButton.disabled=false;}
    });
    dialog.querySelector('#ob-import-file').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{
        const {manifest,blobs}=await unpack(file);
        const summary=manifest.stores.map(x=>x.store+': '+x.records.length).join(' • ');
        if(!confirm('Restore OFF BRIEF data from '+(manifest.origin||'another studio')+'? '+summary+'. Existing newer records will be kept; older duplicates will not replace them.'))return;
        const result=await restore(manifest,blobs);
        info('Import complete: '+result+'. Reloading the Studio.');
        location.reload();
      }catch(err){info('Import failed: '+String(err?.message||err),true);}
      finally{e.target.value='';}
    });
  };
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
