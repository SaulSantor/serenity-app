// Ejercicio Grounding 5-4-3-2-1 - Serenity

let currentStep = 1;
let completedItems = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
};
let practiceStartTime = Date.now();

const stepData = {
    1: { total: 5, sense: 'VISTA', instruction: 'Observa tu entorno y nombra 5 cosas que puedas ver', label: 'Cosas para ver' },
    2: { total: 4, sense: 'TACTO', instruction: 'Toca y nombra 4 cosas que sientas en tu cuerpo o alrededor', label: 'Cosas para tocar' },
    3: { total: 3, sense: 'OÍDO', instruction: 'Escucha atentamente y nombra 3 sonidos que puedas oír', label: 'Cosas para escuchar' },
    4: { total: 2, sense: 'OLFATO', instruction: 'Enfócate en tu nariz y nombra 2 olores que percibes', label: 'Cosas para oler' },
    5: { total: 1, sense: 'GUSTO', instruction: 'Presta atención a tu boca y nombra 1 sabor', label: 'Cosa para saborear' }
};

// Inicializar el ejercicio
document.addEventListener('DOMContentLoaded', function() {
    updateActiveStep();
    makeTagsInteractive();
});

function makeTagsInteractive() {
    for (let step = 1; step <= 5; step++) {
        const tags = document.querySelectorAll(`#inputs${step} .input-tag`);
        tags.forEach((tag, index) => {
            tag.style.cursor = 'pointer';
            tag.addEventListener('click', function() {
                if (step === currentStep && !this.classList.contains('filled')) {
                    this.classList.add('filled');
                    completedItems[step]++;
                    updateProgress();
                    
                    // Verificar si completó todos los items del paso actual
                    if (completedItems[step] === stepData[step].total) {
                        setTimeout(() => {
                            if (currentStep < 5) {
                                nextStep();
                            } else {
                                completeExercise();
                            }
                        }, 500);
                    }
                }
            });
        });
    }
}

function updateActiveStep() {
    // Actualizar estilos de los pasos
    for (let i = 1; i <= 5; i++) {
        const step = document.getElementById(`step${i}`);
        step.classList.remove('active', 'completed');
        
        if (i < currentStep) {
            step.classList.add('completed');
            document.getElementById(`icon${i}`).classList.add('completed');
        } else if (i === currentStep) {
            step.classList.add('active');
        }
    }

    updateProgress();
}

function updateProgress() {
    const data = stepData[currentStep];
    const remaining = data.total - completedItems[currentStep];
    
    document.getElementById('progressNumber').textContent = remaining;
    document.getElementById('progressLabel').textContent = data.label;
    document.getElementById('currentSense').textContent = data.instruction;
}

function nextStep() {
    if (currentStep < 5) {
        currentStep++;
        updateActiveStep();
    } else {
        completeExercise();
    }
}

function resetExercise() {
    currentStep = 1;
    completedItems = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // Resetear todos los tags
    document.querySelectorAll('.input-tag').forEach(tag => {
        tag.classList.remove('filled');
    });

    // Resetear iconos
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`icon${i}`).classList.remove('completed');
    }

    // Ocultar mensaje de completado
    document.getElementById('completionMessage').classList.remove('show');
    
    updateActiveStep();
}

function completeExercise() {
    document.getElementById('completionMessage').classList.add('show');
    document.getElementById('nextButton').textContent = '✓ Completado';
    document.getElementById('nextButton').disabled = true;
    
    // Scroll suave al mensaje
    document.getElementById('completionMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Guardar práctica en servidor/local
    const duration = practiceStartTime ? Math.max(1, Math.round((Date.now() - practiceStartTime) / 60000)) : 5;
    const techniqueName = 'Grounding 5-4-3-2-1';
    
    if (window && window.dashboardAPI) {
        const techniqueId = window.getTechniqueIdByName ? window.getTechniqueIdByName(techniqueName) : null;
        
        window.dashboardAPI.logPractice({
            technique: techniqueName,
            techniqueId: techniqueId,
            duration: duration,
            intensityBefore: 6,
            intensityAfter: 3,
            type: 'exercise',
            completed: true
        }).then(res => {
            console.log('✅ Práctica Grounding guardada con techniqueId:', techniqueId);
        }).catch(err => {
            console.warn('⚠️ No se pudo guardar práctica Grounding:', err);
        });
    }
}
