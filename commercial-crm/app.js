/* Standalone BUYER CRM — testing only.
   No owner Command Center code, internal agents, outreach or production data. */
(() => {
'use strict';
const cfg = window.CUSTOMER_CRM_CONFIG;
const authScreen = document.getElementById('authScreen');
const authStatus = document.getElementById('authStatus');
const app = document.getElementById('app');
const main = document.getElementById('main');
const dialog = document.getElementById('recordDialog');
const form = document.getElementById('recordForm');
const fields = document.getElementById('recordFields');
const toast = document.getElementById('toast');
const labels = {pipeline:'Pipeline',contacts:'Contacts',leads:'Leads',inbox:'Inbox',sequences:'Sequences',calendar:'Booking calendar',forecast:'Sales forecast',tasks:'Tasks & follow-ups'};
const stages = ['Qualified','Proposal','Negotiation','Won'];
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const resources = ['contacts','deals','activities','tasks','bookings','sequences','sequence_steps'];
const state = {db:null,user:null,workspace:null,view:'pipeline',data:{},contactId:null,sequenceId:null,leadSearch:'',leadStatus:'All',highScore:false,activityTab:'Activity',scenario:0,weekOffset:0};
let formSave=null,drag=null,toastTimer=0,loading=false;
const html = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dollar = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(cents||0)/100);
const today = () => {const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const dates = iso => iso ? new Date(iso+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'No date';
const empty = (title,desc) => '<div class="empty"><strong>'+html(title)+'</strong>'+html(desc||'')+'</div>';
const table = name => 'customer_crm_'+name;
const records = name => state.data[name]||[];
function announce(message,error){clearTimeout(toastTimer);toast.textContent=message;toast.style.background=error?'#923d3d':'#191919';toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),3500)}
function errorMsg(e){return String(e && e.message || e || 'Request failed').replace(/duplicate key.*/i,'a conflicting entry already exists').slice(0,220)}
function stageOptions(selected){return stages.map(s=>'<option value="'+s+'"'+(s===selected?' selected':'')+'>'+s+'</option>').join('')}
function contactOptions(selected){return '<option value="">No linked contact</option>'+records('contacts').map(x=>'<option value="'+x.id+'"'+(x.id===selected?' selected':'')+'>'+html(x.name+(x.company?' · '+x.company:''))+'</option>').join('')}
function person(id){return records('contacts').find(x=>x.id===id)}
function name(id){return person(id)?.name||'Not linked'}
function contactInitial(contact){return String(contact?.name||'?').trim().slice(0,2).toUpperCase()}
function fromNowDate(days){let d=new Date();d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
async function login(){
 const userResult=await state.db.auth.getUser();
 state.user=userResult.data?.user||null;
 if(!state.user){authScreen.hidden=false;app.hidden=true;return}
 const w=await state.db.from(table('workspaces')).select('*').order('created_at',{ascending:true}).limit(1);
 if(w.error)throw w.error;
 state.workspace=w.data?.[0]||null;
 if(!state.workspace){authScreen.hidden=false;app.hidden=true;document.getElementById('loginForm').hidden=true;document.getElementById('noWorkspace').hidden=false;authStatus.textContent='Signed in to the isolated TESTING project.';return}
 authScreen.hidden=true;app.hidden=false;document.getElementById('workspaceName').textContent=state.workspace.name;
 document.getElementById('userInitial').textContent=(state.user.email||'?').slice(0,1).toUpperCase();
 await reload();
}
async function reload(){
 if(!state.workspace||loading)return;loading=true;
 try{
  const output=await Promise.all(resources.map(resource=>state.db.from(table(resource)).select('*').eq('workspace_id',state.workspace.id)));
  output.forEach((result,i)=>{if(result.error)throw result.error;state.data[resources[i]]=result.data||[]});
  state.data.contacts.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  if(!person(state.contactId))state.contactId=records('contacts')[0]?.id||null;
  if(!records('sequences').some(x=>x.id===state.sequenceId))state.sequenceId=records('sequences')[0]?.id||null;
  render();
 }catch(e){announce('Unable to load workspace data: '+errorMsg(e),true);main.innerHTML=empty('Unable to load records','Your data was not deleted. Refresh and try again.')}
 finally{loading=false}
}
async function save(resource,values,id){
 const ref=state.db.from(table(resource));let q;
 if(id)q=ref.update(values).eq('workspace_id',state.workspace.id).eq('id',id);
 else q=ref.insert({...values,workspace_id:state.workspace.id});
 const r=await q.select().single();if(r.error)throw r.error;await reload();return r.data;
}
async function remove(resource,id){
 const r=await state.db.from(table(resource)).delete().eq('id',id).eq('workspace_id',state.workspace.id).select('id').single();
 if(r.error)throw r.error;await reload();
}
function actionButton(action,label,extra){return '<button type="button" class="'+(extra||'secondary')+'" data-action="'+action+'">'+label+'</button>'}
function pagehead(title,summary,right){return '<div class="pagehead"><div><h2>'+title+'</h2><p class="muted">'+summary+'</p></div><div class="row">'+(right||'')+'</div></div>'}
function stat(title,value,subtitle){return '<div class="stat"><small>'+title+'</small><strong>'+value+'</strong><small>'+html(subtitle||'')+'</small></div>'}
function renderPipeline(){
 const open=records('deals').filter(x=>x.stage!=='Won'),won=records('deals').filter(x=>x.stage==='Won');
 const amount=arr=>arr.reduce((sum,x)=>sum+Number(x.amount_cents||0),0);
 const stats='<div class="stats">'+stat('Open pipeline',dollar(amount(open)),'Unclosed deal value')+stat('Open deals',String(open.length),'Active opportunities')+stat('Won deals',dollar(amount(won)),'All time')+'</div>';
 const lanes=stages.map(stage=>{
  const list=records('deals').filter(x=>x.stage===stage);
  return '<section class="stage" data-stage="'+stage+'" aria-label="'+stage+' stage"><div class="stage-head"><strong><span class="dot"></span>'+stage+'</strong><span class="count">'+list.length+'</span></div><div class="stage-total">'+dollar(amount(list))+'</div>'+(list.length?list.map(d=>{
   return '<article class="deal" tabindex="0" data-deal="'+d.id+'" aria-label="'+html(d.title)+' in '+stage+'; use arrow keys to move stages"><button class="drag-handle" type="button" data-drag="'+d.id+'" aria-label="Drag '+html(d.title)+'">⠿</button><strong>'+html(d.title)+'</strong><small>'+html(name(d.contact_id))+'</small><div class="deal-value">'+dollar(d.amount_cents)+'</div><small>'+html(d.close_at?dates(d.close_at):'No close date')+'</small><select class="select-stage" aria-label="Move '+html(d.title)+'" data-deal-stage="'+d.id+'">'+stageOptions(d.stage)+'</select></article>';
  }).join(''):empty('No deals','Drag a deal into this column'))+'</section>';
 }).join('');
 return pagehead('Your pipeline','Move a deal between stages. Changes save to your business workspace.',actionButton('new-deal','+ New deal','primary'))+stats+'<div class="board" id="pipelineBoard">'+lanes+'</div>';
}
function renderContacts(){
 const list=records('contacts');
 if(!list.length)return pagehead('Contact profiles','Keep your customer relationships organized.',actionButton('new-contact','+ Add contact','primary'))+empty('No contacts yet','Add your first contact to start a relationship history.');
 const x=person(state.contactId)||list[0];
 const activities=records('activities').filter(a=>a.contact_id===x.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const filtered=state.activityTab==='Notes'?activities.filter(a=>a.kind==='note'):state.activityTab==='Emails'?[]:activities;
 const deals=records('deals').filter(d=>d.contact_id===x.id);
 const tasks=records('tasks').filter(t=>t.contact_id===x.id);
 const selector='<select id="contactPicker" aria-label="Select contact">'+list.map(z=>'<option value="'+z.id+'"'+(z.id===x.id?' selected':'')+'>'+html(z.name+' · '+(z.company||'Individual'))+'</option>').join('')+'</select>';
 const profile='<div class="panel profile-card"><div class="avatar profile-avatar">'+html(contactInitial(x))+'</div><h2>'+html(x.name)+'</h2><p class="muted">'+html(x.company||'Individual contact')+'</p><span class="pill">'+html(x.status)+'</span><div class="row" style="margin-top:14px"><button class="secondary" data-action="new-task-for" data-contact="'+x.id+'">+ Task</button><button class="secondary" data-action="new-note" data-contact="'+x.id+'">+ Note</button></div><dl><dt>Email</dt><dd>'+html(x.email||'Not added')+'</dd><dt>Phone</dt><dd>'+html(x.phone||'Not added')+'</dd><dt>Source</dt><dd>'+html(x.source||'Not specified')+'</dd></dl></div>';
 const tabs='<div class="tabs" role="tablist" aria-label="Contact activity">'+['Activity','Notes','Emails'].map(t=>'<button type="button" role="tab" aria-selected="'+(t===state.activityTab)+'" data-action="activity-tab" data-tab="'+t+'">'+t+'</button>').join('')+'</div>';
 const timeline=state.activityTab==='Emails'?empty('Email not connected','Only actual synced email threads will appear once a verified provider is connected.'):filtered.length?'<div class="timeline">'+filtered.map(a=>'<div class="timeline-event"><strong>'+html(a.kind[0].toUpperCase()+a.kind.slice(1))+'</strong><small>'+new Date(a.created_at).toLocaleString()+'</small><p>'+html(a.body)+'</p></div>').join('')+'</div>':empty('No recorded activity','Notes and logged activities appear here after they are saved.');
 const middle='<div class="panel"><form id="noteComposer"><label>Add a note<textarea name="body" placeholder="What happened with this contact?" required maxlength="10000"></textarea></label><button class="primary" type="submit">Save note</button></form></div><div class="panel" style="margin-top:13px">'+tabs+timeline+'</div>';
 const side='<div><div class="panel"><h3>Deals <span class="count">'+deals.length+'</span></h3>'+(deals.map(d=>'<div class="taskline"><div class="grow"><strong>'+html(d.title)+'</strong><div class="meta">'+html(d.stage)+'</div></div><strong>'+dollar(d.amount_cents)+'</strong></div>').join('')||empty('No linked deals','Create a deal from Pipeline.'))+'</div><div class="panel" style="margin-top:13px"><h3>Tasks <span class="count">'+tasks.length+'</span></h3>'+(tasks.map(t=>'<div class="taskline '+(t.completed_at?'done':'')+'"><div class="grow"><strong>'+html(t.title)+'</strong><div class="meta">'+html(t.due_on)+'</div></div></div>').join('')||empty('No linked tasks','Add a follow-up when needed.'))+'</div></div>';
 return pagehead('Contact profile','Complete relationship history, from actual saved records.',actionButton('new-contact','+ Add contact','primary'))+'<div class="filters">'+selector+'</div><div class="profile-grid">'+profile+'<div>'+middle+'</div>'+side+'</div>';
}
function renderLeads(){
 const list=records('contacts');
 const count=(v)=>list.filter(x=>x.status===v).length;
 const filtered=list.filter(x=>(state.leadStatus==='All'||x.status===state.leadStatus)&&(!state.highScore||(x.score!=null&&x.score>=70))&&(x.name+' '+x.company).toLowerCase().includes(state.leadSearch.toLowerCase()));
 const filters='<div class="filters"><input id="leadSearch" class="search" type="search" aria-label="Search leads" placeholder="Search by name or company" value="'+html(state.leadSearch)+'">'+['All','New','Contacted','Qualified','Won'].map(s=>'<button class="chip" type="button" aria-pressed="'+(s===state.leadStatus)+'" data-action="lead-filter" data-status="'+s+'">'+s+' '+(s==='All'?list.length:count(s))+'</button>').join('')+'<button class="chip" type="button" aria-pressed="'+state.highScore+'" data-action="score-filter">Score 70+</button></div>';
 const rows=filtered.map(c=>'<tr><td><button type="button" data-action="open-contact" data-contact="'+c.id+'">'+html(c.name)+'</button><div class="micro">'+html(c.company||'Individual')+'</div></td><td><span class="pill '+(c.status==='Qualified'||c.status==='Won'?'green':c.status==='Contacted'?'amber':'')+'">'+html(c.status)+'</span></td><td>'+html(c.source||'—')+'</td><td>'+(c.score==null?'Not scored':c.score)+'</td><td><select aria-label="Update '+html(c.name)+' status" data-lead-stage="'+c.id+'">'+['New','Contacted','Qualified','Won'].map(s=>'<option value="'+s+'"'+(s===c.status?' selected':'')+'>'+s+'</option>').join('')+'</select></td></tr>').join('');
 return pagehead('Leads','Showing '+filtered.length+' of '+list.length+' saved contacts.',actionButton('new-contact','+ Add lead','primary'))+filters+'<div class="table-wrap">'+(filtered.length?'<table class="records"><thead><tr><th>Name & company</th><th>Status</th><th>Source</th><th>Score</th><th>Update stage</th></tr></thead><tbody>'+rows+'</tbody></table>':empty('No matching leads','Try changing your filters or add a lead.'))+'</div>';
}
function renderInbox(){
 return pagehead('Conversations','Verified provider connections only. No simulated incoming messages.')+
 '<div class="split"><div class="panel"><h3>Channels</h3><div class="tabs" role="tablist" aria-label="Inbox channels"><button role="tab" aria-selected="true" type="button">All</button><button type="button" disabled>SMS</button><button type="button" disabled>Email</button><button type="button" disabled>Chat</button></div>'+empty('No channels connected','Connect a verified messaging provider before sending, syncing or displaying real conversations.')+'</div><div class="panel"><h3>Conversation</h3>'+empty('Choose a connected conversation','Messaging is disabled until a business-owned provider is authorized and configured.')+'</div></div>';
}
function renderSequences(){
 const all=records('sequences').sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const current=all.find(x=>x.id===state.sequenceId)||all[0];
 const steps=records('sequence_steps').filter(s=>s.sequence_id===current?.id).sort((a,b)=>a.step_order-b.step_order);
 const listing='<div class="panel"><h3>Draft sequences</h3>'+(all.length?all.map(s=>'<div class="seq-item"><button class="secondary" data-action="choose-sequence" data-id="'+s.id+'">'+html(s.name)+'</button><span class="pill">Draft</span></div>').join(''):empty('No sequences yet','Create a draft sequence to plan your email workflow.'))+'</div>';
 const nodes=current?'<div class="panel"><div class="pagehead"><div><h3>'+html(current.name)+'</h3><small>Draft only · Sending not activated</small></div>'+actionButton('add-sequence-step','+ Add step','primary')+'</div><div class="canvas"><div class="seq-node"><strong>Trigger</strong><p class="muted">Manual enrollment (sending not enabled)</p></div>'+steps.map(s=>'<div class="seq-connector"></div><div class="seq-node"><div class="row" style="justify-content:space-between"><strong>'+(s.step_type==='email'?'✉ Email':'◷ Wait '+s.wait_days+' days')+'</strong><button class="secondary" data-action="delete-step" data-id="'+s.id+'">Remove</button></div>'+(s.step_type==='email'?'<p><strong>'+html(s.subject||'Untitled email')+'</strong></p><small>'+html(s.body||'No body')+'</small>':'')+'</div>').join('')+'<div class="seq-connector"></div><div class="seq-node"><strong>End</strong><p class="muted">No emails are sent in testing.</p></div></div></div>':'<div class="panel">'+empty('Select or create a sequence','Drafts are saved, but none are activated for sending.')+'</div>';
 return pagehead('Email sequences','Build and save drafts. Outbound sending needs verified integrations and stop rules.',actionButton('new-sequence','+ New sequence','primary'))+'<div class="two-pane">'+listing+nodes+'</div>';
}
function weekStart(){
 const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+(state.weekOffset*7));return d;
}
function renderCalendar(){
 const start=weekStart(),end=new Date(start);end.setDate(start.getDate()+4);
 const days=Array.from({length:5},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});
 const bookingFor=date=>records('bookings').filter(b=>new Date(b.starts_at).toDateString()===date.toDateString());
 const grid=days.map(day=>'<div class="daycol"><h3>'+day.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+'</h3>'+(bookingFor(day).map(b=>'<button type="button" class="event '+html(b.status)+'" data-action="booking-status" data-id="'+b.id+'" title="View booking status">'+new Date(b.starts_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})+'<br><strong>'+html(b.title)+'</strong><br>'+html(b.status)+'</button>').join('')||'<small>No bookings</small>')+'</div>').join('');
 return pagehead('Booking calendar','Actual booking requests and confirmed appointments only. '+html(state.workspace.timezone),actionButton('new-booking','+ New booking','primary'))+
 '<div class="two-pane"><div class="panel"><h3>Your booking page</h3><p class="muted">Public booking link is not configured for this test workspace.</p><h3>Appointments</h3><div class="taskline"><span class="grow">Requested</span><strong>'+records('bookings').filter(b=>b.status==='requested').length+'</strong></div><div class="taskline"><span class="grow">Confirmed</span><strong>'+records('bookings').filter(b=>b.status==='confirmed').length+'</strong></div><p class="micro">Confirmed time overlaps are rejected in the database.</p></div><div class="panel calendar-week"><div class="pagehead"><h3>'+start.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+'</h3><div class="row">'+actionButton('week-prev','←','secondary')+actionButton('week-today','Today','secondary')+actionButton('week-next','→','secondary')+'</div></div><div class="weekgrid">'+grid+'</div></div></div>';
}
function quarter(){
 const now=new Date(),q=Math.floor(now.getMonth()/3);
 return {year:now.getFullYear(),q:q+1,start:new Date(now.getFullYear(),q*3,1),end:new Date(now.getFullYear(),q*3+3,1)};
}
function forecastValues(){
 const q=quarter(),open=records('deals').filter(d=>d.stage!=='Won');
 const won=records('deals').filter(d=>d.stage==='Won' && d.closed_at && new Date(d.closed_at)>=q.start && new Date(d.closed_at)<q.end);
 const probabilities={Qualified:.2,Proposal:.4,Negotiation:.7,Won:1};
 const weighted=open.reduce((v,d)=>v+d.amount_cents*Math.max(.05,Math.min(.98,probabilities[d.stage]+state.scenario/100)),0);
 const closed=won.reduce((v,d)=>v+Number(d.amount_cents),0);
 return {q,open,won,weighted,closed,total:weighted+closed,quota:state.workspace.quarterly_quota_cents,probabilities};
}
function forecastNumbers(){
 const v=forecastValues();
 let rating='No quota set';
 if(v.quota>0){const pct=v.total/v.quota*100;rating=pct>=85?'On track':pct>=65?'Needs push':'At risk'}
 return '<div class="stats">'+stat('Weighted open pipeline',dollar(v.weighted),'Probability-adjusted')+stat('Closed won · this quarter',dollar(v.closed),'Actually closed this quarter')+stat('Expected total',dollar(v.total),rating)+'</div>';
}
function forecastDetails(){
 const v=forecastValues();
 const monthly=Array.from({length:3},(_,i)=>{
  const month=v.q.start.getMonth()+i;
  const closed=v.won.filter(d=>d.closed_at&&new Date(d.closed_at).getMonth()===month).reduce((s,d)=>s+d.amount_cents,0);
  const open=v.open.filter(d=>d.close_at&&new Date(d.close_at+'T12:00:00').getMonth()===month).reduce((s,d)=>s+d.amount_cents*Math.max(.05,Math.min(.98,v.probabilities[d.stage]+state.scenario/100)),0);
  return {month,closed,open};
 });
 const max=Math.max(1,...monthly.map(x=>x.closed+x.open));
 const bars=monthly.map(m=>'<div class="forecast-month"><div class="forecast-stack"><div class="forecast-segment" style="height:'+Math.max(0,m.open/max*175)+'px"></div><div class="forecast-segment won" style="height:'+Math.max(0,m.closed/max*175)+'px"></div></div><small>'+months[m.month]+'</small><strong>'+dollar(m.closed+m.open)+'</strong></div>').join('');
 const rows=['Qualified','Proposal','Negotiation'].map(s=>{
  const sum=v.open.filter(d=>d.stage===s).reduce((n,d)=>n+Number(d.amount_cents),0);
  const pct=Math.round(Math.max(.05,Math.min(.98,v.probabilities[s]+state.scenario/100))*100);
  return '<div class="taskline"><div class="grow"><strong>'+s+'</strong><div class="meta">'+pct+'% win probability</div></div><span>'+dollar(sum*pct/100)+'</span></div>';
 }).join('');
 return '<div class="split"><div class="panel"><h3>Quarterly forecast</h3><p class="micro">Bars show only dated deals within the quarter. Undated deals remain in the KPI above.</p><div class="forecast-bars">'+bars+'</div></div><div class="panel"><h3>What if?</h3><p class="muted">Adjust stage probabilities without changing stored deals.</p><strong style="font-size:28px">'+(state.scenario>0?'+':'')+state.scenario+' pts</strong><div>'+rows+'</div></div></div>';
}
function renderForecast(){
 const v=forecastValues();
 return pagehead('Sales forecast','Q'+v.q.q+' '+v.q.year+' · actual deal values, hypothetical scenario adjustments.',actionButton('set-quota','Set quota','secondary'))+
 '<div class="filters"><button class="chip" data-action="scenario-preset" data-points="-10">Conservative</button><button class="chip" data-action="scenario-preset" data-points="0">Expected</button><button class="chip" data-action="scenario-preset" data-points="10">Best case</button><label style="flex:1;max-width:280px;margin:0">Win-rate adjustment <input type="range" min="-20" max="20" step="1" id="scenarioRange" value="'+state.scenario+'" aria-label="Adjust win probabilities"></label></div><div id="forecastNumbers">'+forecastNumbers()+'</div><div id="forecastDetails">'+forecastDetails()+'</div>';
}
function renderTasks(){
 const all=records('tasks'),open=all.filter(t=>!t.completed_at),done=all.filter(t=>t.completed_at);
 const groups=[['Overdue',open.filter(t=>t.due_on<today())],['Today',open.filter(t=>t.due_on===today())],['Tomorrow',open.filter(t=>t.due_on===fromNowDate(1))],['Upcoming',open.filter(t=>t.due_on>fromNowDate(1))]];
 const rows=groups.map(([label,tasks])=>'<section class="task-group"><h3>'+label+' <span class="count">'+tasks.length+'</span></h3><div class="panel">'+(tasks.map(t=>'<div class="taskline"><button type="button" class="secondary" data-action="complete-task" data-id="'+t.id+'" aria-label="Complete '+html(t.title)+'">○</button><div class="grow"><strong>'+html(t.title)+'</strong><div class="meta">'+html(name(t.contact_id))+' · '+dates(t.due_on)+'</div></div><button type="button" class="secondary" data-action="snooze-task" data-id="'+t.id+'" aria-label="Postpone '+html(t.title)+' one day">◷</button></div>').join('')||empty('Nothing due here','You are up to date.'))+'</div></section>').join('');
 const form='<form id="quickTask" class="panel row"><input class="field" style="flex:1" name="title" placeholder="Add a follow-up task…" aria-label="New task title" maxlength="220" required><button class="primary" type="submit">+ Add task</button></form>';
 return pagehead('Tasks & follow-ups','All task changes are saved; completed tasks remain in history.',actionButton('new-task','+ Schedule task','primary'))+'<div class="stats">'+stat('Outstanding',String(open.length),'All upcoming and overdue')+stat('Completed',String(done.length),'Recorded history')+stat('Due today',String(groups[1][1].length),'Needs attention')+'</div>'+form+rows+'<section class="task-group"><h3>Completed <span class="count">'+done.length+'</span></h3><div class="panel">'+(done.slice(0,25).map(t=>'<div class="taskline done"><strong>'+html(t.title)+'</strong><small>'+new Date(t.completed_at).toLocaleDateString()+'</small></div>').join('')||empty('No tasks completed','Completed tasks will appear here.'))+'</div></section>';
}
function render(){
 const view=state.view;
 document.querySelectorAll('#nav [data-view]').forEach(el=>{if(el.dataset.view===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
 document.getElementById('breadcrumb').textContent='WORKSPACE / '+view.toUpperCase();
 document.getElementById('pageTitle').textContent=labels[view];
 const screen={pipeline:renderPipeline,contacts:renderContacts,leads:renderLeads,inbox:renderInbox,sequences:renderSequences,calendar:renderCalendar,forecast:renderForecast,tasks:renderTasks}[view];
 main.innerHTML=screen?screen():empty('Unknown screen','Choose a menu item.');
}
function modal(title,definition,save){
 formSave=save;document.getElementById('recordTitle').textContent=title;
 document.getElementById('recordError').textContent='';
 fields.replaceChildren();
 definition.forEach(d=>{
  const label=document.createElement('label');label.textContent=d.label;
  const node=d.options?document.createElement('select'):d.multiline?document.createElement('textarea'):document.createElement('input');
  node.name=d.key;node.required=!!d.required;
  if(node.tagName==='INPUT')node.type=d.type||'text';
  if(d.min!=null)node.min=d.min;
  if(d.max!=null)node.max=d.max;
  if(d.value!=null)node.value=d.value;
  if(d.options)d.options.forEach(o=>{let opt=document.createElement('option');opt.value=o.value;opt.textContent=o.label;node.appendChild(opt)});
  label.append(node);fields.appendChild(label);
 });
 dialog.showModal();
 fields.querySelector('input,textarea,select')?.focus();
}
const field=(key,label,required=true,extra={})=>({key,label,required,...extra});
const contactChoices=()=>[{value:'',label:'No linked contact'},...records('contacts').map(c=>({value:c.id,label:c.name+(c.company?' · '+c.company:'')}))];
function openCreateContact(){
 modal('New contact',[field('name','Contact name'),field('company','Company',false),field('email','Email',false,{type:'email'}),field('phone','Phone',false),field('source','Source',false)],async v=>{
  const result=await save('contacts',{name:v.name.trim(),company:v.company.trim(),email:v.email||null,phone:v.phone||null,source:v.source||null,status:'New'});state.contactId=result.id;return 'Contact saved';
 });
}
function openDeal(){
 modal('New deal',[field('title','Deal name'),field('amount','Deal value (USD)',true,{type:'number',min:0}),field('contact_id','Related contact',false,{options:contactChoices()}),field('close_at','Expected close date',false,{type:'date'})],async v=>{
  const cents=Math.round(Number(v.amount)*100);if(!Number.isSafeInteger(cents)||cents<0)throw Error('Enter a valid amount');
  await save('deals',{title:v.title.trim(),amount_cents:cents,contact_id:v.contact_id||null,close_at:v.close_at||null,stage:'Qualified'});return 'Deal created';
 });
}
function openTask(contactId){
 modal('Schedule task',[field('title','Task title'),field('due_on','Due date',true,{type:'date',value:today()}),field('contact_id','Related contact',false,{options:contactChoices()})],async v=>{
  await save('tasks',{title:v.title.trim(),due_on:v.due_on,contact_id:v.contact_id||contactId||null});return 'Task saved';
 });
}
function openBooking(){
 modal('New booking request',[field('title','Booking title'),field('service_type','Service type'),field('starts_at','Starts',true,{type:'datetime-local'}),field('ends_at','Ends',true,{type:'datetime-local'}),field('contact_id','Related contact',false,{options:contactChoices()})],async v=>{
  const a=new Date(v.starts_at),b=new Date(v.ends_at);
  if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||b<=a)throw Error('End time must be after start time');
  await save('bookings',{title:v.title.trim(),service_type:v.service_type.trim(),starts_at:a.toISOString(),ends_at:b.toISOString(),status:'requested',contact_id:v.contact_id||null});return 'Booking request saved';
 });
}
function openNote(contactId){
 modal('Add a note',[field('body','Note',true,{multiline:true})],async v=>{
  await save('activities',{contact_id:contactId||state.contactId,body:v.body.trim(),kind:'note'});return 'Note added';
 });
}
function openSequence(){
 modal('New email sequence',[field('name','Sequence name')],async v=>{
  const row=await save('sequences',{name:v.name.trim(),status:'draft'});state.sequenceId=row.id;return 'Draft sequence saved';
 });
}
function openSequenceStep(){
 if(!state.sequenceId)return;
 modal('Add an email sequence step',[field('step_type','Step type',true,{options:[{value:'email',label:'Email draft'},{value:'wait',label:'Wait'}]}),field('subject','Email subject',false),field('body','Email body',false,{multiline:true}),field('wait_days','Wait days',false,{type:'number',min:1,max:14,value:2})],async v=>{
  const order=Math.max(-1,...records('sequence_steps').filter(s=>s.sequence_id===state.sequenceId).map(x=>x.step_order))+1;
  if(v.step_type==='email'&&!v.subject.trim())throw Error('An email draft needs a subject');
  await save('sequence_steps',{sequence_id:state.sequenceId,step_order:order,step_type:v.step_type,subject:v.step_type==='email'?v.subject.trim():null,body:v.step_type==='email'?v.body.trim():null,wait_days:v.step_type==='wait'?Number(v.wait_days):null});return 'Draft step added';
 });
}
function openQuota(){
 modal('Set quarterly quota',[field('quota','Quarterly revenue target (USD)',true,{type:'number',min:0,value:state.workspace.quarterly_quota_cents==null?'':state.workspace.quarterly_quota_cents/100})],async v=>{
  const cents=Math.round(Number(v.quota)*100);if(!Number.isSafeInteger(cents)||cents<0)throw Error('Invalid quota');
  const r=await state.db.from(table('workspaces')).update({quarterly_quota_cents:cents}).eq('id',state.workspace.id).select().single();if(r.error)throw r.error;
  state.workspace=r.data;render();return 'Quota saved';
 });
}
async function dealStage(id,to){
 const d=records('deals').find(x=>x.id===id);if(!d||!stages.includes(to)||d.stage===to)return;
 await save('deals',{stage:to,closed_at:to==='Won'?new Date().toISOString():null},id);
 announce(html(d.title)+' moved to '+to);
}
async function bookingStatus(id){
 const row=records('bookings').find(b=>b.id===id);if(!row)return;
 modal('Booking status',[field('status','Status',true,{options:['requested','confirmed','cancelled'].map(s=>({value:s,label:s}))})],async v=>{
  if(v.status!=='requested'&&v.status!=='confirmed'&&v.status!=='cancelled')throw Error('Invalid booking status');
  await save('bookings',{status:v.status},id);return 'Booking updated';
 });
 fields.querySelector('select[name=status]').value=row.status;
}
async function handleAction(el){
 const action=el.dataset.action;
 if(action==='new-contact')return openCreateContact();
 if(action==='new-deal')return openDeal();
 if(action==='new-task'||action==='new-task-for')return openTask(el.dataset.contact);
 if(action==='new-booking')return openBooking();
 if(action==='new-note')return openNote(el.dataset.contact);
 if(action==='new-sequence')return openSequence();
 if(action==='add-sequence-step')return openSequenceStep();
 if(action==='set-quota')return openQuota();
 if(action==='open-contact'){state.contactId=el.dataset.contact;state.view='contacts';return render()}
 if(action==='lead-filter'){state.leadStatus=el.dataset.status;return render()}
 if(action==='score-filter'){state.highScore=!state.highScore;return render()}
 if(action==='activity-tab'){state.activityTab=el.dataset.tab;return render()}
 if(action==='choose-sequence'){state.sequenceId=el.dataset.id;return render()}
 if(action==='scenario-preset'){state.scenario=Number(el.dataset.points);return render()}
 if(action==='week-prev'){state.weekOffset--;return render()}
 if(action==='week-next'){state.weekOffset++;return render()}
 if(action==='week-today'){state.weekOffset=0;return render()}
 if(action==='booking-status')return bookingStatus(el.dataset.id);
 if(action==='complete-task')return save('tasks',{completed_at:new Date().toISOString()},el.dataset.id).then(()=>announce('Task completed'));
 if(action==='snooze-task'){
  const t=records('tasks').find(x=>x.id===el.dataset.id);if(!t)return;
  const d=new Date(t.due_on+'T12:00:00');d.setDate(d.getDate()+1);
  const next=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  return save('tasks',{due_on:next},el.dataset.id).then(()=>announce('Task postponed one day'));
 }
 if(action==='delete-step'){await remove('sequence_steps',el.dataset.id);return announce('Draft step removed')}
}
function refreshForecast(){document.getElementById('forecastNumbers').innerHTML=forecastNumbers();document.getElementById('forecastDetails').innerHTML=forecastDetails()}
function startDrag(e){
 const handle=e.target.closest('[data-drag]');if(!handle||drag)return;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 e.preventDefault();e.stopPropagation();
 const card=handle.closest('[data-deal]');const rect=card.getBoundingClientRect();
 drag={handle,card,id:handle.dataset.drag,startX:e.clientX,startY:e.clientY,rect,target:null,ghost:null};
 handle.setPointerCapture(e.pointerId);
}
function trackDrag(e){
 if(!drag)return;
 const distance=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY);
 if(!drag.ghost&&distance>6){
  const ghost=document.createElement('div');ghost.className='drag-ghost';ghost.textContent=drag.card.querySelector('strong')?.textContent||'Deal';ghost.style.width=Math.min(drag.rect.width,270)+'px';document.body.append(ghost);drag.ghost=ghost;drag.card.style.opacity='.5';
 }
 if(!drag.ghost)return;
 drag.ghost.style.left=e.clientX-Math.min(drag.rect.width,270)/2+'px';drag.ghost.style.top=e.clientY-25+'px';
 document.querySelectorAll('.stage.drop-target').forEach(x=>x.classList.remove('drop-target'));
 const lane=document.elementFromPoint(e.clientX,e.clientY)?.closest('.stage[data-stage]');
 drag.target=lane?.dataset.stage||null;
 if(lane)lane.classList.add('drop-target');
}
function stopDrag(e,commit){
 if(!drag)return;
 e.preventDefault();e.stopPropagation();trackDrag(e);
 const {id,target,card,ghost}=drag;drag=null;ghost?.remove();card.style.opacity='';
 document.querySelectorAll('.stage.drop-target').forEach(x=>x.classList.remove('drop-target'));
 if(commit&&target)dealStage(id,target).catch(err=>announce(errorMsg(err),true));
}
document.getElementById('nav').addEventListener('click',e=>{
 const btn=e.target.closest('[data-view]');if(!btn)return;state.view=btn.dataset.view;
 state.leadSearch='';document.getElementById('sidebar').classList.remove('open');document.getElementById('menuToggle').setAttribute('aria-expanded','false');render();main.focus();
});
document.getElementById('menuToggle').addEventListener('click',()=>{
 const sidebar=document.getElementById('sidebar'),isOpen=sidebar.classList.toggle('open');document.getElementById('menuToggle').setAttribute('aria-expanded',String(isOpen));
});
main.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(el)Promise.resolve(handleAction(el)).catch(err=>announce(errorMsg(err),true))});
main.addEventListener('change',e=>{
 const el=e.target;
 if(el.matches('[data-deal-stage]'))dealStage(el.dataset.dealStage,el.value).catch(err=>announce(errorMsg(err),true));
 if(el.matches('[data-lead-stage]'))save('contacts',{status:el.value},el.dataset.leadStage).then(()=>announce('Lead status saved')).catch(err=>announce(errorMsg(err),true));
 if(el.id==='contactPicker'){state.contactId=el.value;render()}
});
main.addEventListener('input',e=>{
 if(e.target.id==='leadSearch'){const el=e.target,pos=el.selectionStart;state.leadSearch=el.value;render();const field=document.getElementById('leadSearch');field.focus();try{field.setSelectionRange(pos,pos)}catch{}}
 if(e.target.id==='scenarioRange'){state.scenario=Number(e.target.value);refreshForecast()}
});
main.addEventListener('submit',e=>{
 if(e.target.id==='noteComposer'){e.preventDefault();const body=new FormData(e.target).get('body');if(!String(body).trim())return;save('activities',{contact_id:state.contactId,kind:'note',body:String(body).trim()}).then(()=>announce('Note saved')).catch(err=>announce(errorMsg(err),true))}
 if(e.target.id==='quickTask'){e.preventDefault();const title=String(new FormData(e.target).get('title')||'').trim();if(!title)return;save('tasks',{title,due_on:today(),contact_id:null}).then(()=>announce('Task added')).catch(err=>announce(errorMsg(err),true))}
});
main.addEventListener('keydown',e=>{
 const card=e.target.closest('[data-deal]');
 if(card&&e.target===card&&['ArrowLeft','ArrowRight'].includes(e.key)){
  const d=records('deals').find(x=>x.id===card.dataset.deal),ix=stages.indexOf(d?.stage),stage=stages[ix+(e.key==='ArrowRight'?1:-1)];
  if(stage){e.preventDefault();dealStage(d.id,stage).catch(err=>announce(errorMsg(err),true))}
 }
});
main.addEventListener('pointerdown',startDrag);
main.addEventListener('pointermove',e=>{if(drag&&e.pointerId!=null)trackDrag(e)});
main.addEventListener('pointerup',e=>{if(drag)stopDrag(e,true)});
main.addEventListener('pointercancel',e=>{if(drag)stopDrag(e,false)});
document.getElementById('closeDialog').onclick=()=>dialog.close();
document.getElementById('cancelDialog').onclick=()=>dialog.close();
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!formSave)return;
 const btn=document.getElementById('saveRecord'),err=document.getElementById('recordError');btn.disabled=true;err.textContent='';
 try{
  const vals=Object.fromEntries(new FormData(form).entries());
  const result=await formSave(vals);dialog.close();announce(result||'Saved');render();
 }catch(ex){err.textContent=errorMsg(ex)}
 finally{btn.disabled=false}
});
document.getElementById('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const values=new FormData(e.target);authStatus.textContent='Checking your access…';
 try{const r=await state.db.auth.signInWithPassword({email:String(values.get('email')),password:String(values.get('password'))});if(r.error)throw r.error;authStatus.textContent='';await login()}
 catch(err){authStatus.textContent=errorMsg(err)}
});
document.getElementById('createTestWorkspace').onclick=async()=>{
 const email=state.user?.email||'Testing business';
 const name=email.split('@')[0].replace(/[._-]/g,' ').slice(0,90)+' Test Workspace';
 try{
  const r=await state.db.from(table('workspaces')).insert({owner_user_id:state.user.id,name}).select().single();
  if(r.error)throw r.error;await login();
 }catch(err){authStatus.textContent=errorMsg(err)}
};
document.getElementById('signOut').onclick=async()=>{await state.db.auth.signOut();state.workspace=null;state.user=null;authScreen.hidden=false;app.hidden=true;document.getElementById('loginForm').hidden=false;document.getElementById('noWorkspace').hidden=true;document.getElementById('loginForm').reset()};
async function init(){
 if(!cfg||cfg.environment!=='testing'||!cfg.url?.includes('afyiltvdfqnuyzcqsnoh')||!window.supabase?.createClient){
  authStatus.textContent='Testing configuration or Supabase library is unavailable. No data was loaded.';return;
 }
 state.db=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'buyer-crm-testing-auth'}});
 try{await login()}catch(e){authStatus.textContent='Could not verify workspace: '+errorMsg(e)}
}
init();
})();
