import assert from "node:assert/strict";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const url=pathToFileURL(resolve(".bento-preview/index.html")).href;
const browser=await chromium.launch({headless:true});
try{
  for(const width of [375,768,1024,1440]){
    const page=await browser.newPage({viewport:{width,height:850},reducedMotion:"no-preference"});
    await page.goto(url,{waitUntil:"domcontentloaded"});
    await page.locator("#crmFeatures").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector("#crmFeatures")?.dataset.motion==="revealed");
    await page.waitForTimeout(1400);
    const result=await page.evaluate(()=>{
      const section=document.getElementById("crmFeatures"),tile=section.querySelector(".bento-tile"),grid=section.querySelector(".bento-grid");
      return {tiles:section.querySelectorAll(".bento-tile").length,columns:getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,opacity:getComputedStyle(tile).opacity,
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,motion:section.dataset.motion,
        center:!!document.getElementById("bentoHeadline")};
    });
    assert.equal(result.tiles,7);
    assert.equal(result.columns,width<=850?2:4,"Responsive grid broke at "+width+"px");
    assert.equal(result.opacity,"1","Tiles did not finish entering");
    assert.equal(result.motion,"revealed");
    assert.equal(result.horizontalOverflow,false,"Horizontal scroll at "+width+"px");
    assert.ok(result.center);
    await page.evaluate(()=>{window.scrollTo(0,0);window.scrollTo(0,document.body.scrollHeight)});
    assert.equal(await page.locator("#crmFeatures").getAttribute("data-motion"),"revealed","Entrance looped");
    await page.close();
  }
  const reduced=await browser.newPage({viewport:{width:375,height:800},reducedMotion:"reduce"});
  await reduced.goto(url,{waitUntil:"domcontentloaded"});
  await reduced.waitForFunction(()=>document.querySelector("#crmFeatures")?.dataset.motion==="revealed");
  const values=await reduced.locator(".bento-tile").first().evaluate(el=>({opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform,duration:getComputedStyle(el).transitionDuration}));
  assert.equal(values.opacity,"1");
  assert.equal(values.transform,"none");
  assert.ok(values.duration==="0s"||values.duration==="0s, 0s");
  await reduced.close();
  console.log("PASS: one-shot bento, four responsive widths, reduced motion");
}finally{await browser.close();}
