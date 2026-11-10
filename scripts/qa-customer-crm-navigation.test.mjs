import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const js=readFileSync(new URL('../customer-crm/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../customer-crm/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../customer-crm/styles.css',import.meta.url),'utf8');
const start=js.indexOf('const NAV_TTL_MS=');
const end=js.indexOf('const reduce=',start);
assert.ok(start>0&&end>start,'Navigation helper missing');
const helper=js.slice(start,end);

function runtime(){
 const map=new Map(),events={};
 let now=1_800_000_000_000;
 const context={
   Date:{now:()=>now},VIEWS:{pipeline:[],leads:[],contacts:[]},
   user:{id:'customer-a'},workspace:{id:'workspace-a'},view:'leads',
   localStorage:{getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)},
   document:{querySelector:()=>({scrollTop:53}),addEventListener:(kind,fn)=>{events['document:'+kind]=fn}},
   window:{history:{state:{},replaceState(){},pushState(){},back(){}},addEventListener:(kind,fn)=>{events[kind]=fn}},
   navigate:()=>{}
 };
 vm.createContext(context);vm.runInContext(helper,context);
 return {context,map,events,setNow:value=>{now=value}};
}

test('reopens the same authorized CRM view, history and scroll within two hours',()=>{
 const {context,setNow}=runtime();
 vm.runInContext("navStack.push('pipeline');navScroll.leads=172;saveNav()",context);
 setNow(1_800_000_000_000+60*60*1000);
 const saved=vm.runInContext('loadNav()',context);
 assert.equal(saved.view,'leads');
 assert.equal(saved.scroll,172);
 assert.deepEqual(Array.from(saved.stack),['pipeline']);
 setNow(1_800_000_000_000+2*60*60*1000);
 assert.equal(vm.runInContext('loadNav()',context),null);
});

test('resume never leaks between customer accounts or workspace tenants',()=>{
 const {context}=runtime();
 vm.runInContext('saveNav()',context);
 context.user.id='customer-b';
 assert.equal(vm.runInContext('loadNav()',context),null);
 context.user.id='customer-a';
 context.workspace.id='workspace-b';
 assert.equal(vm.runInContext('loadNav()',context),null);
 context.workspace.id='workspace-a';
 assert.equal(vm.runInContext('loadNav()',context).view,'leads');
});

test('rejects invalid navigation and never persists CRM customer records',()=>{
 const {context,map}=runtime();
 vm.runInContext('saveNav()',context);
 const key=vm.runInContext('navKey()',context);
 assert.deepEqual(Object.keys(JSON.parse(map.get(key))).sort(),['at','scroll','stack','view']);
 const changed=JSON.parse(map.get(key));changed.view='admin';
 map.set(key,JSON.stringify(changed));
 assert.equal(vm.runInContext('loadNav()',context),null);
});

test('header provides real Back and Close, and sign-out clears its private location',()=>{
 assert.match(html,/id="navBack"[^>]*hidden/);
 assert.match(html,/id="navClose"[^>]*hidden/);
 assert.match(js,/\$\('navBack'\)\?\.addEventListener\('click',backNav\)/);
 assert.match(js,/\$\('navClose'\)\?\.addEventListener\('click',closeNav\)/);
 assert.match(js,/window\.addEventListener\('popstate',event=>/);
 assert.match(js,/window\.addEventListener\('pagehide',rememberNav\)/);
 assert.match(js,/clearNav\(\);await db\.auth\.signOut\(\)/);
 assert.match(css,/\.crm-history-actions/);
});
