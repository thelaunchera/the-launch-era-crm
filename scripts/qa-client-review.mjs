import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const html=readFileSync("index.html","utf8");
const critical=[
 "id=\"buyerClientReview\"",
 "id=\"buyerReviewApprove\"",
 "id=\"buyerReviewChange\"",
 "id=\"buyerReviewFeedback\"",
 "id=\"buyerReviewSend\"",
 "id=\"buyerClientReviewCount\"",
 "ownerClientReviewRequest(",
 "owner_issue_ai_link",
 "owner_mark_ready",
 "buyer_decision",
 "buyer_status",
 "addOwnerClientReview('booking'",
 "addOwnerClientReview('ai'",
 "item.dataset.clientReviewApproved"
];
for(const marker of critical)assert(html.includes(marker),"Required customer review component missing: "+marker);
const permanentTestCenter=[
 'id="buyerBookingPreviewMobileRefresh"',
 'Refresh prices & preview',
 'buyerBookingPreviewMobileRefresh',
 'preview_refresh=',
 'status===\'approved\'||data.delivered',
 'payload.delivered===true',
 "if(!data||data.status==='approved'||data.delivered)",
 'body.crm-buyer-view #buyerBookingPreviewHub:not(.hidden) #buyerBookingPreviewMobileRefresh:not(.hidden)',
 'data.status===\'changes_requested\''
];
for(const marker of permanentTestCenter){
 assert(html.includes(marker),"Permanent test center or temporary approval separation missing: "+marker);
}
assert(html.includes("void loadBuyerClientReview()"),"Review controls must load only during pre-delivery setup");
assert(html.includes('id="buyerBookingPreviewBusiness"'),"Every buyer needs a dynamic business label in their Test Center");
assert(html.includes("config.business_name||workspace?.name"),"Test Center must render the authenticated buyer's business name");
assert(!html.includes("<strong>CB Depot · Test mode</strong>"),"Never hardcode a previous buyer's brand in the shared Test Center");

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length>=3,"Expected the current CRM script layout");
for(const [i,script] of scripts.entries()){
 const source=script[1].replace(/^import\s.*;\s*$/gm,"");
 try{new Function(source)}catch(e){throw Error("Inline CRM script "+i+" has a JavaScript syntax error: "+e)}
}
assert(!/public[^\n]{0,50}service_role/i.test(html),"Never expose private API credentials in public markup");

import vm from "node:vm";
const fnStart=html.indexOf("function renderBuyerClientReview(){");
const fnEnd=html.indexOf("\nasync function loadBuyerClientReview(){",fnStart);
assert(fnStart>=0&&fnEnd>fnStart,"Could not isolate buyer review renderer");
const renderSource=html.slice(fnStart,fnEnd);
function checkReviewUI(input,expected){
 const elements=new Map();
 function elem(id){
  if(!elements.has(id)){
   const classes=new Set(id==="buyerClientReview"||id==="buyerReviewMobileOpen"||id==="buyerReviewFeedbackForm"?["hidden"]:[]);
   const attrs={};
   elements.set(id,{id,textContent:"",disabled:false,classList:{
    contains(x){return classes.has(x)},
    add(...names){names.forEach(x=>classes.add(x))},
    remove(...names){names.forEach(x=>classes.delete(x))},
    toggle(name,force){
     const nextValue=force===undefined?!classes.has(name):!!force;
     if(nextValue)classes.add(name);else classes.delete(name);
     return nextValue;
    }
   },setAttribute(k,v){attrs[k]=v},getAttribute(k){return attrs[k]}});
  }
  return elements.get(id);
 }
 const context={buyerClientReviewState:input,$:elem,localStorage:{getItem(){return "en"}}};
 const render=vm.runInNewContext("("+renderSource+")",context);
 render();
 const panel=elem("buyerClientReview"),btn=elem("buyerReviewMobileOpen"),actions=elem("buyerClientReviewButtons");
 assert.equal(panel.classList.contains("hidden"),expected.hidden,"Temporary review panel visibility incorrect for "+JSON.stringify(input));
 assert.equal(btn.classList.contains("hidden"),expected.hidden,"Mobile review action visibility incorrect");
 if(!expected.hidden){
   assert.equal(actions.classList.contains("hidden"),expected.actionable===false,"Approval actions incorrect for status: "+input.status);
   assert.equal(elem("buyerReviewChange").disabled,Number(input.revisions_remaining)<=0,"Request changes button quota mismatch");
   assert(elem("buyerClientReviewCount").textContent.includes(input.revisions_remaining+" of "+input.revisions_limit),"Remaining quota is not displayed correctly");
 }
}
checkReviewUI(null,{hidden:true});
checkReviewUI({status:"pending_review",delivered:false,revisions_remaining:1,revisions_limit:1},{hidden:false,actionable:true});
checkReviewUI({status:"changes_requested",delivered:false,feedback:"Fix this logo",revisions_remaining:0,revisions_limit:1},{hidden:false,actionable:false});
checkReviewUI({status:"ready_for_retest",delivered:false,revisions_remaining:0,revisions_limit:1},{hidden:false,actionable:true});
checkReviewUI({status:"approved",delivered:false,revisions_remaining:1,revisions_limit:1},{hidden:true});
checkReviewUI({status:"approved",delivered:true,revisions_remaining:0,revisions_limit:1},{hidden:true});
checkReviewUI({status:"pending_review",delivered:true,revisions_remaining:1,revisions_limit:1},{hidden:true});
console.log("PASS: actual customer-review renderer hides approvals upon signoff/delivery, preserves review before signoff, and obeys revision quotas.");

console.log("PASS: client-approval and revision controls are present; all inline scripts parse");
