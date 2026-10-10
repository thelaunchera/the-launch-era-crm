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
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length>=3,"Expected the current CRM script layout");
for(const [i,script] of scripts.entries()){
 const source=script[1].replace(/^import\s.*;\s*$/gm,"");
 try{new Function(source)}catch(e){throw Error("Inline CRM script "+i+" has a JavaScript syntax error: "+e)}
}
assert(!/public[^\n]{0,50}service_role/i.test(html),"Never expose private API credentials in public markup");
console.log("PASS: client-approval and revision controls are present; all inline scripts parse");
