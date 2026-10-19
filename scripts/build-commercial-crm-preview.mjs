// Produces a STRICT allowlist of customer-only files for future manual review.
// This script does not deploy, migrate or publish anything.
import {mkdirSync,cpSync,copyFileSync,readFileSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const src=join(root,'commercial-crm');
const dist=join(root,'.commercial-crm-preview');
rmSync(dist,{recursive:true,force:true});
mkdirSync(join(dist,'vendor'),{recursive:true});
for(const file of ['index.html','app.js','styles.css','config.staging.js'])copyFileSync(join(src,file),join(dist,file));
copyFileSync(join(root,'vendor','supabase-js-v2.57.0.umd.js'),join(dist,'vendor','supabase-js-v2.57.0.umd.js'));
const index=join(dist,'index.html');
writeFileSync(index,readFileSync(index,'utf8').replace('../vendor/supabase-js-v2.57.0.umd.js','./vendor/supabase-js-v2.57.0.umd.js'));
const entries=readdirSync(dist).sort();
const expected=['app.js','config.staging.js','index.html','styles.css','vendor'];
if(JSON.stringify(entries)!==JSON.stringify(expected))throw Error('Unexpected buyer-build file included');
console.log('Isolated non-deploying buyer CRM build complete: '+dist);
