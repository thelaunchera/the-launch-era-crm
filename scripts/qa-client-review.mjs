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

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length>=3,"Expected the current CRM script layout");
for(const [i,script] of scripts.entries()){
 const source=script[1].replace(/^import\s.*;\s*$/gm,"");
 try{new Function(source)}catch(e){throw Error("Inline CRM script "+i+" has a JavaScript syntax error: "+e)}
}
assert(!/public[^\n]{0,50}service_role/i.test(html),"Never expose private API credentials in public markup");
console.log("PASS: client-approval and revision controls are present; all inline scripts parse");
