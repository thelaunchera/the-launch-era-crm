import {chromium} from "playwright";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import assert from "node:assert/strict";
const root=resolve(".customer-site");
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,"http://localhost").pathname;
  const file=resolve(root,"."+(pathname==="/"?"/index.html":decodeURIComponent(pathname)));
  if(!file.startsWith(root+sep))throw Error("Bad path");
  const data=await readFile(file);
  res.writeHead(200,{"Content-Type":({".html":"text/html",".css":"text/css",".js":"application/javascript"}[extname(file)]||"text/plain")});res.end(data);
 }catch{res.writeHead(404);res.end("Not found")}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const mock="window.supabase={createClient(){\n const rows=[{id:\"fx-1\",workspace_id:\"w-fixture\",business:\"Sample Cleaning Co\",contact:\"Sample Contact\",source:\"Referral\",stage:\"New\",notes:\"\",followup:\"2026-10-25\"},{id:\"fx-2\",workspace_id:\"w-fixture\",business:\"Example House Care\",contact:\"Example Person\",source:\"Website\",stage:\"Follow-up\",notes:\"\",followup:\"2026-10-20\"}];\n const api={auth:{getUser:async()=>({data:{user:{id:\"fixture-user\",email:\"qa@example.invalid\"}},error:null}),signInWithPassword:async()=>({error:null}),signOut:async()=>({error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from(table){\n let action=\"\",values={},id=\"\";\n const chain={select(){return chain},eq(k,v){if(k===\"id\")id=v;return chain},is(){return chain},order(){return chain},\n update(data){action=\"update\";values=data;return chain},insert(data){action=\"insert\";values=data;return chain},\n async limit(){if(table===\"tle_crm_workspaces\")return {data:[{id:\"w-fixture\",created_by:\"fixture-user\",is_internal:false,name:\"Sample Business\"}]};if(table===\"tle_crm_leads\")return {data:rows.map(x=>({...x}))};return {data:[]}},\n async single(){if(action===\"update\"){const row=rows.find(x=>x.id===id);if(row)Object.assign(row,values);return {data:{id},error:null}}if(action===\"insert\"){const row={id:\"fx-\"+(rows.length+1),...values};rows.push(row);return {data:{id:row.id},error:null}}return {data:{id},error:null}}};\n return chain;\n }};\n return api;\n}}";
let instance;
try{
 instance=await chromium.launch({headless:true});
 for(const width of [375,768,1024,1440]){
  const page=await instance.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  await page.route("**/vendor/supabase-js-v2.57.0.umd.js",r=>r.fulfill({status:200,contentType:"application/javascript",body:mock}));
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:"load"});
  await page.locator("#pipelineBoard .deal").first().waitFor({timeout:12000});
  assert.equal(await page.locator("#pipelineBoard .deal").count(),2);
  assert.equal(await page.locator("[data-screen]").count(),8);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,"Body overflow at "+width);
  if(width<=760){await page.locator("#menuToggle").click()}
  await page.locator('#nav [data-view="leads"]').click();
  assert.equal(await page.locator("#leadRows tr").count(),2);
  await page.locator("#leadSearch").fill("House Care");
  assert.equal(await page.locator("#leadRows tr").count(),1);
  await page.locator("#leadSearch").fill("");
  await page.locator("#leadRows button").first().click();
  await page.locator("#contactDialog[open]").waitFor();
  await page.locator('[data-contact-tab="notes"]').click();
  await page.locator("#noteForm textarea").fill("Synthetic QA note");
  await page.locator('#noteForm button[type="submit"]').click();
  await page.locator("#noteHistory").getByText("Synthetic QA note",{exact:false}).waitFor();
  await page.locator("#contactDialog .drawer-head button").click();
  if(errors.length)throw Error("Page errors at "+width+": "+errors.join(" | "));
  console.log("PASS customer-only CRM viewport and synthetic interactions",width);
  await page.close();
 }
}finally{await instance?.close();await new Promise(done=>server.close(done))}
