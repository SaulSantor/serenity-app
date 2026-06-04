const seq = [
  {title:'Borde de la mano', sec:30, text:'Repite tu frase 2-3 veces golpeando suave con 2-3 dedos.'},
  {title:'Ceja', sec:20, text:'Golpecitos suaves. Respiración natural.'},
  {title:'Lado del ojo', sec:20, text:'Observa cualquier cambio en la sensación.'},
  {title:'Bajo el ojo', sec:20, text:'Permite que el cuerpo procese.'},
  {title:'Bajo la nariz', sec:20, text:'Vuelve a la frase si lo deseas.'},
  {title:'Barbilla', sec:20, text:'Mantén la suavidad en hombros.'},
  {title:'Clavícula', sec:20, text:'Respira más profundo si es cómodo.'},
  {title:'Bajo el brazo', sec:20, text:'Nota del 0 al 10 cómo te sientes.'},
  {title:'Coronilla', sec:30, text:'Cierra el ciclo con 3 respiraciones.'}
];
const total = seq.reduce((a,p)=>a+p.sec,0); let remain=total; let idx=0; let left=seq[0].sec; let run=false; let iv=null;
const time=document.getElementById('time'), points=document.getElementById('points'), inst=document.getElementById('inst');
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function render(){ points.innerHTML=''; seq.forEach((p,i)=>{const d=document.createElement('div'); d.className='point'+(i===idx?' active':''); d.innerHTML=`<strong>${i+1}. ${p.title}</strong><div class=\"label\">${Math.round(p.sec/60)}:${String(p.sec%60).padStart(2,'0')} min</div>`; d.style.marginBottom='8px'; points.appendChild(d)}); inst.textContent=seq[idx].text }
function upd(){ time.textContent = fmt(remain) }
function tick(){ if(!run) return; if(remain<=0){ stop(); inst.innerHTML='<strong style="color:var(--ok)"><i class="ri-checkbox-circle-line"></i> Sesión completada</strong>'; return;} remain--; left--; if(left<=0){ idx=Math.min(idx+1, seq.length-1); left=seq[idx].sec; render(); } upd(); }
function start(){ if(run) return; run=true; iv=setInterval(tick,1000); }
function stop(){ run=false; clearInterval(iv) }
function reset(){ stop(); remain=total; idx=0; left=seq[0].sec; render(); upd(); }
document.getElementById('start').onclick=start; document.getElementById('pause').onclick=stop; document.getElementById('reset').onclick=reset; render(); upd();
document.getElementById('save').onclick=()=>{ const pre=+document.getElementById('pre').value||0; const post=+document.getElementById('post').value||0; const phrase=document.getElementById('phrase').value||''; const item={ts:Date.now(), pre, post, phrase}; const key='serenityEFTSessions'; const list=JSON.parse(localStorage.getItem(key)||'[]'); list.push(item); localStorage.setItem(key, JSON.stringify(list)); alert('Sesión guardada. Cambio: '+(pre-post)); };
document.getElementById('load').onclick=()=>{ const id=document.getElementById('yt').value.trim(); if(!id) return; document.getElementById('videoBox').innerHTML=`<iframe width=\"100%\" height=\"100%\" style=\"border:0;border-radius:12px\" src=\"https://www.youtube.com/embed/${id}\" title=\"EFT Tapping\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen></iframe>` };
