// Ejercicio Respiración 4-7-8 - Serenity

let breathingAnim = null;
let practiceStartTime = null;

function startBreathing() {
    if (!breathingAnim) {
        breathingAnim = new BreathingAnimation('breathingContainer', {
            inhale: 4,
            hold: 7,
            exhale: 8
        });
    }
    practiceStartTime = Date.now();
    breathingAnim.start();
}

function stopBreathing() {
    if (breathingAnim) {
        breathingAnim.stop();
    }
    // Mostrar botón para completar práctica
    document.getElementById('completePracticeBtn').style.display = 'inline-block';
}

async function completePractice() {
    const messageEl = document.getElementById('practiceMessage');
    const duration = practiceStartTime ? Math.round((Date.now() - practiceStartTime) / 60000) : 5; // en minutos
    
    try {
        if (window.dashboardAPI) {
            const techniqueName = 'Respiración 4-7-8';
            const techniqueId = window.getTechniqueIdByName ? window.getTechniqueIdByName(techniqueName) : null;
            
            const response = await window.dashboardAPI.logPractice({
                technique: techniqueName,
                techniqueId: techniqueId,
                duration: duration || 5,
                intensityBefore: 7,
                intensityAfter: 3,
                type: 'exercise',
                completed: true
            });
            
            messageEl.style.display = 'block';
            messageEl.innerHTML = '<p style="color: #27ae60; font-weight: bold;">✓ Práctica guardada correctamente</p>';
            messageEl.innerHTML += '<p style="font-size: 0.9rem; color: #7f8c8d;">Tu progreso ha sido actualizado</p>';
            
            // Limpiar UI
            document.getElementById('completePracticeBtn').style.display = 'none';
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        } else {
            console.error('Dashboard API no disponible');
            messageEl.style.display = 'block';
            messageEl.innerHTML = '<p style="color: #e74c3c;">Error: No se pudo guardar la práctica</p>';
        }
    } catch (error) {
        console.error('Error al guardar práctica:', error);
        messageEl.style.display = 'block';
        messageEl.innerHTML = '<p style="color: #e74c3c;">Error: ' + error.message + '</p>';
    }
}
