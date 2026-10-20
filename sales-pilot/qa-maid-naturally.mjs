import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const htmlPath=path.resolve('sales-pilot/maid-naturally-conversion-preview.html');
const html=fs.readFileSync(htmlPath,'utf8');
assert.ok(/(Independent (sales|design) concept)/.test(html) && /No live bookings/i.test(html),'Must visibly disclose non-affiliation and no live booking');
assert.ok(!/<form\b/i.test(html),'Concept preview must not create actual form submissions');
const script=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert.ok(script,'Missing local interaction script');
new Function(script); // Syntax check, not execution
const browser=await chromium.launch({headless:true});
const failures=[];
try{
 for (const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:870},deviceScaleFactor:1, reducedMotion:'reduce'});
  const errors=[],unsafe=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))unsafe.push(r.method()+' '+r.url())});
  await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'domcontentloaded'});
  await page.locator('.hero h1').waitFor();
  // Ensure remote imagery has finished loading BEFORE visual screenshots.
  await page.locator('img').evaluateAll(imgs=>imgs.forEach(img=>img.loading='eager'));
  await page.waitForFunction(()=>Array.from(document.images).every(img=>img.complete),null,{timeout:20000});
  const imageReport=await page.locator('img').evaluateAll(imgs=>imgs.map(img=>({url:img.currentSrc,loaded:img.naturalWidth>0})));
  assert.ok(imageReport.filter(x=>x.loaded).length>=5,'Photos or logo missing: '+JSON.stringify(imageReport));
  await page.screenshot({path:'sales-pilot/qa-artifacts/hero-'+width+'.png',fullPage:true,animations:'disabled'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true,'Horizontal overflow at '+width);
  // Tabs in the owner-facing sample dashboard must actually filter rows.
  await page.locator('.dash-filter[data-filter="quote"]').click();
  assert.equal(await page.locator('.dashboard-row:visible').count(),1,'Quote-ready filter returned unexpected result at '+width);
  assert.match(await page.locator('.dashboard-row:visible').innerText(),/Quote ready/i);
  await page.locator('.dash-filter[data-filter="all"]').click();
  assert.equal(await page.locator('.dashboard-row:visible').count(),3,'All requests should restore sample rows at '+width);
  assert.equal(await page.locator('.dash-filter[data-filter="all"]').getAttribute('aria-pressed'),'true');

  const heroPhoto=await page.locator('.hero-visual img').evaluate(img=>img.complete&&img.naturalWidth>0);
  if (!heroPhoto) errors.push('Hero image failed to load at '+width);
  await page.locator('[data-pick="Scheduled Housekeeping"]').click();
  assert.equal(await page.locator('[data-choice="Scheduled Housekeeping"]').getAttribute('aria-pressed'),'true');
  await page.locator('#next1').click();
  assert.equal(await page.locator('#step2').isVisible(),true);
  await page.locator('#space').selectOption('House');
  await page.locator('#bedrooms').selectOption('3');
  await page.locator('#bathrooms').selectOption('2');
  await page.locator('#frequency').selectOption('Every two weeks');
  await page.locator('#pets').check();
  await page.locator('#next2').click();
  assert.equal(await page.locator('#step3').isVisible(),true);
  assert.match(await page.locator('#summary').innerText(),/Scheduled Housekeeping/);
  await page.locator('#handoff').click();
  assert.equal(await page.locator('#owner').isVisible(),true);
  assert.match(await page.locator('#status').innerText(),/New inquiry/);
  await page.screenshot({path:'sales-pilot/qa-artifacts/handoff-'+width+'.png',animations:'disabled'});
  await page.locator('#advance').click();
  assert.match(await page.locator('#status').innerText(),/quote ready/i);
  await page.locator('#advance').click();
  assert.match(await page.locator('#status').innerText(),/confirmed/i);
  await page.locator('#restart').click();
  assert.equal(await page.locator('#step1').isVisible(),true);
  assert.equal(await page.locator('#owner').isVisible(),false);
  assert.equal(unsafe.length,0,'A non-GET/HEAD request was emitted: '+unsafe.join(','));
  if(errors.length)failures.push(...errors.map(e=>width+': '+e));
  console.log(width+'px: booking preview/owner workflow PASS, issues: '+errors.length);
  await page.close();
 }
}finally{await browser.close()}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
else console.log('PASS: 3 responsive widths, no horizontal scroll or unsent data, mock handoff and reset');
