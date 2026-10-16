/* Customer-only CRM application. Never import owner-only modules, agents or records. */
(()=>{'use strict';
const API='https://bowacxhmjvrqixtwaikv.supabase.co';
const KEY='sb_publishable_0TueitFYiRF3rAEMLMT8-w_FvbvY0rB';
const STAGES=['New','Contacted','Follow-up','Won'];
const VIEWS={pipeline:['YOUR BUSINESS / SALES','Pipeline','Your active leads, organized by stage.'],leads:['YOUR BUSINESS / CONTACTS','Leads','Find, review and update business leads.'],contacts:['YOUR BUSINESS / CONTACTS','Contact profiles','Everything about your customers in one place.'],inbox:['YOUR BUSINESS / MESSAGES','Inbox','Connected conversations appear here.'],sequences:['YOUR BUSINESS / FOLLOW-UPS','Sequences','Review saved follow-up steps.'],bookings:['YOUR BUSINESS / BOOKINGS','Booking Calendar','View booking access and availability.'],forecast:['YOUR BUSINESS / INSIGHTS','Sales Forecast','Only verified opportunity data is used.'],tasks:['YOUR BUSINESS / TASKS','Tasks & Follow-ups','Upcoming actions that need your attention.']};
const $=id=>document.getElementById(id);
const show=(id,on)=>$(id)?.classList.toggle('hidden',!on);
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
const parseDate=s=>s?new Date(s+'T12:00:00'):null;
const dayKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dayOffset=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return dayKey(d)};
const currency=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const safe=(v,max=140)=>String(v??'').trim().slice(0,max);
const iconName=s=>safe(s,2).toUpperCase()||'?';
let db=null,user=null,workspace=null,leads=[],steps=[],selected=null,filter='',search='',view='pipeline',busy=false,toastTimer=0,loadVersion=0;
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const status=msg=>{$('appStatus').textContent=msg};
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3400)}
function empty(msg){return node('div','empty',msg)}
function ensureAuthorized(){if(!user||!workspace||workspace.is_internal!==false)throw Error('Customer workspace access required.')}
function restrictedNewStage(lead){return lead?.email_consent_status==='withdrawn'||lead?.contact_decision==='no'||/unsubscrib|opted out|stop emailing/i.test(String(lead?.notes||''))}
async function boot(){
 if(!db){$('loginStatus').textContent='Sign-in service unavailable. Refresh and try again.';return}
 const {data,error}=await db.auth.getUser();if(error||!data?.user){loggedOut();return}
 user=data.user;
 // Authenticated ownership and commercial-only predicate. RLS also enforces created_by server-side.
 const result=await db.from('tle_crm_workspaces').select('id,name,is_internal,created_by').eq('created_by',user.id).eq('is_internal',false).limit(1);
 if(result.error||!result.data?.length){
  workspace=null;show('auth',true);show('app',false);
  $('loginStatus').textContent='This account has no activated customer CRM workspace. Use the access information issued to your business.';
  return;
 }
 workspace=result.data[0];ensureAuthorized();
 $('brandName').textContent=safe(workspace.name,80)||'Business CRM';
 $('mobileBrand').textContent=safe(workspace.name,35)||'Business CRM';
 $('signedInEmail').textContent=safe(user.email,120);
 $('userAvatar').textContent=iconName(user.email?.split('@')[0]);
 show('auth',false);show('app',true);
 navigate(view);await refresh();
}
function loggedOut(){user=null;workspace=null;leads=[];steps=[];selected=null;show('auth',true);show('app',false);$('loginStatus').textContent=''}
async function refresh(){
 ensureAuthorized();
 const generation=++loadVersion;status('Loading your workspace…');
 const result=await db.from('tle_crm_leads').select('id,workspace_id,business,contact,email,source,stage,followup,notes,created_at,updated_at,email_consent_status,contact_decision,replied_at').eq('workspace_id',workspace.id).is('archived_at',null).order('created_at',{ascending:false}).limit(1000);
 if(generation!==loadVersion)return;
 if(result.error){status('Could not read your leads. Your existing records were not changed. '+result.error.message);return}
 leads=result.data||[];
 // Read only. Failure here must never block the core CRM.
 const seq=await db.from('tle_crm_followup_steps').select('id,workspace_id,lead_id,step_number,due_at,status,delivery_mode').eq('workspace_id',workspace.id).order('due_at',{ascending:false}).limit(250);
 if(generation!==loadVersion)return;
 steps=seq.error?[]:seq.data||[];
 status(seq.error?'Follow-up step history is not available for this account.':'');
 render();
}
async function saveLead(id,changes){
 ensureAuthorized();if(busy)throw Error('Another change is being saved.');busy=true;
 try{
  const result=await db.from('tle_crm_leads').update(changes).eq('id',id).eq('workspace_id',workspace.id).select('id').single();
  if(result.error)throw result.error;
  const idx=leads.findIndex(x=>x.id===id);
  if(idx>=0)leads[idx]={...leads[idx],...changes};
  render();return true;
 }finally{busy=false}
}
function navigate(next){
 if(!VIEWS[next]||!workspace)return;
 view=next;const [eyebrow,title,desc]=VIEWS[next];
 $('viewEyebrow').textContent=eyebrow;$('viewTitle').textContent=title;$('viewDescription').textContent=desc;
 for(const screen of document.querySelectorAll('[data-screen]'))screen.classList.toggle('hidden',screen.dataset.screen!==view);
 document.querySelectorAll('#nav [data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 $('newLead').classList.toggle('hidden',!['pipeline','leads','contacts'].includes(view));closeSidebar();
 render();
}
function closeSidebar(){$('sidebar').classList.remove('open');show('mobileScrim',false);$('menuToggle').setAttribute('aria-expanded','false')}
function metrics(root,items){root.replaceChildren(...items.map(([label,value])=>{const box=node('div','metric');box.append(node('strong','',value),node('span','',label));return box}))}
function render(){if(!workspace)return;renderPipeline();renderLeads();renderContacts();renderSequences();renderBookings();renderForecast();renderTasks()}
function captureRects(){const map=new Map();$('pipelineBoard').querySelectorAll('.deal[data-id]').forEach(el=>{const r=el.getBoundingClientRect();map.set(el.dataset.id,{x:r.left,y:r.top})});return map}
function flip(before){if(reduce()||!before)return;requestAnimationFrame(()=>{$('pipelineBoard').querySelectorAll('.deal[data-id]').forEach(el=>{const old=before.get(el.dataset.id);if(!old)return;const r=el.getBoundingClientRect(),dx=old.x-r.left,dy=old.y-r.top;if(Math.abs(dx)+Math.abs(dy)<1)return;el.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'translate(0px,0px)'}],{duration:594,easing:'cubic-bezier(.2,.88,.2,1)'})})})}
async function moveStage(lead,target){
 if(!STAGES.includes(target)||lead.stage===target)return;
 if(target==='New'&&restrictedNewStage(lead)){status('This contact has an opt-out or no-contact restriction. It cannot be moved to New.');return}
 const before=captureRects();
 try{await saveLead(lead.id,{stage:target});flip(before);toast(safe(lead.business,70)+' moved to '+target)}
 catch(e){status('Stage could not be saved: '+e.message)}
}
function handleGrab(card,lead,handle){
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();e.stopPropagation();
  const startX=e.clientX,startY=e.clientY;
  let ghost=null,hover=null;
  try{handle.setPointerCapture(e.pointerId)}catch{}
  const move=ev=>{
   if(!ghost&&Math.hypot(ev.clientX-startX,ev.clientY-startY)<5)return;
   if(!ghost){
    const r=card.getBoundingClientRect();ghost=card.cloneNode(true);ghost.classList.add('drag-ghost');
    ghost.style.cssText+=';width:'+r.width+'px;top:'+r.top+'px;left:'+r.left+'px';document.body.append(ghost);card.classList.add('drag-origin');
   }
   ghost.style.transform='translate('+(ev.clientX-startX)+'px,'+(ev.clientY-startY)+'px) rotate(1.6deg) scale(1.03)';
   const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.lane');
   if(hover!==target){hover?.classList.remove('drop-target');hover=target;hover?.classList.add('drop-target')}
  };
  const finish=ev=>{
   handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',finish);
   const target=ev.type==='pointerup'&&ghost?hover?.dataset.stage:null;
   ghost?.remove();card.classList.remove('drag-origin');hover?.classList.remove('drop-target');
   try{handle.releasePointerCapture(e.pointerId)}catch{}
   if(target)void moveStage(lead,target);
  };
  handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',finish,{once:true});handle.addEventListener('pointercancel',finish,{once:true});
 });
}
function renderPipeline(){
 const board=$('pipelineBoard');board.replaceChildren();
 const counts=STAGES.map(stage=>leads.filter(l=>l.stage===stage).length);
 metrics($('pipelineMetrics'),[['All leads',leads.length],['New',counts[0]],['Needs follow-up',counts[2]],['Won',counts[3]]]);
 STAGES.forEach((stage,index)=>{
  const lane=node('section','lane');lane.dataset.stage=stage;lane.setAttribute('aria-label',stage+' leads');
  const head=node('div','lane-head');head.append(node('span','stage-dot'),node('strong','',stage),node('span','lane-count',counts[index]));lane.append(head);
  const stack=node('div','lane-stack');const group=leads.filter(l=>l.stage===stage);
  if(!group.length)stack.append(empty('Move a lead here'));
  group.forEach(lead=>{
   const card=node('article','deal');card.tabIndex=0;card.dataset.id=lead.id;card.setAttribute('aria-label','Open '+safe(lead.business)+'; arrow keys move the lead');
   const top=node('div','deal-head');const avatar=node('span','deal-avatar',iconName(lead.business));const source=node('small','',safe(lead.source,50)||'Lead');
   const grab=node('button','grab','⠿');grab.type='button';grab.setAttribute('aria-label','Drag '+safe(lead.business)+' to another stage');grab.title='Drag to another stage';top.append(avatar,source,grab);
   card.append(top,node('strong','',safe(lead.business,120)||'Untitled lead'),node('p','',safe(lead.contact,120)||'No contact name'));
   const foot=node('div','deal-foot');foot.append(node('span','',lead.followup?'◷ '+lead.followup:'No follow-up date'),node('span','', 'Open →'));card.append(foot);
   card.addEventListener('click',ev=>{if(ev.target.closest('button'))return;openContact(lead.id)});
   card.addEventListener('keydown',ev=>{
    if(ev.target!==card)return;
    if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openContact(lead.id)}
    if(['ArrowLeft','ArrowRight'].includes(ev.key)){
     const next=STAGES[STAGES.indexOf(lead.stage)+(ev.key==='ArrowRight'?1:-1)];
     if(next){ev.preventDefault();void moveStage(lead,next)}
    }
   });
   handleGrab(card,lead,grab);stack.append(card);
  });lane.append(stack);board.append(lane);
 });
}
function renderLeads(){
 const chips=$('statusChips');chips.replaceChildren();
 for(const stage of ['',...STAGES]){
  const count=stage?leads.filter(x=>x.stage===stage).length:leads.length;
  const b=node('button','', (stage||'All')+' '+count);b.type='button';b.setAttribute('aria-pressed',String(filter===stage));
  b.onclick=()=>{filter=stage;renderLeads()};chips.append(b);
 }
 const rows=$('leadRows');rows.replaceChildren();
 const match=leads.filter(x=>(!filter||x.stage===filter)&&(safe(x.business)+' '+safe(x.contact)).toLowerCase().includes(search.toLowerCase()));
 show('leadEmpty',!match.length);
 match.forEach(l=>{
  const tr=node('tr');const name=node('td');name.append(node('strong','',safe(l.business)||'Untitled'),node('small','',safe(l.contact)||'No contact'));
  const stage=node('td');stage.append(node('span','badge',l.stage));
  const source=node('td','',safe(l.source)||'—');const next=node('td','',l.followup||'—');
  const action=node('td'),b=node('button','','Open →');b.type='button';b.addEventListener('click',()=>openContact(l.id));action.append(b);
  tr.append(name,stage,source,next,action);rows.append(tr);
 });
}
function renderContacts(){
 const root=$('contactList');root.replaceChildren();
 if(!leads.length){root.append(empty('No contacts have been added yet.'));return}
 leads.forEach(l=>{
  const card=node('button','contact-card');card.type='button';
  const details=node('span');details.append(node('strong','',safe(l.business)||'Untitled'),node('small','',safe(l.contact)||'No contact'),node('small','',l.stage));
  card.append(node('span','avatar',iconName(l.business)),details);card.addEventListener('click',()=>openContact(l.id));root.append(card)
 });
}
function showContactTab(which){
 document.querySelectorAll('[data-contact-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.contactTab===which)));
 show('contactActivity',which==='activity');show('contactNotes',which==='notes')
}
function openContact(id){
 const lead=leads.find(x=>x.id===id);if(!lead)return;selected=id;
 $('detailName').textContent=safe(lead.contact)||safe(lead.business);
 $('detailCompany').textContent=safe(lead.business);
 $('detailAvatar').textContent=iconName(lead.business);
 $('detailSource').textContent=safe(lead.source)||'Source not recorded';
 const defs=$('detailFields');defs.replaceChildren();
 for(const [key,value] of [['Email',lead.email],['Source',lead.source],['Stage',lead.stage],['Follow-up',lead.followup]]){
  const row=node('div');row.append(node('dt','',key),node('dd','',value||'Not recorded'));defs.append(row)
 }
 $('detailForm').elements.stage.value=STAGES.includes(lead.stage)?lead.stage:'New';
 $('detailForm').elements.followup.value=lead.followup||'';
 $('noteHistory').textContent=safe(lead.notes,20000)||'No notes yet.';
 const activity=$('contactActivity');activity.replaceChildren();
 const item=node('div','data-row');item.append(node('strong','',lead.stage+' · '+(lead.updated_at?new Date(lead.updated_at).toLocaleString():'Saved record')));
 activity.append(item);
 showContactTab('activity');if(!$('contactDialog').open)$('contactDialog').showModal();
}
async function saveContact(e){
 e.preventDefault();if(!selected)return;
 const lead=leads.find(x=>x.id===selected);if(!lead)return;
 const form=e.currentTarget,stage=form.elements.stage.value,followup=form.elements.followup.value||null;
 if(!STAGES.includes(stage))return;
 if(stage==='New'&&restrictedNewStage(lead)){status('This contact has an opt-out or no-contact restriction.');return}
 const button=form.querySelector('button[type="submit"]');button.disabled=true;
 try{await saveLead(lead.id,{stage,followup});openContact(lead.id);toast('Contact updated')}
 catch(err){status('Could not save contact: '+err.message)}finally{button.disabled=false}
}
async function addNote(e){
 e.preventDefault();if(!selected)return;
 const lead=leads.find(x=>x.id===selected);if(!lead)return;
 const form=e.currentTarget,note=safe(form.elements.note.value,2000);if(!note)return;
 const stamped='['+new Date().toISOString()+'] '+note;
 const old=String(lead.notes||''),combined=(old?old+'\n\n':'')+stamped;
 const button=form.querySelector('button[type="submit"]');button.disabled=true;
 try{await saveLead(lead.id,{notes:combined});$('noteHistory').textContent=combined;form.reset();toast('Note saved')}
 catch(err){status('Could not save note: '+err.message)}finally{button.disabled=false}
}
async function addLead(e){
 e.preventDefault();ensureAuthorized();if(busy)return;
 const form=e.currentTarget,name=safe(form.elements.business.value,120);
 if(name.length<2){status('Enter a business name.');return}
 const value={workspace_id:workspace.id,business:name,contact:safe(form.elements.contact.value,120)||null,email:safe(form.elements.email.value,200)||null,source:safe(form.elements.source.value,120)||'Manual',stage:'New'};
 const button=form.querySelector('button[type="submit"]');button.disabled=true;busy=true;
 try{
  const result=await db.from('tle_crm_leads').insert(value).select('id').single();
  if(result.error)throw result.error;
  $('leadDialog').close();form.reset();await refresh();navigate('leads');toast('Lead saved')
 }catch(err){status('Could not add lead: '+err.message)}finally{button.disabled=false;busy=false}
}
function renderSequences(){
 const root=$('sequenceRows');root.replaceChildren();
 if(!steps.length){root.append(empty('No accessible follow-up steps were found for this workspace.'));return}
 steps.forEach(step=>{
  const lead=leads.find(l=>l.id===step.lead_id);if(!lead)return;
  const row=node('div','data-row');const text=node('div');
  text.append(node('strong','',safe(lead.business)+' · Step '+Number(step.step_number)),node('small','',step.due_at?new Date(step.due_at).toLocaleString():'No scheduled date'));
  row.append(text,node('span','label-pill',step.status||'Unknown'));root.append(row)
 });
 if(!root.children.length)root.append(empty('No steps linked to your contacts.'))
}
function renderBookings(){
 const root=$('bookingRows');root.replaceChildren();
 // Booking requests require a separate authorized business-account mapping.
 // Do not read other accounts or infer ownership by email/domain.
 root.append(empty('Booking records are not connected to this customer CRM view. Your existing booking service is unchanged.'))
}
function renderForecast(){
 const counts=STAGES.map(stage=>leads.filter(l=>l.stage===stage).length);
 metrics($('forecastCounts'),[['Contacted',counts[1]],['Follow-up in progress',counts[2]],['Won contacts',counts[3]],['Total contacts',leads.length]])
}
async function snooze(id){
 const l=leads.find(x=>x.id===id);if(!l)return;
 const next=dayOffset(1);
 try{await saveLead(id,{followup:next});toast('Follow-up moved to tomorrow')}catch(err){status('Could not reschedule follow-up: '+err.message)}
}
function renderTasks(){
 const root=$('taskGroups');root.replaceChildren();const now=dayOffset(0),tomorrow=dayOffset(1);
 const due=leads.filter(l=>l.followup&&l.stage!=='Won').sort((a,b)=>a.followup.localeCompare(b.followup));
 const groups=[['Overdue',due.filter(l=>l.followup<now)],['Today',due.filter(l=>l.followup===now)],['Tomorrow',due.filter(l=>l.followup===tomorrow)],['Later',due.filter(l=>l.followup>tomorrow)]];
 groups.forEach(([label,items])=>{
  if(!items.length)return;
  const section=node('section','task-group');section.append(node('h3','',label+' · '+items.length));
  items.forEach(l=>{
   const row=node('div','task-row'),details=node('div');details.append(node('strong','',safe(l.business)),node('small','',safe(l.contact)||'Contact'),node('small','',l.followup));
   const actions=node('div','actions'),open=node('button','','Open contact'),delay=node('button','','Tomorrow ↷');open.type=delay.type='button';
   open.onclick=()=>openContact(l.id);delay.onclick=()=>void snooze(l.id);actions.append(open,delay);row.append(details,actions);section.append(row)
  });root.append(section)
 });
 if(!root.children.length)root.append(empty('No follow-ups are currently scheduled.'))
}
function attach(){
 if(!window.supabase?.createClient){$('loginStatus').textContent='The sign-in library could not load. Refresh to retry.';return}
 db=window.supabase.createClient(API,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'tle-crm-auth'}});
 $('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');button.disabled=true;
  $('loginStatus').textContent='Verifying your account…';
  try{const {error}=await db.auth.signInWithPassword({email:form.elements.email.value.trim(),password:form.elements.password.value});if(error)throw error;await boot()}
  catch(err){$('loginStatus').textContent='Sign in failed: '+err.message}finally{button.disabled=false}
 });
 $('logout').addEventListener('click',async()=>{await db.auth.signOut();loggedOut()});
 $('refresh').addEventListener('click',()=>void refresh());
 $('mobileRefresh').addEventListener('click',()=>void refresh());
 $('newLead').addEventListener('click',()=>$('leadDialog').showModal());
 $('addLeadForm').addEventListener('submit',e=>void addLead(e));
 $('detailForm').addEventListener('submit',e=>void saveContact(e));
 $('noteForm').addEventListener('submit',e=>void addNote(e));
 $('leadSearch').addEventListener('input',e=>{search=e.target.value;renderLeads()});
 $('nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)navigate(b.dataset.view)});
 document.querySelectorAll('[data-contact-tab]').forEach(b=>b.addEventListener('click',()=>showContactTab(b.dataset.contactTab)));
 $('menuToggle').addEventListener('click',()=>{const active=$('sidebar').classList.toggle('open');show('mobileScrim',active);$('menuToggle').setAttribute('aria-expanded',String(active))});
 $('mobileScrim').addEventListener('click',closeSidebar);
 db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')loggedOut()});
 void boot().catch(err=>{show('auth',true);show('app',false);$('loginStatus').textContent='Workspace unavailable: '+err.message});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',attach,{once:true}):attach();
})();