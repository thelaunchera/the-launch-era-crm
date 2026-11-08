/**
 * OFF BRIEF — linked media library; original content remains safely in Drive.
 */
import library from '../production-library.json';
(function addProductionLibrary() {
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link=(label,url)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>';
  const group=(label,links)=>'<section class="ob-library-group"><h3>'+esc(label)+'</h3><div class="ob-library-links">'+links.join('')+'</div></section>';
  const init=()=>{
    const nav=document.querySelector('.fc-mode-nav>div');
    if(!nav||document.querySelector('#ob-open-library'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.id='ob-open-library';btn.textContent='Media Library';
    nav.appendChild(btn);
    const dialog=document.createElement('dialog');dialog.id='ob-library-dialog';
    const folderLinks=Object.values(library.folders).map(f=>link(f.label,f.url));
    const epLinks=library.episodes.map(ep=>
      '<article class="ob-library-episode"><div><b>'+esc(ep.key)+'</b><span>'+esc(ep.title)+'</span></div>'+
      '<div>'+link('Scene photos','https://drive.google.com/drive/folders/'+ep.folder)+
      (ep.preview?link('Preview MP4','https://drive.google.com/file/d/'+ep.preview+'/view'):'<small>Preview pending</small>')+
      '</div></article>'
    );
    dialog.innerHTML=
      '<header><div><small>THE LAUNCH ERA / PRIVATE PRODUCTION</small><h2>OFF BRIEF Library</h2></div><button type="button" id="ob-close-library" aria-label="Close media library">×</button></header>'+
      '<p>All approved original media stays in Google Drive. This dashboard links to it without creating duplicates. Files open under your Google permissions.</p>'+
      group('Quick access',folderLinks)+
      group('Official show assets',[
        link('Universal 5-second intro',library.intro.url),
        link('YouTube channel',library.channel.url)])+
      '<section class="ob-library-group"><h3>Scenes & previews</h3><div class="ob-library-episodes">'+epLinks.join('')+'</div></section>'+
      '<footer>Verified folder references · Nia & Ruby original identities protected · The intro follows the comedic opening.</footer>';
    document.body.appendChild(dialog);
    btn.addEventListener('click',()=>dialog.showModal());
    dialog.querySelector('#ob-close-library').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
