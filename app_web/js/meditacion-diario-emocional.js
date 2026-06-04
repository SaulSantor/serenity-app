const key='serenityJournal';
const when=document.getElementById('when');
const emotion=document.getElementById('emotion');
const intensity=document.getElementById('intensity');
const body=document.getElementById('body');
const thoughts=document.getElementById('thoughts');
const trigger=document.getElementById('trigger');
const actions=document.getElementById('actions');
const list=document.getElementById('list');

function nowLocal(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); }
function load(){ return JSON.parse(localStorage.getItem(key)||'[]'); }
function saveAll(arr){ localStorage.setItem(key, JSON.stringify(arr)); }
function render(filter='all'){
  const data=load().sort((a,b)=>b.ts-a.ts).filter(e=>filter==='all'||e.emotion===filter);
  if(!data.length){ list.innerHTML = `<div class="empty"><i class="ri-emotion-line"></i> Aún no hay registros</div>`; return; }
  list.innerHTML='';
  data.forEach((e,i)=>{
    const d=document.createElement('div'); d.className='entry';
    const dt=new Date(e.ts).toLocaleString();
    d.innerHTML=`<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px">
        <div style="display:flex; gap:8px; align-items:center"><span class="pill"><i class="ri-time-line"></i> ${dt}</span><span class="pill"><i class="ri-emotion-line"></i> ${e.emotion}</span><span class="pill"><i class="ri-bar-chart-2-line"></i> ${e.intensity}/10</span></div>
        <div><button data-id="${e.id}" class="btn btn-ghost del"><i class="ri-delete-bin-6-line"></i></button></div>
      </div>
      <div style="color:var(--muted); line-height:1.6">
        <strong>Sensaciones:</strong> ${e.body||'-'}<br>
        <strong>Pensamientos:</strong> ${e.thoughts||'-'}<br>
        <strong>Disparador:</strong> ${e.trigger||'-'}<br>
        <strong>Acciones:</strong> ${e.actions||'-'}
      </div>`;
    list.appendChild(d);
  });
  list.querySelectorAll('.del').forEach(btn=>btn.onclick=()=>{ const id=btn.getAttribute('data-id'); const arr=load().filter(x=>x.id!==id); saveAll(arr); render(document.getElementById('filter').value); });
}
document.getElementById('filter').onchange=(e)=>render(e.target.value);
document.getElementById('clear').onclick=()=>{ body.value=''; thoughts.value=''; trigger.value=''; actions.value=''; };
document.getElementById('save').onclick=()=>{
  const item={ id:crypto.randomUUID?crypto.randomUUID():String(Date.now()), ts: new Date(when.value?when.value:Date.now()).getTime(), emotion:emotion.value, intensity:+intensity.value||0, body:body.value.trim(), thoughts:thoughts.value.trim(), trigger:trigger.value.trim(), actions:actions.value.trim() };
  const arr=load(); arr.push(item); saveAll(arr); render(document.getElementById('filter').value); alert('Registro guardado'); };
when.value = nowLocal(); render('all');
