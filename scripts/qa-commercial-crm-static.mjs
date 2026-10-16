import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../commercial-crm/', import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const html=read('index.html'),js=read('app.js'),css=read('styles.css'),sql=read('sql/20261016_customer_crm_staging.sql');
const config=read('config.staging.js');
const bad=/Jessie|Jessy|Idea Vault|Owner AI Team|CB Depot|purchase simulations|tle_owner_|tle_ai_team_|tle_booking_studio_|private prospect|ownerPrivateSection|ownerOrdersCaption/i;
for(const [name,source] of Object.entries({html,js,css,config})){
 assert.doesNotMatch(source,bad,name+' includes private TLE concepts');
}
assert.match(js,/customer_crm_/,'Must only use isolated customer tables');
assert.match(js,/workspace_id/,'Must scope read and writes by workspace');
assert.match(js,/eq\('workspace_id',state\.workspace\.id\)/,'Must include workspace on read and mutation');
assert.match(js,/signInWithPassword/,'Auth required');
assert.match(js,/environment!=='testing'/,'Only staging preview permitted');
assert.match(sql,/enable row level security/g,'RLS must be enabled');
assert.equal((sql.match(/enable row level security;/g)||[]).length,8,'Expected eight isolated protected tables');
assert.match(sql,/customer_crm_booking_no_overlap/,'Confirmed booking conflicts must be blocked');
for(const screen of ['pipeline','contacts','leads','inbox','sequences','calendar','forecast','tasks']){
 assert.match(html,new RegExp('data-view="'+screen+'"'),screen+' missing navigation');
 assert.match(js,new RegExp('function render'+screen[0].toUpperCase()+screen.slice(1)+'\\('),screen+' missing screen renderer');
}
assert.match(css,/@media\(max-width:760px\)/,'Phone layout required');
assert.match(css,/prefers-reduced-motion/,'Accessibility requirement');
assert.match(html,/\.\.\/vendor\/supabase-js-v2\.57\.0\.umd\.js/,'Pinned auth client');
assert.ok(existsSync(new URL('../vendor/supabase-js-v2.57.0.umd.js',root)),'Vendored pinned Supabase SDK missing');
for(const path of ['app.js','config.staging.js']){
 const result=spawnSync(process.execPath,['--check',new URL(path,root).pathname],{encoding:'utf8'});
 assert.equal(result.status,0,path+' JavaScript failed syntax check: '+(result.stderr||''));
}
console.log('Buyer CRM static QA: PASS — eight screens, scoped staging, buyer-only files, SQL RLS and JS syntax.');
