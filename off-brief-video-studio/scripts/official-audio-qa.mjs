import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url=process.env.OFFBRIEF_TEST_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const errors=[];
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
page.on('pageerror',error=>errors.push('JS exception: '+error.message));
try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#offbrief-final-cut .fc-mobile-dock [data-fc-panel="audio"]').waitFor({timeout:25000});
  await page.locator('#offbrief-final-cut [data-fc-panel="audio"]').click();

  for(const [id,expected] of [['offbrief-series-bed','Series Background'],['offbrief-presentation','Presentation Sound']]){
    const row=page.locator('.fc-official-audio-row').filter({has:page.locator('[data-fc="add-official"][data-id="'+id+'"]')});
    if(await row.count()!==1)errors.push('Cannot locate sound library row '+id);
    if(!(await row.textContent())?.includes(expected))errors.push('Wrong sound title '+id);
    const listen=row.locator('[data-fc="listen-official"]');
    if(!await listen.isVisible())errors.push('Listen is not visible: '+id);
  }

  const metadata=await page.evaluate(async ()=>{
    const paths=[
      'audio/offbrief-series-background.mp3',
      'audio/offbrief-presentation-sound.wav'
    ];
    const ctx=new AudioContext();
    await ctx.resume();
    const result=[];
    for(const path of paths){
      const response=await fetch(path);
      if(!response.ok)throw Error('Missing audio asset '+path+': '+response.status);
      const bytes=await response.arrayBuffer();
      // decodeAudioData() transfers and detaches its input ArrayBuffer.
      // Measure original length *before* decoding, otherwise it reads 0.
      const byteCount=bytes.byteLength;
      const sound=await ctx.decodeAudioData(bytes);
      result.push({path,bytes:byteCount,seconds:sound.duration,channels:sound.numberOfChannels,sampleRate:sound.sampleRate});
    }
    await ctx.close();
    return result;
  });
  if(metadata[0].bytes!==4898780)errors.push('Music length corrupted');
  if(metadata[1].bytes!==1325622)errors.push('Presentation WAV length corrupted');
  if(Math.abs(metadata[0].seconds-153.051)>0.2)errors.push('Music duration mismatched');
  if(Math.abs(metadata[1].seconds-7.511)>0.2)errors.push('Intro duration mismatched');

  await page.locator('[data-fc="add-official"][data-id="offbrief-series-bed"]').click();
  await page.locator('[data-fc="add-official"][data-id="offbrief-series-bed"]').waitFor({state:'visible'});
  await page.locator('[data-fc="add-official"][data-id="offbrief-presentation"]').click();
  const saved=await page.evaluate(async ()=>{
    const req=indexedDB.open('offbrief-finalcut-v1',1);
    const db=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    const rows=await new Promise((resolve,reject)=>{
      const t=db.transaction('cuts','readonly');
      const q=t.objectStore('cuts').getAll();
      q.onsuccess=()=>resolve(q.result);
      q.onerror=()=>reject(q.error);
    });
    db.close();
    const cut=rows.find(row=>row.sounds?.some(x=>x.id==='offbrief-series-bed'));
    return cut?{episode:cut.id,tracks:cut.sounds.map(x=>({
      id:x.id,anchor:x.anchor,volume:x.volume,blob:!!x.blob,loop:!!x.loop,maxSeconds:x.maxSeconds
    }))}:null;
  });
  if(!saved||saved.tracks.length!==2)errors.push('Expected two saved official sounds: '+JSON.stringify(saved));
  if(saved?.tracks.some(t=>t.blob))errors.push('Official sound copied into IndexedDB instead of referencing bundled file');
  if(!saved?.tracks.some(t=>t.anchor==='intro'&&t.maxSeconds===5))errors.push('Presentation intro placement or five-second bound missing');
  if(!saved?.tracks.some(t=>t.loop&&t.volume===0.13))errors.push('Music loop/low-volume setting missing');

  await mkdir('official-audio-qa',{recursive:true});
  await page.screenshot({path:'official-audio-qa/official-sounds-mobile.png',fullPage:false});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-fc-panel="audio"]').click();
  if(!await page.locator('[data-fc="add-official"][data-id="offbrief-series-bed"]').isDisabled()||
     !await page.locator('[data-fc="add-official"][data-id="offbrief-presentation"]').isDisabled()){
    errors.push('Official music selection was not persisted after page reload');
  }
  console.log('Verified original media decode and per-episode persistence:\n'+JSON.stringify({metadata,saved},null,2));
}catch(error){
 errors.push('Browser validation: '+error.message);
}finally{await page.close();await browser.close();}
if(errors.length){
 console.error('OFF BRIEF OFFICIAL SOUND QA FAILURES:\n'+errors.join('\n'));
 process.exitCode=1;
}else console.log('PASS: original OFF BRIEF audio bytes, iPhone UI, 5s intro placement, background volume and persistent sound library.');
