const bodyParts = [
  { name: 'head', instruction: 'Dirige tu atención a la coronilla de tu cabeza. Observa cualquier sensación: calor, frío, hormigueo, tensión. Sin juzgar, solo observa.', duration: 60 },
  { name: 'neck', instruction: 'Baja tu atención al cuello. Nota si hay tensión en los músculos. Respira hacia esa zona y permite que se relaje.', duration: 50 },
  { name: 'shoulders', instruction: 'Enfócate en tus hombros. Muchas personas acumulan estrés aquí. Observa la sensación sin intentar cambiarla.', duration: 60 },
  { name: 'left-arm', instruction: 'Escanea tu brazo izquierdo, desde el hombro hasta las puntas de los dedos. Nota el peso, la temperatura, cualquier sensación.', duration: 50 },
  { name: 'right-arm', instruction: 'Ahora tu brazo derecho. Recorre desde el hombro hasta los dedos, observando cada parte con curiosidad.', duration: 50 },
  { name: 'chest', instruction: 'Lleva tu atención al pecho. Siente tu respiración expandir esta área. Nota el movimiento sutil con cada inhalación.', duration: 60 },
  { name: 'abdomen', instruction: 'Observa tu abdomen. Siente cómo sube y baja con la respiración. Cualquier emoción puede manifestarse aquí.', duration: 60 },
  { name: 'hips', instruction: 'Escanea la zona de las caderas y pelvis. Suelta cualquier tensión que encuentres simplemente observándola.', duration: 50 },
  { name: 'left-leg', instruction: 'Recorre tu pierna izquierda desde la cadera hasta los dedos del pie. Nota el contacto con la superficie donde estás.', duration: 50 },
  { name: 'right-leg', instruction: 'Finalmente, tu pierna derecha. Completa el escaneo notando cualquier sensación desde la cadera hasta los dedos del pie.', duration: 50 }
];

let currentPart = -1;
let isRunning = false;
let isPaused = false;
let totalSeconds = 600; // 10 minutos
let remainingSeconds = totalSeconds;
let timer;
let partTimer;

function startMeditation() {
  if (isRunning) return;
  isRunning = true;
  isPaused = false;
  currentPart = 0;
  document.getElementById('playBtn').style.display = 'none';
  document.getElementById('pauseBtn').style.display = 'flex';
  startTimer();
  nextBodyPart();
}

function pauseMeditation() {
  if (!isRunning) return;
  isPaused = !isPaused;
  const pauseBtn = document.getElementById('pauseBtn');
  if (isPaused) {
    clearTimeout(partTimer);
    pauseBtn.innerHTML = '<i class="ri-play-line"></i> Continuar';
  } else {
    pauseBtn.innerHTML = '<i class="ri-pause-line"></i> Pausar';
    nextBodyPart();
  }
}

function startTimer() {
  timer = setInterval(() => {
    if (!isPaused && remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    }
    if (remainingSeconds === 0) {
      completeMeditation();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function nextBodyPart() {
  if (isPaused || currentPart >= bodyParts.length) return;
  const part = bodyParts[currentPart];
  document.querySelectorAll('.body-part').forEach(el => {
    el.classList.remove('active');
    if (el.dataset.part === part.name) {
      el.classList.add('active');
    }
  });
  document.getElementById('instruction').textContent = part.instruction;
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((step, idx) => {
    step.classList.remove('active');
    if (idx === currentPart) {
      step.classList.add('active');
    } else if (idx < currentPart) {
      step.classList.add('completed');
    }
  });
  partTimer = setTimeout(() => {
    const currentElement = document.querySelector(`[data-part="${part.name}"]`);
    if (currentElement) {
      currentElement.classList.remove('active');
      currentElement.classList.add('completed');
    }
    currentPart++;
    if (currentPart < bodyParts.length) {
      nextBodyPart();
    } else {
      finalRelaxation();
    }
  }, part.duration * 1000);
}

function finalRelaxation() {
  document.getElementById('instruction').textContent = 'Ahora toma conciencia de todo tu cuerpo como un todo. Respira profundamente y disfruta esta sensación de calma.';
  document.querySelectorAll('.body-part').forEach(el => {
    el.classList.add('completed');
  });
}

function completeMeditation() {
  clearInterval(timer);
  clearTimeout(partTimer);
  isRunning = false;
  document.getElementById('instruction').textContent = '¡Excelente! Has completado el escaneo corporal. Tómate un momento antes de abrir los ojos.';
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('playBtn').style.display = 'flex';
  document.getElementById('playBtn').innerHTML = '<i class="ri-check-line"></i> Completado';
  
  // Guardar práctica en servidor/local
  const duration = Math.round(totalSeconds / 60);
  if (window && window.dashboardAPI) {
    const techniqueName = 'Escaneo Corporal (Body Scan)';
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
      console.log('✅ Práctica Body Scan guardada con techniqueId:', techniqueId);
    }).catch(err => {
      console.warn('⚠️ No se pudo guardar práctica Body Scan:', err);
    });
  }
}

function resetMeditation() {
  clearInterval(timer);
  clearTimeout(partTimer);
  isRunning = false;
  isPaused = false;
  currentPart = -1;
  remainingSeconds = totalSeconds;
  updateTimerDisplay();
  document.getElementById('instruction').textContent = 'Busca una posición cómoda y cierra los ojos. Respira profundamente tres veces.';
  document.querySelectorAll('.body-part').forEach(el => { el.classList.remove('active', 'completed'); });
  document.querySelectorAll('.progress-step').forEach((step, idx) => {
    step.classList.remove('active', 'completed');
    if (idx === 0) step.classList.add('active');
  });
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('playBtn').style.display = 'flex';
  document.getElementById('playBtn').innerHTML = '<i class="ri-play-fill"></i> Comenzar meditación';
}
