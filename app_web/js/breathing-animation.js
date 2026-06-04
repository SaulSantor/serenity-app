// Animación de respiración guiada
class BreathingAnimation {
    constructor(containerId, pattern = { inhale: 4, hold: 7, exhale: 8 }) {
        this.container = document.getElementById(containerId);
        this.pattern = pattern;
        this.isRunning = false;
        this.init();
    }

    init() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="breathing-circle">
                <div class="breath-text"></div>
                <div class="breath-counter"></div>
            </div>
        `;

        this.circle = this.container.querySelector('.breathing-circle');
        this.textEl = this.container.querySelector('.breath-text');
        this.counterEl = this.container.querySelector('.breath-counter');
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        this.circle.style.transform = 'scale(0.8)';
        this.textEl.textContent = '';
        this.counterEl.textContent = '';
    }

    async animate() {
        while (this.isRunning) {
            // Fase 1: Inhalar
            await this.phase('Inhala', this.pattern.inhale, 1.3);
            
            if (!this.isRunning) break;
            
            // Fase 2: Sostener
            await this.phase('Sostén', this.pattern.hold, 1.3);
            
            if (!this.isRunning) break;
            
            // Fase 3: Exhalar
            await this.phase('Exhala', this.pattern.exhale, 0.8);
            
            if (!this.isRunning) break;
            
            // Pequeña pausa
            await this.sleep(1000);
        }
    }

    async phase(text, duration, scale) {
        this.textEl.textContent = text;
        this.circle.style.transition = `transform ${duration}s ease-in-out`;
        this.circle.style.transform = `scale(${scale})`;

        // Contador descendente
        for (let i = duration; i > 0; i--) {
            if (!this.isRunning) break;
            this.counterEl.textContent = i;
            await this.sleep(1000);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Estilos CSS para la animación
const breathingStyles = `
<style id="breathing-animation-styles">
.breathing-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    margin: 20px 0;
}

.breathing-circle {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0 0 60px rgba(102, 126, 234, 0.5);
    transform: scale(0.8);
    transition: transform 4s ease-in-out;
}

.breath-text {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 10px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.breath-counter {
    color: rgba(255,255,255,0.9);
    font-size: 3rem;
    font-weight: 700;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.breathing-controls {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
}

.breathing-controls button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s;
}

.breathing-controls .btn-start {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.breathing-controls .btn-stop {
    background: #e74c3c;
    color: white;
}

.breathing-controls button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.video-wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
    margin: 20px 0;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.video-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 12px;
}
</style>
`;

// Inyectar estilos si no existen
if (!document.getElementById('breathing-animation-styles')) {
    document.head.insertAdjacentHTML('beforeend', breathingStyles);
}
