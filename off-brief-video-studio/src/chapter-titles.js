// OFF BRIEF / non-destructive animated lettering for the approved 5-second intro.
// Canvas coordinates are normalized to the 16:9 frame so iPhone preview and export match.
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,Number(n)||0));
export const CHAPTER_EFFECTS=[
  ['pop','Pop up'],['spin','Spin / rotate'],['bounce','Bounce'],
  ['zoom','Zoom in'],['rise','Slide up'],['slide','Slide from side'],
  ['flip','Flip'],['type','Typewriter'],['fade','Fade in'],
  ['shake','Shake'],['none','No animation']
];
const cleanText=(value,fallback,max=28)=>String(value??fallback).replace(/[\r\n\t]/g,' ').slice(0,max);
export function chapterDefaults(episodeNumber=1){
  return {
    enabled:false,
    label:{text:'CHAPTER',x:0.5,y:0.64,size:0.072,color:'#FAF8F3',effect:'rise',delay:0.2},
    number:{text:String(episodeNumber).padStart(2,'0'),x:0.5,y:0.78,size:0.16,color:'#F2D85B',effect:'pop',delay:0.65}
  };
}
export function normalizeChapter(raw,episodeNumber=1){
  const base=chapterDefaults(episodeNumber);
  const result={enabled:raw?.enabled===true};
  for(const key of ['label','number']){
    const src={...base[key],...(raw?.[key]||{})};
    result[key]={
      text:cleanText(src.text,base[key].text,key==='number'?12:28),
      x:clamp(src.x,0.09,0.91),y:clamp(src.y,0.12,0.90),
      size:clamp(src.size,0.035,0.27),
      color:['#FAF8F3','#F2D85B','#191919','#B8D9EA','#FFFFFF'].includes(src.color)?src.color:base[key].color,
      effect:CHAPTER_EFFECTS.some(p=>p[0]===src.effect)?src.effect:base[key].effect,
      delay:clamp(src.delay,0,3.8)
    };
  }
  return result;
}
const easeOutBack=t=>1+2.1*Math.pow(t-1,3)+1.1*Math.pow(t-1,2);
const easeOutCubic=t=>1-Math.pow(1-t,3);
export function drawChapterTitles(ctx,canvas,raw,elapsed=5,options={}){
  const settings=normalizeChapter(raw,options.episodeNumber||1);
  if(!settings.enabled)return;
  const w=canvas.width,h=canvas.height;
  for(const key of ['label','number']){
    const item=settings[key];
    if(!item.text)continue;
    const time=Number(elapsed)-item.delay;
    if(time<0)continue;
    const p=clamp(time/0.76,0,1),ease=easeOutCubic(p);
    let scale=1,angle=0,dx=0,dy=0,alpha=1,text=item.text;
    switch(item.effect){
      case 'pop': scale=Math.max(0.05,easeOutBack(p));alpha=Math.min(1,p*5);break;
      case 'spin':angle=(1-ease)*Math.PI*2;scale=0.72+0.28*ease;alpha=Math.min(1,p*6);break;
      case 'bounce':scale=Math.max(.05,1-Math.exp(-5*p)*Math.cos(p*4*Math.PI));alpha=Math.min(1,p*7);break;
      case 'zoom':scale=.24+.76*ease;alpha=Math.min(1,p*4);break;
      case 'rise':dy=h*(1-ease)*.22;alpha=Math.min(1,p*3);break;
      case 'slide':dx=w*(1-ease)*(-.38);alpha=Math.min(1,p*3);break;
      case 'flip':scale=Math.max(.04,Math.abs(Math.cos((1-ease)*Math.PI)));alpha=Math.min(1,p*5);break;
      case 'type':text=item.text.slice(0,Math.max(0,Math.ceil(item.text.length*p)));break;
      case 'fade':alpha=ease;break;
      case 'shake':dx=Math.sin(p*10*Math.PI)*(1-p)*w*.018;alpha=Math.min(1,p*6);break;
      default:break;
    }
    if(!text)continue;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(w*item.x+dx,h*item.y+dy);
    ctx.rotate(angle);
    ctx.scale(scale,scale);
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.lineJoin='round';
    ctx.font='900 '+Math.round(h*item.size)+'px Arial, sans-serif';
    const maxWidth=w*.83;
    const measured=ctx.measureText(text).width;
    if(measured>maxWidth)ctx.scale(maxWidth/measured,1);
    ctx.shadowColor='rgba(0,0,0,.62)';
    ctx.shadowBlur=h*.012;
    ctx.shadowOffsetY=h*.005;
    ctx.lineWidth=Math.max(2,h*.006);
    ctx.strokeStyle='rgba(25,25,25,.78)';
    ctx.strokeText(text,0,0);
    ctx.fillStyle=item.color;
    ctx.fillText(text,0,0);
    ctx.restore();
  }
}