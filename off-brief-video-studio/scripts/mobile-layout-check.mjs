import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.env.OFFBRIEF_PREVIEW_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({headless:true});
const output='mobile-qa-results';
await mkdir(output,{recursive:true});

const failures=[];
const collected=[];
for (const width of [375,390,430]) {
  const page=await browser.newPage({
    viewport:{width,height:812},
    deviceScaleFactor:2,
    isMobile:true,
    hasTouch:true
  });
  page.on('pageerror',error=>failures.push(width+'px JS error: '+error.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  try {
    await page.locator('#offbrief-final-cut .fc-mobile-dock button').first().waitFor({state:'visible',timeout:25000});
    const metrics=await page.evaluate(()=>{
      const rect=selector=>{
        const el=document.querySelector(selector);
        if(!el)return null;
        const r=el.getBoundingClientRect();
        return {x:Math.round(r.left),y:Math.round(r.top),width:Math.round(r.width),height:Math.round(r.height)};
      };
      const visible=selector=>{
        const el=document.querySelector(selector);
        return Boolean(el&&getComputedStyle(el).display!=='none');
      };
      const strip=document.querySelector('.fc-shot-grid');
      return {
        windowWidth:window.innerWidth,
        scrollHeight:document.documentElement.scrollHeight,
        topNav:rect('.fc-mode-nav'),
        episode:rect('#fc-episode'),
        preview:rect('.fc-preview'),
        video:rect('.fc-preview-stage'),
        timeline:rect('.fc-shot-grid'),
        toolbox:rect('.fc-inspector'),
        dock:rect('.fc-mobile-dock'),
        sceneHorizontalOverflow:Boolean(strip&&strip.scrollWidth>strip.clientWidth),
        activePanel:document.querySelector('#offbrief-final-cut')?.dataset.mobilePanel,
        clipsVisible:visible('.fc-inspector > .fc-import-bulk'),
        flowVisible:visible('.fc-inspector > .fc-flow-workflow')
      };
    });
    collected.push(metrics);
    if(metrics.windowWidth!==width)failures.push(width+'px viewport mismatch');
    if(!metrics.preview||metrics.preview.y>200)failures.push(width+'px video preview not near top');
    if(!metrics.dock||metrics.dock.y<650||metrics.dock.y>812)failures.push(width+'px dock not at bottom');
    if(!metrics.sceneHorizontalOverflow)failures.push(width+'px 10 scenes did not become horizontal swipe strip');
    if(metrics.scrollHeight>1450)failures.push(width+'px excessive vertical initial scroll: '+metrics.scrollHeight);
    if(!metrics.clipsVisible||metrics.flowVisible)failures.push(width+'px Clips tab visibility incorrect');
    await page.screenshot({path:output+'/offbrief-mobile-'+width+'.png',fullPage:false});
    await page.locator('[data-fc-panel="audio"]').click();
    const audio=await page.locator('.fc-inspector > .fc-sound-editor').isVisible();
    const others=await page.locator('.fc-inspector > .fc-flow-workflow').isVisible();
    if(!audio||others)failures.push(width+'px audio panel failed to replace other panels');
    await page.locator('[data-fc-panel="effects"]').click();
    if(!await page.locator('.fc-inspector > .fc-effects-editor').isVisible())
      failures.push(width+'px pause/effects panel not visible');
    await page.locator('[data-fc-panel="flow"]').click();
    if(!await page.locator('.fc-inspector > .fc-flow-workflow').isVisible())
      failures.push(width+'px Google Flow panel not visible');
    await page.locator('[data-fc-panel="script"]').click();
    if(!await page.locator('.fc-inspector > .fc-detail').first().isVisible())
      failures.push(width+'px script notes panel not visible');
    await page.locator('[data-fc-panel="export"]').click();
    if(!await page.locator('.fc-inspector > .fc-export').isVisible())
      failures.push(width+'px export panel not visible');
    await page.locator('[data-fc-panel="clips"]').click();
    await page.screenshot({path:output+'/offbrief-mobile-'+width+'-clips.png',fullPage:true});
  } catch(err) {
    failures.push(width+'px test failed: '+err.message);
  } finally { await page.close(); }
}
await browser.close();
console.log('OFF BRIEF MOBILE UX METRICS:\n'+JSON.stringify(collected,null,2));
if(failures.length) {
  console.error('OFF BRIEF MOBILE QA FAILURES:\n'+failures.join('\n'));
  process.exitCode=1;
} else {
  console.log('PASS: 375, 390 and 430px; video, scene timeline, compact tool panels, backup-compatible layout.');
}
