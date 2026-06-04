// Ejercicio PMR (Relajación Muscular Progresiva) - Serenity

const muscleGroups = [
    {
        name: "Manos y antebrazos",
        tenseInstruction: "Cierra los puños fuertemente. Siente la tensión en tus manos y antebrazos.",
        releaseInstruction: "Suelta lentamente. Siente cómo fluye la relajación por tus manos y dedos."
    },
    {
        name: "Bíceps",
        tenseInstruction: "Dobla los brazos y tensa los bíceps llevando las manos hacia los hombros.",
        releaseInstruction: "Suelta completamente. Deja que tus brazos caigan pesados y relajados."
    },
    {
        name: "Hombros",
        tenseInstruction: "Eleva los hombros hacia las orejas todo lo que puedas. Mantén la tensión.",
        releaseInstruction: "Deja caer los hombros. Siente la liberación de tensión en cuello y hombros."
    },
    {
        name: "Rostro y cuello",
        tenseInstruction: "Arruga la frente, aprieta los ojos y la mandíbula. Tensa todo el rostro.",
        releaseInstruction: "Relaja completamente. Siente tu rostro suave, tu mandíbula floja, tu cuello libre."
    },
    {
        name: "Pecho y espalda",
        tenseInstruction: "Inhala profundamente, lleva los omóplatos juntos y arquea la espalda.",
        releaseInstruction: "Exhala y suelta. Deja que tu pecho y espalda descansen completamente."
    },
    {
        name: "Abdomen",
        tenseInstruction: "Contrae los músculos abdominales como si recibieras un golpe en el estómago.",
        releaseInstruction: "Suelta. Deja que tu abdomen se relaje completamente, respirando naturalmente."
    },
    {
        name: "Muslos",
        tenseInstruction: "Tensa los muslos presionando las rodillas juntas o hacia abajo con fuerza.",
        releaseInstruction: "Relaja completamente. Siente tus muslos pesados y relajados sobre la superficie."
    },
    {
        name: "Pantorrillas y pies",
        tenseInstruction: "Apunta los dedos de los pies hacia arriba y tensa las pantorrillas.",
        releaseInstruction: "Suelta. Siente la relajación fluir por tus piernas hasta los dedos de los pies."
    }
];

let currentGroup = -1;
let isRunning = false;
let phase = 'ready'; // ready, tense, release
let timer;
let countdown;
let practiceStartTime = null;

function startExercise() {
    if (isRunning) return;
    
    isRunning = true;
    currentGroup = 0;
    practiceStartTime = Date.now();
    document.getElementById('startBtn').style.display = 'none';
    nextMuscleGroup();
}

function nextMuscleGroup() {
    if (currentGroup >= muscleGroups.length) {
        completeExercise();
        return;
    }

    const group = muscleGroups[currentGroup];
    
    // Fase de tensión (5 segundos)
    phase = 'tense';
    updateUI(group.name, group.tenseInstruction, 'Tensar (5 segundos)', 5);
    startCountdown(5, () => {
        // Fase de relajación (10 segundos)
        phase = 'release';
        updateUI(group.name, group.releaseInstruction, 'Relajar (10 segundos)', 10);
        startCountdown(10, () => {
            // Marcar como completado
            markGroupCompleted(currentGroup + 1);
            currentGroup++;
            
            // Pequeña pausa antes del siguiente grupo
            setTimeout(() => {
                nextMuscleGroup();
            }, 1000);
        });
    });
}

function updateUI(title, instruction, phaseText, seconds) {
    document.getElementById('muscleTitle').textContent = title;
    document.getElementById('instruction').textContent = instruction;
    document.getElementById('phase').textContent = phaseText;
    document.getElementById('timer').textContent = seconds;
    document.getElementById('timer').style.display = 'block';
    
    updateProgress();
}

function startCountdown(seconds, callback) {
    let remaining = seconds;
    const timerEl = document.getElementById('timer');
    
    countdown = setInterval(() => {
        remaining--;
        timerEl.textContent = remaining;
        
        if (remaining <= 0) {
            clearInterval(countdown);
            callback();
        }
    }, 1000);
}

function markGroupCompleted(groupNumber) {
    const item = document.querySelector(`[data-group="${groupNumber}"]`);
    if (item) {
        item.classList.add('completed');
        item.querySelector('.muscle-checkbox i').className = 'ri-check-line';
    }
}

function updateProgress() {
    const progress = (currentGroup / muscleGroups.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function completeExercise() {
    isRunning = false;
    document.getElementById('completionOverlay').classList.add('show');
    updateProgress();

    // Guardar práctica en servidor/local
    const duration = practiceStartTime ? Math.max(1, Math.round((Date.now() - practiceStartTime) / 60000)) : Math.ceil(muscleGroups.length * (5 + 10) / 60);
    if (window && window.dashboardAPI) {
        const techniqueName = 'Relajación Muscular Progresiva';
        const techniqueId = window.getTechniqueIdByName ? window.getTechniqueIdByName(techniqueName) : null;
        
        window.dashboardAPI.logPractice({
            technique: techniqueName,
            techniqueId: techniqueId,
            duration: duration,
            intensityBefore: 7,
            intensityAfter: 2,
            type: 'exercise',
            completed: true
        }).then(res => {
            console.log('✅ Práctica PMR guardada con techniqueId:', techniqueId);
        }).catch(err => {
            console.warn('⚠️ No se pudo guardar práctica PMR:', err);
        });
    }
}

function resetExercise() {
    if (countdown) clearInterval(countdown);
    
    currentGroup = -1;
    isRunning = false;
    phase = 'ready';
    
    document.getElementById('muscleTitle').textContent = 'Prepárate para comenzar';
    document.getElementById('instruction').textContent = 'Busca un lugar cómodo donde puedas sentarte o recostarte sin interrupciones. Vamos a trabajar 8 grupos musculares principales.';
    document.getElementById('phase').textContent = 'Preparación';
    document.getElementById('timer').style.display = 'none';
    document.getElementById('startBtn').style.display = 'flex';
    document.getElementById('progressBar').style.width = '0%';
    
    // Resetear checkboxes
    document.querySelectorAll('.muscle-item').forEach(item => {
        item.classList.remove('completed');
        item.querySelector('.muscle-checkbox i').className = 'ri-close-line';
    });
}

function closeCompletion() {
    window.location.href = 'dashboard.html';
}
