import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const delivery=read('docs/client-delivery-standard.md');
const preview=read('buyer-account-preview.html');
const templatePaths=['email-templates/client-design-approval-reminder.html','email-templates/supabase-auth-confirm-email.html','email-templates/supabase-auth-invite.html','email-templates/supabase-auth-reset.html'];
const obsolete=/(?:Saturday\s+(?:after|12)|after\s+Saturday|rolls to Monday|next business day|next working period|permitted production start|Saturday\s+8:00\s*AM|s[áa]bado.{0,90}d[ií]a h[áa]bil)/i;
for(const [path,content] of [['docs/client-delivery-standard.md',delivery],['buyer-account-preview.html',preview],...templatePaths.map(p=>[p,read(p)])]){
 assert(!obsolete.test(content),path+' contains obsolete Saturday production restriction');
}
assert(delivery.includes('estimated')&&delivery.includes('48 hours')&&delivery.includes('confirmed kickoff'),'Delivery must retain the honest 48-hour kickoff estimate');
assert(!preview.includes('Saturday · 9 AM–1 PM'),'Buyer preview may not invent default Saturday restrictions');
assert(preview.includes('Availability · Editable anytime'),'Availability preview must remain owner configurable');
console.log('PASS CRM production standard, buyer preview and '+templatePaths.length+' email templates: no weekend cutoff, no checkout/date changes');
