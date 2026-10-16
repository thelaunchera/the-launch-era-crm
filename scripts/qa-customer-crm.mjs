import {readFileSync,readdirSync,statSync} from "node:fs";
import {join} from "node:path";
import assert from "node:assert/strict";
const root=".customer-site";
const files=readdirSync(root).sort();
assert.deepEqual(files.sort(),[".nojekyll","app.js","index.html","robots.txt","styles.css","vendor"].sort(),"Unexpected files in customer-only release");
const vendor=readdirSync(join(root,"vendor"));
assert.deepEqual(vendor,["supabase-js-v2.57.0.umd.js"]);
const html=readFileSync(join(root,"index.html"),"utf8");
const js=readFileSync(join(root,"app.js"),"utf8");
const css=readFileSync(join(root,"styles.css"),"utf8");
new Function(js);
const sections=[...html.matchAll(/data-screen="([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(sections.sort(),["pipeline","leads","contacts","inbox","sequences","bookings","forecast","tasks"].sort());
for(const id of ["loginForm","app","nav","pipelineBoard","leadRows","detailForm","noteForm","taskGroups","bookingRows","contactDialog","leadDialog","toast"]){
 assert.ok(html.includes('id="'+id+'"'),"Missing screen or control: "+id)
}
assert.match(js,/\.eq\('created_by',user\.id\)\.eq\('is_internal',false\)/);
assert.match(js,/\.eq\('workspace_id',workspace\.id\)/);
assert.match(js,/db\.auth\.getUser\(\)/);
assert.match(js,/db\.from\('tle_crm_leads'\)\.update/);
assert.match(js,/await saveLead\(lead\.id,\{notes:combined\}\)/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.ok(!/PLACEHOLDER_PURCHASE|mockMessage|fakeRevenue|randomRevenue/.test(js),"Invented metrics or customers prohibited");
const shipped=html+"\n"+js+"\n"+css;
for(const forbidden of [
 "owner-dashboard","owner-orders","owner-support","owner-pages",
 "Jessie","Jessy","Sonny","idea-vault","order-practice",
 "ai-team","booking-studio","tle_ai_team_tasks","tle_owner_ideas",
 "tle_booking_studio_jobs","tle_ai_agent_orders"
 ])assert.ok(!shipped.toLowerCase().includes(forbidden.toLowerCase()),"Private-only module leaked: "+forbidden);
assert.ok(statSync(join(root,"app.js")).size>10000);
console.log("PASS: eight customer-only screens, isolation, honest feature gating and responsive CSS");
