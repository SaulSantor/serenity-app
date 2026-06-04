// Meditación Mindfulness Respiración - Serenity

const phases = [
    {title:'Postura y anclaje', mins:2, text:'Siéntate con dignidad. Relaja hombros y mandíbula. Elige el ancla: sensación del aire en la nariz o el vaivén del abdomen.'},
    {title:'Contar respiraciones', mins:2, text:'Cuenta exhalaciones del 1 al 5 y vuelve a 1. Si te distraes, vuelve con amabilidad, sin juicio.'},
    {title:'Etiquetar distracciones', mins:2, text:'Cuando notes pensamientos, etiquétalos suavemente: "pensar", "planear", "recordar". Vuelve a la respiración.'},
    {title:'Ampliar conciencia', mins:2, text:'Incluye sonidos, sensaciones del cuerpo y estado emocional, manteniendo la respiración como base.'},
    {title:'Cierre', mins:2, text:'Respira profundo 2 veces. Nota un 1% de calma nueva y elige llevarla a la próxima actividad.'}
];

const total = phases.reduce((a,p)=>a+p.mins*60,0); 
let remain=total; 
let idx=0; 
let left=phases[0].mins*60; 
let running=false; 
let iv=null;

const t=document.getElementById('time'), b=document.getElementById('bar'), steps=document.getElementById('steps'), instr=document.getElementById('instruction');

function fmt(s){
    return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}

function render(){
    steps.innerHTML=''; 
    phases.forEach((p,i)=>{
        const d=document.createElement('div'); 
        d.className='step'+(i===idx?' active':''); 
        d.innerHTML=`<strong>${i+1}. ${p.title}</strong><div style="color:var(--muted);font-size:13px">${p.mins} min</div>`; 
        steps.appendChild(d)
    }); 
    instr.textContent=phases[idx].text
}

function upd(){
    t.textContent=fmt(remain); 
    b.style.width=`${100*(total-remain)/total}%`
}

function tick(){ 
    if(!running) return; 
    if(remain<=0){ 
        stop(); 
        instr.innerHTML='<strong style="color:var(--ok)"><i class="ri-checkbox-circle-line"></i> Práctica completada</strong>'; 
        return;
    } 
    remain--; 
    left--; 
    if(left<=0){
        idx=Math.min(idx+1, phases.length-1); 
        left=phases[idx].mins*60; 
        render();
    } 
    upd(); 
}

function start(){ 
    if(running) return; 
    running=true; 
    iv=setInterval(tick,1000);
} 

function stop(){
    running=false; 
    clearInterval(iv);
} 

function reset(){
    stop(); 
    remain=total; 
    idx=0; 
    left=phases[0].mins*60; 
    render(); 
    upd();
}

function saveLog(tech, minutes, preId, postId, recentId){
    const pre = Math.max(0, Math.min(10, +document.getElementById(preId).value||0));
    const post = Math.max(0, Math.min(10, +document.getElementById(postId).value||0));
    const key='serenityPracticeLog'; 
    const list=JSON.parse(localStorage.getItem(key)||'[]');
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
                    console.log('✅ Práctica Mindfulness registrada con techniqueId:', techniqueId);
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
    const list=JSON.parse(localStorage.getItem('serenityPracticeLog')||'[]');
    const recent=list.filter(x=>x.technique===tech).sort((a,b)=>b.ts-a.ts).slice(0,3);
    const el=document.getElementById(recentId);
    if(!recent.length){ 
        el.textContent='Aún no hay prácticas registradas'; 
        return; 
    }
    el.innerHTML='Últimas prácticas: '+recent.map(r=>{ 
        const d=new Date(r.ts); 
        const ds=d.toLocaleDateString()+" "+d.toLocaleTimeString().slice(0,5); 
        return `${ds} (Δ ${r.pre}-${r.post})`; 
    }).join(' · ');
}

document.getElementById('saveMF').onclick=()=>saveLog('Mindfulness respiración', 10, 'preMF','postMF','recentMF');
document.getElementById('start').onclick=start; 
document.getElementById('pause').onclick=stop; 
document.getElementById('reset').onclick=reset; 
render(); 
upd(); 
renderRecent('recentMF','Mindfulness respiración');
