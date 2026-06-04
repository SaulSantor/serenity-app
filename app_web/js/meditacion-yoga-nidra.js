const phases = [
  { title:'Llegada y sankalpa', mins:2, text:'Acomódate. Siente los puntos de apoyo del cuerpo. Suaviza la mandíbula. Formula un propósito breve y amable (sankalpa) como “Me doy permiso de descansar”.' },
  { title:'Rotación de la consciencia', mins:4, text:'Lleva la atención por partes: mano derecha, antebrazo, codo, brazo, hombro… Luego lado izquierdo. Después pies, piernas, cadera y espalda.' },
  { title:'Respiración natural', mins:3, text:'Observa el flujo de la respiración sin controlarla. Percibe el vaivén del abdomen como olas suaves. Si te distraes, vuelve con amabilidad.' },
  { title:'Sensaciones opuestas', mins:2, text:'Evoca brevemente sensaciones de peso/ligereza y calor/frescura. Alterna 2-3 veces, sin forzar, solo sugiriendo.' },
  { title:'Visualización calmante', mins:3, text:'Imagina un lugar seguro: colores, sonidos, temperatura y aromas. Permite que el cuerpo se sienta contenido y a salvo.' },
  { title:'Cierre y retorno', mins:1, text:'Repite tu sankalpa. Respira más profundo, mueve dedos y estírate. Abre los ojos lentamente.' }
];

const totalSecs = phases.reduce((a,p)=>a+p.mins*60,0);
let remaining = totalSecs; let idx=0; let running=false; let iv=null; let phaseLeft = phases[0].mins*60;
const timeEl = document.getElementById('time');
const bar = document.getElementById('bar');
const stepsEl = document.getElementById('steps');
const instruction = document.getElementById('instruction');

function fmt(s){const m=Math.floor(s/60).toString().padStart(2,'0'); const r=(s%60).toString().padStart(2,'0'); return `${m}:${r}`}
function renderSteps(){
  stepsEl.innerHTML = '';
  phases.forEach((p,i)=>{
    const d=document.createElement('div'); d.className='step'+(i===idx?' active':'');
    d.innerHTML = `<strong>${i+1}. ${p.title}</strong><div style="color:var(--muted); font-size:13px">${p.mins} min</div>`;
    stepsEl.appendChild(d);
  });
  instruction.textContent = phases[idx].text;
}
function update(){ timeEl.textContent = fmt(remaining); bar.style.width = `${100*(totalSecs-remaining)/totalSecs}%`; }
function tick(){ if(!running) return; if(remaining<=0){ stop(); complete(); return; } remaining--; phaseLeft--; if(phaseLeft<=0){ idx=Math.min(idx+1, phases.length-1); phaseLeft = phases[idx].mins*60; renderSteps(); } update(); }
function start(){ if(running) return; running=true; iv=setInterval(tick,1000); }
function pause(){ running=false; clearInterval(iv); }
function stop(){ running=false; clearInterval(iv); }
function reset(){ stop(); remaining=totalSecs; idx=0; phaseLeft=phases[0].mins*60; renderSteps(); update(); }
function complete(){ instruction.innerHTML = '<strong style="color:var(--ok)"><i class="ri-checkbox-circle-line"></i> Práctica completada</strong><br> Nota cómo te sientes y registra brevemente tu estado si lo deseas.' }

function saveLog(tech, minutes, preId, postId, recentId){
  const pre = Math.max(0, Math.min(10, +document.getElementById(preId).value||0));
  const post = Math.max(0, Math.min(10, +document.getElementById(postId).value||0));
  const key='serenityPracticeLog';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.push({ts:Date.now(), technique:tech, minutes, pre, post});
  localStorage.setItem(key, JSON.stringify(list));
  renderRecent(recentId, tech);
  
  // Enviar al backend para actualizar progreso
  if (window.dashboardAPI) {
    const techniqueId = window.getTechniqueIdByName ? window.getTechniqueIdByName(tech) : null;
    
    window.dashboardAPI.logPractice({
      technique: tech,
      techniqueId: techniqueId,
      duration: minutes,
      intensityBefore: pre,
      intensityAfter: post,
      type: 'meditation',
      completed: true
    })
      .then(res => {
        console.log('✅ Práctica Yoga Nidra registrada con techniqueId:', techniqueId);
        alert('Práctica guardada. Cambio: '+(pre-post));
      })
      .catch(err => {
        console.warn('⚠️ No se pudo guardar en BD, pero está en localStorage:', err);
        alert('Práctica guardada localmente.');
      });
  } else {
    alert('Práctica guardada. Cambio: '+(pre-post));
  }
}
function renderRecent(recentId, tech){
  const key='serenityPracticeLog'; const list = JSON.parse(localStorage.getItem(key)||'[]');
  const recent = list.filter(x=>x.technique===tech).sort((a,b)=>b.ts-a.ts).slice(0,3);
  const el = document.getElementById(recentId);
  if(!recent.length){ el.textContent='Aún no hay prácticas registradas'; return; }
  el.innerHTML = 'Últimas prácticas: '+recent.map(r=>{
    const d = new Date(r.ts); const ds = d.toLocaleDateString()+' '+d.toLocaleTimeString().slice(0,5);
    return `${ds} (Δ ${r.pre}-${r.post})`;}).join(' · ');
}
document.getElementById('saveYN').onclick=()=>saveLog('Yoga Nidra', 15, 'preYN','postYN','recentYN');
document.getElementById('start').onclick=start; document.getElementById('pause').onclick=pause; document.getElementById('reset').onclick=reset;
renderSteps(); update(); renderRecent('recentYN','Yoga Nidra');
