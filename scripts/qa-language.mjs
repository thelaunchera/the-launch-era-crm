import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function objectAt(position){
 const start=source.indexOf('{',position);
 assert(start>=0,'Translation dictionary object missing');
 let depth=0,quote='',escaped=false;
 for(let i=start;i<source.length;i++){
  const ch=source[i];
  if(quote){
   if(escaped)escaped=false;
   else if(ch==='\\')escaped=true;
   else if(ch===quote)quote='';
   continue;
  }
  if(ch==='"'||ch==="'"){quote=ch;continue}
  if(ch==='{')depth++;
  if(ch==='}'&&--depth===0)return JSON.parse(source.slice(start,i+1));
 }
 throw Error('Translation dictionary has an unclosed object');
}
const positions=[
 source.indexOf('const translations='),
 ...Array.from(source.matchAll(/Object\.assign\(translations,/g),m=>m.index)
];
const translations={};
for(const position of positions)Object.assign(translations,objectAt(position));
assert(Object.keys(translations).length>=850,'Expected all buyer and owner translations');

for(const [en,es] of Object.entries({
 'My Booking Page':'Mi página de reservas',
 'Email Automation':'Automatización de correos',
 '✓ Approve & Continue':'✓ Aprobar y continuar',
 '✎ Request Changes':'✎ Solicitar cambios',
 'Refresh purchases':'Actualizar compras',
 'Refresh email preview':'Actualizar vista previa del correo',
 'CB DEPOT · PRIVATE COMMAND CENTER':'CB DEPOT · COMMAND CENTER PRIVADO',
 'Mobile':'Móvil',
 'Desktop':'Computadora',
 'TEST PASSED':'PRUEBA APROBADA'
})){
 assert.equal(translations[en],es,'Missing translation: '+en);
 const render=(language)=>language==='es'?translations[en]:en;
 assert.equal(render('es'),es);
 assert.equal(render('en'),en);
}

const html=source.slice(0,source.indexOf('<script',source.indexOf('</style>')));
for(const mixed of ['Mobile / Móvil','Desktop / Computadora','Review / Revisar','Client delivery / Entrega a compradoras','Refresh purchases compras','Refresh preview correo']){
 assert(!html.includes(mixed),'Mixed or damaged customer label: '+mixed);
}

assert(source.includes('const englishBySpanish=new Map()'),'Reverse dictionary missing');
assert(source.includes('englishBySpanish.set(es,en)'),'Reverse translation initialization missing');
assert(/tle_crm_language_['\"]\s*\+\s*workspace\.id/.test(source),'Workspace-scoped locale storage missing');
assert(source.includes('buyerText(\'✓ TEST PASSED'),'QA result does not follow selected language');
assert(source.includes('const label=lang==="es"?"Idioma":"Language"')&&source.includes('picker.setAttribute("aria-label",label)'),'Language picker must expose a localized accessibility label');
assert(source.includes('document.documentElement.lang=lang'),'Page language must follow the selected locale');
assert(/content="2026-10-10-[a-z0-9-]+-v\d+"/.test(source),'Missing release marker');

console.log('PASS · EN/ES Command Center static translation audit · '+Object.keys(translations).length+' keys');
