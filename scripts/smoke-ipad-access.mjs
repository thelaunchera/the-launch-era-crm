import {webkit} from 'playwright';

const base='https://the-launch-era-crm.dailinsegura17.workers.dev';
const browser=await webkit.launch({headless:true});
const page=await browser.newPage({
 viewport:{width:1024,height:1366},
 userAgent:'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
});
page.on('pageerror',e=>console.log('PAGE_ERROR',String(e.message).slice(0,350)));
page.on('requestfailed',r=>console.log('REQUEST_FAILED',r.url().slice(0,180),r.failure()?.errorText));
page.on('response',r=>{if(r.status()>=400)console.log('HTTP_ERROR',r.status(),r.url().slice(0,180));});
async function probe(path,expected,waitMs=13000){
 const url=base+path;
 console.log('PROBE',url);
 let goto;
 try{goto=await page.goto(url,{waitUntil:'domcontentloaded',timeout:32000});}
 catch(e){console.log('NAVIGATION_ERROR',e.message);}
 await page.waitForTimeout(waitMs);
 const info=await page.evaluate(()=>{
  const login=document.querySelector('#authForm')||document.querySelector('#signin');
  const loading=document.querySelector('#tleLoading');
  return {title:document.title,readyState:document.readyState,bodyChildren:document.body?.children?.length,
  bodyText:document.body?.innerText?.slice(0,380),loginExists:!!login,loginVisible:!!login&&getComputedStyle(login).display!=='none',
  loadingExists:!!loading,loadingVisible:!!loading&&getComputedStyle(loading).display!=='none',
  loadingText:loading?.innerText?.slice(0,240),sdkAvailable:!!window.supabase?.createClient};
 });
 console.log('RESULT',JSON.stringify({path,status:goto?.status(),...info}));
 await page.screenshot({path:'safari-'+expected+'.png',fullPage:false});
 if(!info.loginVisible && expected==='light')throw new Error('Lightweight login not visible in WebKit');
 if(info.loadingVisible && !info.loadingText?.includes('Try again') && expected==='main')throw new Error('Main Command Center blocked by loading overlay');
}
try{
 await probe('/access','light',2500);
 await probe('/?app=tle','main',14000);
 console.log('PASS: Safari-like WebKit renders the public sign-in paths.');
}finally{
 await browser.close();
}
