const phases = [
  { name: 'Inhala', duration: 4, action: 'inhale', corner: 1 },
  { name: 'Sostén', duration: 4, action: 'hold-inhale', corner: 2 },
  { name: 'Exhala', duration: 4, action: 'exhale', corner: 3 },
  { name: 'Sostén', duration: 4, action: 'hold-exhale', corner: 4 }
];

let currentPhase = 0;
let currentCycle = 0;
let totalCycles = 5;
let isRunning = false;
let isPaused = false;
let phaseTimer;
let countdownInterval;
let secondsCounter = 0;
let totalSecondsTimer;

function startBreathing() {
  if (isRunning) return;
  isRunning = true;
  isPaused = false;
  currentPhase = 0;
  currentCycle = 1;
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('pauseBtn').style.display = 'flex';
  document.getElementById('breathingBox').classList.add('active');
  startTotalTimer();
  nextPhase();
}

function pauseBreathing() {
  isPaused = !isPaused;
  const pauseBtn = document.getElementById('pauseBtn');
  if (isPaused) {
    clearTimeout(phaseTimer);
    clearInterval(countdownInterval);
    pauseBtn.innerHTML = '<i class="ri-play-line"></i> Continuar';
  } else {
    pauseBtn.innerHTML = '<i class="ri-pause-line"></i> Pausar';
    nextPhase();
  }
}

function startTotalTimer() {
  totalSecondsTimer = setInterval(() => {
    if (!isPaused) {
      secondsCounter++;
      updateTotalTime();
    }
  }, 1000);
}

function updateTotalTime() {
  const minutes = Math.floor(secondsCounter / 60);
  const seconds = secondsCounter % 60;
  document.getElementById('totalTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  if (secondsCounter > 0) {
    const breathsPerMin = Math.round((currentCycle - 1 + currentPhase / 4) / (secondsCounter / 60));
    document.getElementById('breathsPerMinute').textContent = breathsPerMin || '--';
  }
}

function nextPhase() {
  if (isPaused) return;
  if (currentPhase >= phases.length) {
    currentPhase = 0;
    currentCycle++;
    if (currentCycle > totalCycles) {
      completeBreathing();
      return;
    }
  }
  const phase = phases[currentPhase];
  document.getElementById('breathingText').textContent = phase.name;
  document.getElementById('phaseTitle').textContent = phase.name + ' por ' + phase.duration + ' segundos';
  document.getElementById('phaseCounter').textContent = `Ciclo ${currentCycle} de ${totalCycles}`;
  const circle = document.getElementById('breathingCircle');
  circle.className = 'breathing-circle';
  setTimeout(() => { circle.classList.add(phase.action.split('-')[0]); }, 50);
  document.querySelectorAll('.box-corner').forEach(corner => { corner.classList.remove('active'); });
  document.getElementById(`corner${phase.corner}`).classList.add('active');
  let countdown = phase.duration;
  document.getElementById('counter').textContent = countdown;
  countdownInterval = setInterval(() => {
    countdown--;
    document.getElementById('counter').textContent = countdown;
    if (countdown === 0) { clearInterval(countdownInterval); }
  }, 1000);
  phaseTimer = setTimeout(() => { currentPhase++; nextPhase(); }, phase.duration * 1000);
}

function completeBreathing() {
  clearInterval(totalSecondsTimer);
  clearTimeout(phaseTimer);
  clearInterval(countdownInterval);
  isRunning = false;
  document.getElementById('breathingText').textContent = '¡Completado!';
  document.getElementById('phaseTitle').textContent = 'Excelente trabajo';
  document.getElementById('totalCycles').textContent = currentCycle - 1;
  document.getElementById('breathingBox').classList.remove('active');
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('startBtn').style.display = 'flex';
  document.getElementById('startBtn').innerHTML = '<i class="ri-check-line"></i> Finalizado';
  
  // Guardar práctica en servidor/local
  const duration = Math.round(secondsCounter / 60) || 5;
  const techniqueName = 'Box Breathing';
  
  if (window && window.dashboardAPI) {
    // Obtener techniqueId desde el mapa global
    const techniqueId = window.getTechniqueIdByName ? window.getTechniqueIdByName(techniqueName) : null;
    
    window.dashboardAPI.logPractice({
      technique: techniqueName,
      techniqueId: techniqueId,
      duration: duration,
      intensityBefore: 6,
      intensityAfter: 3,
      type: 'meditation',
      completed: true
    }).then(res => {
      console.log('✅ Práctica Box Breathing guardada con techniqueId:', techniqueId);
    }).catch(err => {
      console.warn('⚠️ No se pudo guardar práctica en servidor:', err);
    });
  }
}

function resetBreathing() {
  clearInterval(totalSecondsTimer);
  clearTimeout(phaseTimer);
  clearInterval(countdownInterval);
  isRunning = false;
  isPaused = false;
  currentPhase = 0;
  currentCycle = 0;
  secondsCounter = 0;
  document.getElementById('breathingText').textContent = 'Prepárate';
  document.getElementById('counter').textContent = '4';
  document.getElementById('phaseTitle').textContent = 'Presiona "Comenzar" para iniciar';
  document.getElementById('phaseCounter').textContent = 'Ciclo 0 de 5';
  document.getElementById('totalCycles').textContent = '0';
  document.getElementById('totalTime').textContent = '0:00';
  document.getElementById('breathsPerMinute').textContent = '--';
  document.getElementById('breathingCircle').className = 'breathing-circle';
  document.getElementById('breathingBox').classList.remove('active');
  document.querySelectorAll('.box-corner').forEach(corner => { corner.classList.remove('active'); });
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('startBtn').style.display = 'flex';
  document.getElementById('startBtn').innerHTML = '<i class="ri-play-fill"></i> Comenzar';
}
