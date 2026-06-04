const routine = [
  {title:'Respiración y postura fácil', mins:2, text:'Siéntate cómodo, columna larga. 6 respiraciones lentas. Relaja mandíbula y entrecejo.'},
  {title:'Gato–vaca', mins:2, text:'En 4 puntos: alterna arqueo y curvatura suave de columna con la respiración.'},
  {title:'Niño (Balasana)', mins:2, text:'Caderas a talones, frente al suelo. Brazos adelante o a los lados. Suelta hombros.'},
  {title:'Flexión sentada', mins:2, text:'Piernas extendidas o flexionadas. Alarga al inhalar, pliega suave al exhalar sin dolor.'},
  {title:'Torsión en el suelo', mins:2, text:'Acostado, rodillas al pecho y cae a un lado, luego al otro. Hombros pesados al suelo.'}
];
const total=routine.reduce((a,p)=>a+p.mins*60,0); let remain=total; let idx=0; let left=routine[0].mins*60; let running=false; let iv=null;
const t=document.getElementById('time'), b=document.getElementById('bar'), poses=document.getElementById('poses'), inst=document.getElementById('inst');
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function render(){poses.innerHTML=''; routine.forEach((p,i)=>{const d=document.createElement('div'); d.className='pose'+(i===idx?' active':''); d.innerHTML=`<strong>${i+1}. ${p.title}</strong><div style="color:var(--muted); font-size:13px">${p.mins} min</div>`; d.style.marginBottom='8px'; poses.appendChild(d)}); inst.textContent=routine[idx].text}
function upd(){t.textContent=fmt(remain); b.style.width=`${100*(total-remain)/total}%`}
function tick(){ if(!running) return; if(remain<=0){ stop(); inst.innerHTML='<strong style="color:var(--ok)"><i class="ri-checkbox-circle-line"></i> Rutina completada</strong>'; return;} remain--; left--; if(left<=0){idx=Math.min(idx+1, routine.length-1); left=routine[idx].mins*60; render();} upd(); }
function start(){ if(running) return; running=true; iv=setInterval(tick,1000);} function stop(){running=false; clearInterval(iv);} function reset(){stop(); remain=total; idx=0; left=routine[0].mins*60; render(); upd();}
document.getElementById('start').onclick=start; document.getElementById('pause').onclick=stop; document.getElementById('reset').onclick=reset; render(); upd();
document.getElementById('load').onclick = ()=>{ const id=document.getElementById('yt').value.trim(); if(!id) return; document.getElementById('videoBox').innerHTML=`<iframe width="100%" height="100%" style="border:0;border-radius:12px" src="https://www.youtube.com/embed/${id}" title="Yoga suave" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` }
